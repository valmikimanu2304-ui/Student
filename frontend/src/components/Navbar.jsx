import React, { useState, useEffect } from 'react';
import { 
  ScanFace, Sun, Moon, Maximize2, Minimize2, LogOut, 
  User, ShieldCheck, Clock, Bell, Radio
} from 'lucide-react';

export default function Navbar({ user, role, onLogout, darkMode, setDarkMode, onNavigate, activePage }) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 text-white">
              <ScanFace className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                FaceTrack<span className="text-blue-500 font-extrabold">.AI</span>
              </span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/70 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                PRO 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              AI Smart Attendance Management
            </p>
          </div>
        </div>

        {/* Live Clock & Navigation Quick Shortcuts */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 border border-slate-200 dark:border-slate-700/60">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
              {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {time.toLocaleTimeString()}
            </span>
          </div>

          <button
            onClick={() => onNavigate('live-recognition')}
            className={`flex items-center space-x-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              activePage === 'live-recognition'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
            }`}
          >
            <Radio className="h-3 w-3 animate-ping" />
            <span>Live Scanner</span>
          </button>
        </div>

        {/* Actions & User Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          {/* User Badge */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs shadow">
              {user?.full_name ? user.full_name.charAt(0) : (user?.username ? user.username.charAt(0).toUpperCase() : 'A')}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.full_name || user?.username || 'Administrator'}
              </div>
              <div className="flex items-center space-x-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {role === 'admin' ? 'System Administrator' : 'Student'}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
