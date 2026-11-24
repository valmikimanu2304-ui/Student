import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Calendar, Download, Plus, 
  Trash2, RefreshCw, FileText, CheckCircle2, 
  AlertTriangle, Clock, Users, ArrowUpDown 
} from 'lucide-react';
import { api } from '../utils/api';

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Manual Mark Modal
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [modalStudentId, setModalStudentId] = useState('');
  const [modalStatus, setModalStatus] = useState('Present');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalTime, setModalTime] = useState(new Date().toTimeString().split(' ')[0]);
  const [modalNotes, setModalNotes] = useState('Manual Entry by Admin');
  const [modalSaving, setModalSaving] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (department !== 'all') params.department = department;
      if (status !== 'all') params.status = status;
      if (dateFilter) params.date = dateFilter;

      const data = await api.getAttendance(params);
      setRecords(data.records || []);
    } catch (err) {
      console.error('Failed to fetch attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [department, status, dateFilter]);

  // Load students for modal dropdown
  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await api.getStudents();
        setStudents(data.students || []);
        if (data.students?.length > 0) {
          setModalStudentId(data.students[0].student_id);
        }
      } catch (err) {}
    }
    loadStudents();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await api.deleteAttendance(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    }
  };

  const handleManualMarkSubmit = async (e) => {
    e.preventDefault();
    setModalSaving(true);
    try {
      await api.manualMarkAttendance({
        student_id: modalStudentId,
        date: modalDate,
        time: modalTime,
        status: modalStatus,
        notes: modalNotes
      });
      setShowModal(false);
      fetchRecords();
    } catch (err) {
      alert(err.message || 'Failed to mark attendance');
    } finally {
      setModalSaving(false);
    }
  };

  const departmentsList = [
    "Computer Science",
    "Information Technology",
    "AI & Data Science",
    "Electronics & Comm",
    "Mechanical Engineering"
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendance Logs & Audit Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, inspect facial verification confidence, and manually override student records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Manual Entry</span>
          </button>

          <a
            href="/api/reports/export/pdf"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <FileText className="h-4 w-4 text-rose-500" />
            <span>Export PDF</span>
          </a>

          <a
            href="/api/reports/export/csv"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, roll..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Select */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departmentsList.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Search Button & Reset */}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDepartment('all');
                setStatus('all');
                setDateFilter('');
                fetchRecords();
              }}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset Filters"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

        </form>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 pl-4">#</th>
                <th className="py-3">Student Info</th>
                <th className="py-3">Department</th>
                <th className="py-3">Date</th>
                <th className="py-3">Time</th>
                <th className="py-3">Status</th>
                <th className="py-3">Confidence</th>
                <th className="py-3">Method</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading attendance audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 pl-4 text-slate-400 font-mono text-[11px]">
                      {i + 1}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                          {r.student_name ? r.student_name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {r.student_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {r.student_id} {r.roll_no ? `• ${r.roll_no}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      {r.department}
                    </td>
                    <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {r.date}
                    </td>
                    <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {r.time}
                    </td>
                    <td className="py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Present'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : r.status === 'Late'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {r.confidence}%
                      </span>
                    </td>
                    <td className="py-3.5 text-[11px] text-slate-400">
                      {r.verification_method}
                    </td>
                    <td className="py-3.5 pr-4 text-right">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No attendance records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Mark Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Manual Attendance Entry / Override
            </h2>

            <form onSubmit={handleManualMarkSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Student
                </label>
                <select
                  value={modalStudentId}
                  onChange={(e) => setModalStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.student_id} - {s.full_name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={modalTime}
                    onChange={(e) => setModalTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Present', 'Late', 'Absent'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`py-2 rounded-lg font-bold border transition ${
                        modalStatus === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Reason
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="e.g. Medical leave, approved late slip..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow transition disabled:opacity-50"
                >
                  {modalSaving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
