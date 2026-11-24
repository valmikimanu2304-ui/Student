import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Percent, Radio, Scan, 
  ArrowUpRight, TrendingUp, RefreshCw, Clock, 
  ShieldCheck, FileSpreadsheet, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto refresh every 10 seconds to keep live feed updated
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-500">Loading AI Attendance Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-xl">
        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Deep Learning AI Vision Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Biometric Attendance Command Center
            </h1>
            <p className="text-blue-100/80 text-sm mt-1 max-w-xl">
              Real-time automated face recognition stream, anti-duplicate verification, and departmental attendance intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('live-recognition')}
              className="flex items-center space-x-2 rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/30 transition transform hover:-translate-y-0.5"
            >
              <Radio className="h-4 w-4 animate-ping" />
              <span>Launch Live Scanner</span>
            </button>

            <button
              onClick={() => onNavigate('face-registration')}
              className="flex items-center space-x-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition"
            >
              <Scan className="h-4 w-4 text-cyan-300" />
              <span>Enroll Face</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.total_students || 0}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-500 font-semibold flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> 100%
              </span>
              <span>active student profiles</span>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Present Today</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats?.present_today || 0}
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                {stats?.on_time_today || 0} on-time
              </span>
              <span>•</span>
              <span className="text-amber-500 font-medium">
                {stats?.late_today || 0} late
              </span>
            </div>
          </div>
        </div>

        {/* Absent Today */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Absent Today</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats?.absent_today || 0}
            </div>
            <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Remaining to check-in</span>
            </div>
          </div>
        </div>

        {/* Today's Attendance Percentage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance Rate</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/50">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats?.attendance_percentage || 0}
              </span>
              <span className="text-lg font-bold text-slate-500">%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, stats?.attendance_percentage || 0)}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Middle Grid: 7-Day Trend Chart & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Trend Interactive Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                7-Day Attendance Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily present vs late attendance logs verified by AI engine
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                <span className="text-slate-600 dark:text-slate-300">On-Time</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-300">Late</span>
              </div>
            </div>
          </div>

          {/* SVG Responsive Bar Chart */}
          <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2">
            {stats?.trends?.labels?.map((label, idx) => {
              const present = stats.trends.present[idx] || 0;
              const late = stats.trends.late[idx] || 0;
              const maxVal = Math.max(stats.total_students || 10, ...stats.trends.present);
              const presentHeight = (present / maxVal) * 180;
              const lateHeight = (late / maxVal) * 180;

              return (
                <div key={label} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-20">
                    Present: {present} | Late: {late}
                  </div>

                  <div className="w-full max-w-[36px] flex flex-col justify-end items-center gap-1">
                    {/* Late Bar */}
                    {late > 0 && (
                      <div 
                        className="w-full bg-amber-400 hover:bg-amber-500 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(4, lateHeight)}px` }}
                      />
                    )}
                    {/* Present Bar */}
                    <div 
                      className={`w-full bg-blue-600 hover:bg-blue-500 transition-all ${late === 0 ? 'rounded-t-sm' : ''}`}
                      style={{ height: `${Math.max(8, presentHeight)}px` }}
                    />
                  </div>

                  <span className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Attendance Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Department Performance
              </h2>
              <span className="text-[11px] font-semibold text-blue-500">Today</span>
            </div>

            <div className="space-y-4">
              {stats?.department_stats?.map((dept) => (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {dept.department}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {dept.present}/{dept.total} ({dept.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        dept.rate >= 80 
                          ? 'bg-emerald-500' 
                          : dept.rate >= 60 
                            ? 'bg-blue-500' 
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="w-full mt-6 flex items-center justify-center space-x-2 rounded-xl border border-slate-200 dark:border-slate-700/80 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-blue-500" />
            <span>Generate Full Attendance Report</span>
          </button>
        </div>

      </div>

      {/* Recent Live Recognition Stream */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Live Biometric Feed
            </h2>
          </div>
          <button
            onClick={() => onNavigate('attendance-records')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All Records →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 pl-2">Student</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">AI Confidence</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {stats?.recent_activity?.length > 0 ? (
                stats.recent_activity.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 pl-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {item.student_name ? item.student_name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.student_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.student_id} {item.roll_no ? `• ${item.roll_no}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {item.department}
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                      {item.date} <span className="text-slate-400 font-normal">{item.time}</span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        {item.confidence}% Match
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'Present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : item.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right text-slate-400 text-[11px]">
                      {item.verification_method}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No attendance records captured yet today. Launch the live scanner to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
