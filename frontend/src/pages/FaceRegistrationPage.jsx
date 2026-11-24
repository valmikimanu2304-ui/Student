import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CheckCircle2, AlertCircle, Scan, Trash2, 
  ArrowRight, ShieldCheck, Sparkles, RefreshCw, UserCheck
} from 'lucide-react';
import { api } from '../utils/api';
import { soundFX } from '../utils/audio';

export default function FaceRegistrationPage({ onNavigate }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [capturedImages, setCapturedImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const sampleGuides = [
    { label: "Frontal View", tip: "Look straight into the lens with a neutral expression." },
    { label: "Slight Left", tip: "Turn your head gently 15° to the left." },
    { label: "Slight Right", tip: "Turn your head gently 15° to the right." },
    { label: "Gentle Smile", tip: "Smile naturally facing the camera." },
    { label: "Slight Up/Down", tip: "Tilt head slightly upward or downward." }
  ];

  // Fetch registered students to select from
  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await api.getStudents();
        setStudents(data.students || []);
        if (data.students?.length > 0 && !selectedStudentId) {
          // Default to first student needing registration, or first student
          const needsFace = data.students.find(s => !s.face_registered);
          setSelectedStudentId(needsFace ? needsFace.student_id : data.students[0].student_id);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      }
    }
    loadStudents();
  }, []);

  // Camera Management
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setErrorMessage('Could not access webcam. Please check browser permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Capture a single frame
  const captureSample = () => {
    if (!videoRef.current || capturedImages.length >= 5) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedImages(prev => [...prev, dataUrl]);
    soundFX.playSuccess();
  };

  // Auto-capture 5 frames sequentially with 1 second delay
  const autoCaptureAll = () => {
    if (!videoRef.current) return;
    setCapturedImages([]);
    let count = 0;
    const interval = setInterval(() => {
      if (count < 5 && videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImages(prev => [...prev, dataUrl]);
        soundFX.playSuccess();
        count++;
      } else {
        clearInterval(interval);
      }
    }, 900);
  };

  const removeSample = (index) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Submit to backend
  const handleSubmitEnrollment = async () => {
    if (!selectedStudentId) {
      setErrorMessage('Please select a student ID to enroll.');
      return;
    }
    if (capturedImages.length === 0) {
      setErrorMessage('Please capture at least 1 face sample.');
      return;
    }

    setEnrolling(true);
    setErrorMessage(null);
    setResultMessage(null);

    try {
      const res = await api.registerFace(selectedStudentId, capturedImages);
      setResultMessage(res.message);
      soundFX.playSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Face registration failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const selectedStudentObj = students.find(s => s.student_id === selectedStudentId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Biometric Face Enrollment Studio
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Capture multi-angle high-resolution facial scans to generate 128-dimensional biometric embeddings.
        </p>
      </div>

      {/* Success Notification */}
      {resultMessage && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Enrollment Complete!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                {resultMessage}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onNavigate('live-recognition')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              Test Live Recognition →
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2.5">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Controls & Student Select, Right Camera View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 cols): Student selection & Guides */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Student Selector Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              1. Select Student Profile
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Choose Student
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setResultMessage(null);
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {students.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_id} - {s.full_name} ({s.department}) {s.face_registered ? '✓ [Enrolled]' : '⚠️ [Pending Face]'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Student Preview Info */}
            {selectedStudentObj && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedStudentObj.full_name}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStudentObj.face_registered 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                  }`}>
                    {selectedStudentObj.face_registered ? 'Face Registered' : 'Needs Registration'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedStudentObj.department} • {selectedStudentObj.year} • Roll: {selectedStudentObj.roll_no || 'N/A'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Email: {selectedStudentObj.email}
                </div>
              </div>
            )}
          </div>

          {/* Sample Guidance Steps */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Capture Multi-Angle Angles ({capturedImages.length}/5)
            </h2>

            <div className="space-y-2">
              {sampleGuides.map((guide, i) => {
                const isDone = capturedImages.length > i;
                const isCurrent = capturedImages.length === i;

                return (
                  <div 
                    key={guide.label}
                    className={`flex items-start space-x-2.5 p-2 rounded-xl text-xs transition ${
                      isDone 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' 
                        : isCurrent 
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200' 
                          : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                          isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{guide.label}</div>
                      <div className="text-[10px] opacity-80">{guide.tip}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick action buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={captureSample}
                disabled={capturedImages.length >= 5 || !cameraActive}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Single Sample ({capturedImages.length}/5)</span>
              </button>

              <button
                type="button"
                onClick={autoCaptureAll}
                disabled={!cameraActive}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto-Burst 5 Angles in Sequence</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Camera Viewfinder and Captured Gallery */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Camera Viewfinder */}
          <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`h-full w-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Oval Face Positioning Guide Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="h-64 w-48 sm:h-72 sm:w-56 rounded-[50%] border-2 border-dashed border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center">
                  <div className="text-[10px] text-cyan-300 font-mono text-center px-4 py-1 rounded bg-slate-900/60 backdrop-blur-sm">
                    Position Face in Oval
                  </div>
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="text-center p-6 text-slate-400">
                <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <span className="text-xs">Camera preview offline</span>
              </div>
            )}
          </div>

          {/* Captured Samples Strip */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Captured Samples ({capturedImages.length} of 5)
              </span>
              {capturedImages.length > 0 && (
                <button
                  onClick={() => setCapturedImages([])}
                  className="text-xs text-rose-500 hover:underline flex items-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {capturedImages.length > 0 ? (
              <div className="grid grid-cols-5 gap-2.5">
                {capturedImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square">
                    <img src={imgUrl} alt={`Sample ${idx+1}`} className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeSample(idx)}
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                      title="Remove sample"
                    >
                      <Trash2 className="h-4 w-4 text-rose-400" />
                    </button>
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded bg-slate-900/80 text-white">
                      #{idx+1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                No samples captured yet. Click 'Capture Single Sample' or 'Auto-Burst' above.
              </div>
            )}

            {/* Submit Enrollment Button */}
            <button
              onClick={handleSubmitEnrollment}
              disabled={enrolling || capturedImages.length === 0}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {enrolling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating 128-D Deep Facial Embeddings...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Complete Biometric Enrollment ({capturedImages.length} Samples)</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
