import React, { useState, useEffect } from 'react';
import { 
  Settings, Clock, ShieldCheck, Sliders, Building, 
  CheckCircle2, RefreshCw, AlertCircle, Save 
} from 'lucide-react';
import { api } from '../utils/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    org_name: 'Apex Institute of Technology',
    academic_year: '2026-2027',
    checkin_start: '08:00:00',
    late_threshold: '09:30:00',
    checkin_end: '17:00:00',
    face_match_threshold: '0.38',
    duplicate_prevention: 'true'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        if (data && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
    setSuccessMessage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    try {
      await api.saveSettings(settings);
      setSuccessMessage('System configuration saved successfully!');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          System Configuration & Biometric Policies
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure institutional operating hours, attendance thresholds, and AI vision inference hyperparameters.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-4 text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Organization Details */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="h-4 w-4 text-blue-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Institutional Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Institute / University Name
              </label>
              <input
                type="text"
                name="org_name"
                value={settings.org_name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Session
              </label>
              <input
                type="text"
                name="academic_year"
                value={settings.academic_year}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours & Late Threshold */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Attendance Schedule & Punctuality Thresholds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Check-in Gate Opens
              </label>
              <input
                type="time"
                step="1"
                name="checkin_start"
                value={settings.checkin_start}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Earliest allowed arrival</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Late Mark Threshold *
              </label>
              <input
                type="time"
                step="1"
                name="late_threshold"
                value={settings.late_threshold}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white font-semibold"
              />
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Arrivals past this time are flagged 'Late'</p>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Check-in Gate Closes
              </label>
              <input
                type="time"
                step="1"
                name="checkin_end"
                value={settings.checkin_end}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">End of daily attendance</p>
            </div>
          </div>
        </div>

        {/* AI Face Recognition Hyperparameters */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sliders className="h-4 w-4 text-cyan-500" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              AI Vision Inference Parameters
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Cosine Distance Verification Threshold:
                </label>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {settings.face_match_threshold}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.65"
                step="0.01"
                name="face_match_threshold"
                value={settings.face_match_threshold}
                onChange={handleChange}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.30 (Strict Match / High Security)</span>
                <span>0.38 (Recommended for OpenCV SFace)</span>
                <span>0.65 (Lenient Match)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Anti-Duplicate Daily Enforcement
                </div>
                <div className="text-[11px] text-slate-400">
                  Prevents multiple attendance entries on the same day for the same student.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                Active & Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 hover:opacity-95 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Policies...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save System Settings</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
