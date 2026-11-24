import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, FileText, Download, Calendar, 
  Filter, CheckCircle2, AlertTriangle, TrendingUp, 
  BarChart3, Users, Award, ShieldAlert 
} from 'lucide-react';
import { api } from '../utils/api';

export default function AttendanceReportsPage() {
  const [timeRange, setTimeRange] = useState('month'); // 'today', 'week', 'month', 'all'
  const [department, setDepartment] = useState('all');
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load attendance data and students
  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let dateFrom = '';

      if (timeRange === 'today') {
        dateFrom = today.toISOString().split('T')[0];
      } else if (timeRange === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);
        dateFrom = lastWeek.toISOString().split('T')[0];
      } else if (timeRange === 'month') {
        const lastMonth = new Date(today);
        lastMonth.setDate(today.getDate() - 30);
        dateFrom = lastMonth.toISOString().split('T')[0];
      }

      const params = {};
      if (department !== 'all') params.department = department;
      if (dateFrom) params.date_from = dateFrom;

      const [attData, stuData] = await Promise.all([
        api.getAttendance(params),
        api.getStudents()
      ]);

      setRecords(attData.records || []);
      setStudents(stuData.students || []);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange, department]);

  // Compute Analytics
  const totalSessions = records.length;
  const presentCount = records.filter(r => r.status === 'Present').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

  // Student specific attendance percentages
  const studentMetrics = students.map(stu => {
    const stuRecords = records.filter(r => r.student_id === stu.student_id);
    const attended = stuRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    // Assume 14 total class sessions in this evaluation period
    const totalPossible = Math.max(stuRecords.length, 12);
    const pct = Math.min(100, Math.round((attended / totalPossible) * 100));
    return {
      ...stu,
      attendedCount: attended,
      totalPossible,
      percentage: pct,
      isAtRisk: pct < 75
    };
  });

  const atRiskStudents = studentMetrics.filter(s => s.isAtRisk);
  const topStudents = [...studentMetrics].sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  const departmentsList = [
    "Computer Science",
    "Information Technology",
    "AI & Data Science",
    "Electronics & Comm",
    "Mechanical Engineering"
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Intelligence & Regulatory Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate formal academic compliance reports, calculate attendance percentages, and download certified PDFs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={`/api/reports/export/pdf?department=${department}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:opacity-95 transition"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Official PDF</span>
          </a>

          <a
            href={`/api/reports/export/csv?department=${department}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Report Controls Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Time range buttons */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[
            { id: 'today', label: 'Daily (Today)' },
            { id: 'week', label: 'Weekly (7 Days)' },
            { id: 'month', label: 'Monthly (30 Days)' },
            { id: 'all', label: 'All Sessions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeRange === tab.id
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Department Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Department:</span>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departmentsList.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Logged Attendances</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalSessions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Verified check-in sessions</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Aggregate Attendance Rate</div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {attendanceRate}%
          </div>
          <div className="text-[11px] text-emerald-500 font-semibold mt-1">On-time & verified</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Punctual Check-Ins</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {presentCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{lateCount} logged after late threshold</div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="text-xs text-slate-400 font-medium">Shortage Warning (&lt;75%)</div>
          <div className={`text-2xl font-extrabold mt-1 ${atRiskStudents.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {atRiskStudents.length} Students
          </div>
          <div className="text-[11px] text-rose-500 mt-1">Require academic notice</div>
        </div>

      </div>

      {/* Grid: Top Students & Low Attendance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Attending Students */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Exemplary Attendance (Top Performers)
            </h2>
          </div>

          <div className="space-y-3">
            {topStudents.map((s, i) => (
              <div key={s.student_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-400 font-mono">#{i + 1}</span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {s.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {s.student_id} • {s.department}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {s.percentage}%
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {s.attendedCount} sessions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Attendance Warning List */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Attendance Shortage Alerts (&lt; 75%)
            </h2>
          </div>

          {atRiskStudents.length > 0 ? (
            <div className="space-y-3">
              {atRiskStudents.map((s) => (
                <div key={s.student_id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs">
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200">
                      {s.full_name}
                    </div>
                    <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      {s.student_id} • {s.department}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                      {s.percentage}%
                    </span>
                    <div className="text-[10px] text-rose-500">
                      Ineligible for Exams
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
              All students meet the 75% attendance criteria for the selected range.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
