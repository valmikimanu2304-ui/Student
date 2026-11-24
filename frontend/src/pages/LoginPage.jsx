import React, { useState } from 'react';
import { 
  ScanFace, Lock, Mail, ArrowRight, ShieldCheck, 
  Sparkles, GraduationCap, CheckCircle2, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { api } from '../utils/api';

export default function LoginPage({ onLoginSuccess }) {
  const [role, setRole] = useState('admin'); // 'admin' or 'student'
  const [identifier, setIdentifier] = useState('admin@smartattendance.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleSwitch = (selectedRole) => {
    setRole(selectedRole);
    setError(null);
    if (selectedRole === 'admin') {
      setIdentifier('admin@smartattendance.edu');
      setPassword('admin123');
    } else {
      setIdentifier('alex.vance@smartattendance.edu');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(identifier, password);
      onLoginSuccess(res.user, res.token, res.student);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      
      {/* Dynamic Glowing Background Effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="relative w-full max-w-md z-10">
        
        {/* Top Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-indigo-500/25 mb-4">
            <ScanFace className="h-10 w-10 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            FaceTrack<span className="text-cyan-400">.AI</span> Pro
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-Based Smart Attendance Management System
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-800/80 mb-6 border border-slate-700/60">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'admin'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('student')}
              className={`flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Student Portal</span>
            </button>
          </div>

          {/* Quick Demo Autofill Notice */}
          <div className="mb-5 rounded-lg bg-blue-950/40 border border-blue-800/50 p-2.5 flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Demo credentials pre-loaded for instant access!</span>
            </div>
            <button
              type="button"
              onClick={() => handleRoleSwitch(role)}
              className="text-[11px] underline font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Autofill
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 rounded-lg bg-rose-950/50 border border-rose-800/60 p-3 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {role === 'admin' ? 'Administrator Email or Username' : 'Student ID or Registered Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={role === 'admin' ? "admin@smartattendance.edu" : "alex.vance@smartattendance.edu"}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/25 hover:opacity-95 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In as {role === 'admin' ? 'Administrator' : 'Student'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Switch Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Switch demo accounts:</p>
            <div className="flex justify-center space-x-2">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition"
              >
                admin / admin123
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('student')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition"
              >
                student / student123
              </button>
            </div>
          </div>

        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured with OpenCV YuNet & 128-D Biometric Encryption</span>
        </div>

      </div>

    </div>
  );
}
