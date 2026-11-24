import React from 'react';
import { 
  LayoutDashboard, Scan, UserCheck, CalendarCheck, FileSpreadsheet, 
  Users, UserPlus, Settings, GraduationCap, ChevronRight, Radio
} from 'lucide-react';

export default function Sidebar({ activePage, onNavigate, role, isOpen, setIsOpen }) {
  const adminNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'live-recognition', label: 'Live AI Scanner', icon: Radio, highlight: true },
    { id: 'face-registration', label: 'Face Registration', icon: Scan },
    { id: 'attendance-records', label: 'Attendance Records', icon: CalendarCheck },
    { id: 'reports', label: 'Analytics & Reports', icon: FileSpreadsheet },
    { id: 'student-management', label: 'Student Directory', icon: Users },
    { id: 'student-registration', label: 'Student Enrollment', icon: UserPlus },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const studentNavItems = [
    { id: 'student-portal', label: 'My Attendance Portal', icon: GraduationCap },
    { id: 'live-recognition', label: 'Live Face Scanner', icon: Radio, highlight: true },
  ];

  const items = role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:sticky top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col justify-between 
        border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 
        backdrop-blur-md transition-all duration-300 ease-in-out
        ${isOpen ? 'left-0' : '-left-64 lg:left-0'}
      `}>
        {/* Navigation Links */}
        <div className="flex flex-col space-y-1.5 p-3.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation Menu
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (setIsOpen) setIsOpen(false);
                }}
                className={`
                  group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' 
                    : item.highlight 
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/50 dark:border-rose-900/40' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-rose-500' : 'text-slate-400 group-hover:text-blue-500'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.highlight ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                ) : (
                  isActive && <ChevronRight className="h-4 w-4 text-white/80" />
                )}
              </button>
            );
          })}

          {/* Quick toggle to student portal for testing if in admin mode */}
          {role === 'admin' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Student View
              </div>
              <button
                onClick={() => {
                  onNavigate('student-portal');
                  if (setIsOpen) setIsOpen(false);
                }}
                className={`
                  group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all
                  ${activePage === 'student-portal'
                    ? 'bg-indigo-600 text-white'
                    : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <span>Student Portal View</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* System Status Card in Sidebar Footer */}
        <div className="p-3.5">
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-3.5 text-white shadow-inner border border-slate-700/60">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/70">
              <span className="text-[11px] font-semibold text-slate-300">Vision Engine Status</span>
              <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>YuNet + SFace</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Embedding Vector:</span>
              <span className="font-mono text-cyan-300">128-D Cosine</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Detection Latency:</span>
              <span className="font-mono text-emerald-300">~18ms</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
