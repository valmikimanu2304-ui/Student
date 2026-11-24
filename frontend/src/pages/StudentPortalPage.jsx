import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, CalendarCheck, CheckCircle2, Clock, 
  AlertTriangle, ShieldCheck, UserCheck, Calendar as CalendarIcon, 
  Search, ArrowUpRight 
} from 'lucide-react';
import { api } from '../utils/api';

export default function StudentPortalPage({ studentId = "CS2026001", studentUser = null }) {
  const currentId = studentUser?.student_id || studentId;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    async function loadPortal() {
      try {
        setLoading(true);
        const res = await api.getStudentPortal(currentId);
        setData(res);
      } catch (err) {
        console.error('Failed to load student portal:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPortal();
  }, [currentId]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stu = data?.student || {};
  const stats = data?.stats || {};
  const today = data?.today;
  const history = data?.history || [];
  const pct = stats.attendance_percentage || 0;

  // Filter history
  const filteredHistory = history.filter(h => 
    h.date?.includes(historySearch) || h.status?.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Generate current month days
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = data?.month_calendar?.[dStr];
    monthDays.push({
      day: d,
      dateStr: dStr,
      status: entry?.status || (new Date(dStr) > now ? 'future' : 'Absent')
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Student Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-inner">
              {stu.full_name ? stu.full_name.charAt(0) : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  {stu.full_name || 'Alexander Vance'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                  Active Student
                </span>
              </div>
              <div className="text-xs text-blue-100/80 font-mono mt-1">
                ID: {stu.student_id} • Roll: {stu.roll_no || 'CS-01'}
              </div>
              <div className="text-xs text-blue-200/70 mt-0.5">
                {stu.department} • {stu.year} ({stu.semester})
              </div>
            </div>
          </div>

          {/* Academic Eligibility Badge */}
          <div className="flex flex-col md:items-end">
            <div className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
              Semester Exam Eligibility
            </div>
            <div className={`mt-1 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              pct >= 75 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
            }`}>
              {pct >= 75 ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Eligible & Good Standing ({pct}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Academic Warning (&lt; 75%)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Attendance Rate Gauge */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Overall Attendance Rate</div>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {pct}
            </span>
            <span className="text-base font-bold text-slate-500">%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 rounded-full" 
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>

        {/* Total Sessions Attended */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Attended Sessions</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {stats.present_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Punctual & verified</div>
        </div>

        {/* Late Check-ins */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Late Check-Ins</div>
          <div className="text-3xl font-extrabold text-amber-500 font-mono mt-1">
            {stats.late_count || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Arrived past threshold</div>
        </div>

        {/* Today's Verification Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Today's Check-In</div>
          {today ? (
            <div className="mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                today.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {today.status} at {today.time}
              </span>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                Verified via AI Vision
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                Not Marked Yet Today
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                Scan face at kiosk
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Monthly Attendance Calendar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })} Attendance Grid
            </h2>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Present</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-slate-500">Late</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-500">Absent/Off</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-[10px] font-bold uppercase text-slate-400 py-1">
              {day}
            </div>
          ))}

          {monthDays.map(item => {
            const isPresent = item.status === 'Present';
            const isLate = item.status === 'Late';
            const isFuture = item.status === 'future';

            return (
              <div 
                key={item.day}
                className={`py-2 rounded-xl text-xs font-mono font-semibold transition flex flex-col items-center justify-center ${
                  isPresent 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : isLate 
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : isFuture
                        ? 'text-slate-300 dark:text-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border border-slate-100 dark:border-slate-800'
                }`}
              >
                <span>{item.day}</span>
                {isPresent && <span className="h-1 w-1 rounded-full bg-emerald-500 mt-1" />}
                {isLate && <span className="h-1 w-1 rounded-full bg-amber-500 mt-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Attendance History Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Personal Attendance Log History
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search date or status..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="pb-3 pl-2">Date</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3 text-right pr-2">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-2 font-mono text-slate-700 dark:text-slate-200 font-semibold">
                      {item.date}
                    </td>
                    <td className="py-3 font-mono text-slate-500 dark:text-slate-400">
                      {item.time}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                      {item.confidence}% Match
                    </td>
                    <td className="py-3 pr-2 text-right text-slate-400 text-[11px]">
                      {item.verification_method}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No attendance records found.
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
