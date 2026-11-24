import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Radio, ShieldCheck, CheckCircle2, 
  AlertTriangle, UserX, RefreshCw, Volume2, VolumeX, 
  Sparkles, Maximize, Clock, Scan, UserCheck, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { soundFX } from '../utils/audio';

export default function LiveRecognitionPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [autoMark, setAutoMark] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Real-time detection state
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [lastMarkedStudent, setLastMarkedStudent] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState([]);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [unknownAlert, setUnknownAlert] = useState(false);
  const [fps, setFps] = useState(0);

  // 1. Enumerate video devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devList = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devList.filter(d => d.kind === 'videoinput');
        setDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.warn('Error querying camera devices:', err);
      }
    }
    getDevices();
  }, []);

  // 2. Start / Stop Camera Stream
  const startCamera = async (deviceId) => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. Please check browser permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setDetectedFaces([]);
  };

  useEffect(() => {
    startCamera(selectedDevice);
    return () => stopCamera();
  }, [selectedDevice]);

  // 3. Frame processing loop: sends frames to backend AI engine
  useEffect(() => {
    let animId;
    let lastTime = Date.now();
    let frameCount = 0;

    const processFrame = async () => {
      if (!cameraActive || !videoRef.current || isProcessingRef.current) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      if (video.readyState !== 4) {
        animId = requestAnimationFrame(processFrame);
        return;
      }

      // Throttle recognition requests to ~300ms intervals for smooth backend throughput
      const now = Date.now();
      if (now - lastTime < 350) {
        animId = requestAnimationFrame(processFrame);
        return;
      }
      lastTime = now;

      // Draw video frame to hidden canvas to grab JPEG
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      isProcessingRef.current = true;

      try {
        const res = await api.recognizeFace(dataUrl, autoMark);
        setDetectedFaces(res.faces || []);

        // Calculate FPS
        frameCount++;
        setFps(Math.round(1000 / (Date.now() - now + 350)));

        // Handle newly marked attendance
        if (res.newly_marked && res.newly_marked.length > 0) {
          const newly = res.newly_marked[0];
          setLastMarkedStudent(newly);
          setDuplicateAlert(null);
          setUnknownAlert(false);

          // Add to live attendance stream
          setAttendanceLog(prev => [
            { ...newly, id: Date.now() },
            ...prev.slice(0, 19)
          ]);

          // Sound effect
          if (soundEnabled) {
            soundFX.playSuccess();
          }

          // Confetti celebration for successful check-in
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.7 }
          });
        } else {
          // Check if any face is already marked
          const dupFace = res.faces.find(f => f.already_marked);
          if (dupFace) {
            setDuplicateAlert({
              student_id: dupFace.student_id,
              name: dupFace.student_info?.full_name || dupFace.student_id,
              time: dupFace.previous_checkin
            });
            setUnknownAlert(false);
          } else {
            const hasUnknown = res.faces.some(f => f.student_id === 'Unknown');
            if (hasUnknown) {
              setUnknownAlert(true);
              setDuplicateAlert(null);
            } else {
              setDuplicateAlert(null);
              setUnknownAlert(false);
            }
          }
        }

        // Draw bounding boxes on the overlay canvas
        drawBoundingBoxes(res.faces || [], canvas.width, canvas.height);

      } catch (err) {
        console.warn('Face recognition error:', err);
      } finally {
        isProcessingRef.current = false;
        animId = requestAnimationFrame(processFrame);
      }
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [cameraActive, autoMark, soundEnabled]);

  // 4. Draw bounding boxes on video overlay
  const drawBoundingBoxes = (faces, origW, origH) => {
    const overlay = canvasRef.current;
    if (!overlay || !videoRef.current) return;

    overlay.width = overlay.clientWidth;
    overlay.height = overlay.clientHeight;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const scaleX = overlay.width / origW;
    const scaleY = overlay.height / origH;

    faces.forEach(f => {
      const [bx, by, bw, bh] = f.box;
      const x = bx * scaleX;
      const y = by * scaleY;
      const w = bw * scaleX;
      const h = bh * scaleY;

      const isKnown = f.student_id !== 'Unknown';
      const isAlready = f.already_marked;

      // Color scheme: Green = Verified New, Amber = Already Marked, Red = Unknown
      let color = '#10B981'; // Green
      if (isAlready) color = '#F59E0B'; // Amber
      if (!isKnown) color = '#EF4444'; // Red

      // Draw modern rounded HUD box with corner reticles
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Corner brackets
      const cornerLen = Math.min(w, h) * 0.22;
      ctx.beginPath();
      // Top-left
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      // Top-right
      ctx.moveTo(x + w - cornerLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLen);
      // Bottom-right
      ctx.moveTo(x + w, y + h - cornerLen);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w - cornerLen, y + h);
      // Bottom-left
      ctx.moveTo(x + cornerLen, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + h - cornerLen);
      ctx.stroke();

      // Semi-transparent box background
      ctx.fillStyle = isKnown ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(x, y, w, h);

      // Label background banner
      const title = isKnown 
        ? `${f.student_info?.full_name || f.student_id}` 
        : 'UNKNOWN PERSON';
      const sub = isKnown 
        ? `${f.student_id} • ${f.confidence}% Match` 
        : 'Unregistered face';

      ctx.font = 'bold 12px Inter, sans-serif';
      const textWidth = Math.max(ctx.measureText(title).width, 120);

      // Label box
      ctx.fillStyle = isAlready ? 'rgba(245, 158, 11, 0.95)' : isKnown ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x, Math.max(0, y - 38), textWidth + 24, 34, 6);
      ctx.fill();

      // Label texts
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(title, x + 8, Math.max(0, y - 22));
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText(sub, x + 8, Math.max(0, y - 8));
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              AI Face Recognition Attendance Kiosk
            </h1>
            <span className="flex items-center space-x-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping mr-1" />
              LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            OpenCV SFace deep neural network automatically marks attendance upon positive face verification.
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              soundEnabled
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Audio Feedback"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio Chime ON' : 'Muted'}</span>
          </button>

          {/* Auto-Mark Switch */}
          <button
            onClick={() => setAutoMark(!autoMark)}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              autoMark
                ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Auto-Mark {autoMark ? 'ENABLED' : 'PAUSED'}</span>
          </button>

          {/* Camera On/Off Toggle */}
          <button
            onClick={() => cameraActive ? stopCamera() : startCamera(selectedDevice)}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-md transition ${
              cameraActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {cameraActive ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            <span>{cameraActive ? 'Stop Camera' : 'Start Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main Stream & Feed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Video Stream Kiosk View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
            
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Canvas Overlay for Face Bounding Boxes */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full pointer-events-none z-10"
            />

            {/* Biometric Scanning Radar Animation Line */}
            {cameraActive && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none z-20 animate-scanline" />
            )}

            {/* Viewfinder Target Reticle */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="h-48 w-44 sm:h-64 sm:w-56 rounded-3xl border-2 border-dashed border-cyan-400/40 flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-mono text-cyan-400/80">AI RETICLE</span>
                    <span className="text-[10px] font-mono text-cyan-400/80">{fps} FPS</span>
                  </div>
                  <div className="text-center text-[10px] text-cyan-300/70 font-mono">
                    Align face inside target
                  </div>
                </div>
              </div>
            )}

            {/* Offline / Error Overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950/90 backdrop-blur-sm">
                <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-500 mb-3">
                  <CameraOff className="h-10 w-10 text-slate-400" />
                </div>
                <h2 className="text-base font-bold text-white">Camera Offline</h2>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  {cameraError || "Click 'Start Camera' to initiate the live biometric recognition scanner."}
                </p>
                <button
                  onClick={() => startCamera(selectedDevice)}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition"
                >
                  Start Camera Feed
                </button>
              </div>
            )}

            {/* HUD Status Bar in Top Left of Video */}
            {cameraActive && (
              <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 rounded-lg bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-slate-700/60 text-[11px] text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">YuNet DNN Active</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-cyan-400">{detectedFaces.length} Face{detectedFaces.length === 1 ? '' : 's'} Detected</span>
              </div>
            )}

            {/* Live Notifications inside Video View */}
            {duplicateAlert && (
              <div className="absolute bottom-4 inset-x-4 z-20 rounded-xl bg-amber-500/90 backdrop-blur-md p-3 text-white shadow-xl flex items-center justify-between animate-bounce">
                <div className="flex items-center space-x-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-200 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Already Checked In Today!</div>
                    <div className="text-[11px] text-amber-100">
                      {duplicateAlert.name} ({duplicateAlert.student_id}) marked present at {duplicateAlert.time}.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-700 text-white uppercase">
                  Duplicate Blocked
                </span>
              </div>
            )}

            {unknownAlert && !duplicateAlert && (
              <div className="absolute bottom-4 inset-x-4 z-20 rounded-xl bg-rose-600/90 backdrop-blur-md p-3 text-white shadow-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <UserX className="h-5 w-5 text-rose-200 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Unknown Individual Detected</div>
                    <div className="text-[11px] text-rose-100">
                      Face feature does not match any registered student profile.
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-800 text-white uppercase">
                  Unregistered
                </span>
              </div>
            )}

          </div>

          {/* Camera Settings / Device Selector Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Camera Source:</span>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-white text-xs focus:outline-none"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Anti-Duplicate: Enabled</span>
              </span>
              <span>•</span>
              <span>Threshold: 0.38 Cosine</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Verified Attendance Stream */}
        <div className="space-y-4">
          
          {/* Latest Verified Student Highlight Card */}
          {lastMarkedStudent ? (
            <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  JUST VERIFIED
                </span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {lastMarkedStudent.time}
                </span>
              </div>

              <div className="flex items-center space-x-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-xl shadow-md">
                  {lastMarkedStudent.full_name ? lastMarkedStudent.full_name.charAt(0) : 'S'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {lastMarkedStudent.full_name}
                  </h2>
                  <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                    {lastMarkedStudent.student_id}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lastMarkedStudent.department}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  lastMarkedStudent.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {lastMarkedStudent.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-slate-400">
              <Scan className="h-8 w-8 mx-auto mb-2 text-slate-400 animate-pulse" />
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Awaiting Student Recognition</div>
              <div className="text-[11px] text-slate-400 mt-1">Stand in front of the camera to verify attendance</div>
            </div>
          )}

          {/* Real-time Session Check-in Log */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Session Check-in Stream
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {attendanceLog.length} verified
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {attendanceLog.length > 0 ? (
                attendanceLog.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 text-xs transition hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs">
                          {log.full_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.student_id} • {log.department}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {log.time}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {log.confidence}% match
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Students recognized in this session will appear here in real time.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
