import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import LiveRecognitionPage from './pages/LiveRecognitionPage';
import FaceRegistrationPage from './pages/FaceRegistrationPage';
import AttendanceRecordsPage from './pages/AttendanceRecordsPage';
import AttendanceReportsPage from './pages/AttendanceReportsPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentRegistrationPage from './pages/StudentRegistrationPage';
import StudentPortalPage from './pages/StudentPortalPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('facetrack_theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth state
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('facetrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [role, setRole] = useState(() => {
    return localStorage.getItem('facetrack_role') || 'admin';
  });
  const [studentUser, setStudentUser] = useState(() => {
    const saved = localStorage.getItem('facetrack_student');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation state
  const [activePage, setActivePage] = useState(() => {
    return role === 'student' ? 'student-portal' : 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('facetrack_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('facetrack_theme', 'light');
    }
  }, [darkMode]);

  const handleLoginSuccess = (userData, token, studentData) => {
    setUser(userData);
    setRole(userData.role);
    setStudentUser(studentData);
    localStorage.setItem('facetrack_user', JSON.stringify(userData));
    localStorage.setItem('facetrack_role', userData.role);
    if (studentData) {
      localStorage.setItem('facetrack_student', JSON.stringify(studentData));
    }
    setActivePage(userData.role === 'student' ? 'student-portal' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setRole('admin');
    setStudentUser(null);
    localStorage.removeItem('facetrack_user');
    localStorage.removeItem('facetrack_role');
    localStorage.removeItem('facetrack_student');
    setActivePage('dashboard');
  };

  // If not logged in, render the login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        role={role}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigate={setActivePage}
        activePage={activePage}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          role={role}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl">
          {activePage === 'dashboard' && <AdminDashboard onNavigate={setActivePage} />}
          {activePage === 'live-recognition' && <LiveRecognitionPage onNavigate={setActivePage} />}
          {activePage === 'face-registration' && <FaceRegistrationPage onNavigate={setActivePage} />}
          {activePage === 'attendance-records' && <AttendanceRecordsPage onNavigate={setActivePage} />}
          {activePage === 'reports' && <AttendanceReportsPage onNavigate={setActivePage} />}
          {activePage === 'student-management' && <StudentManagementPage onNavigate={setActivePage} />}
          {activePage === 'student-registration' && <StudentRegistrationPage onNavigate={setActivePage} />}
          {activePage === 'student-portal' && (
            <StudentPortalPage 
              studentId={studentUser?.student_id || "CS2026001"} 
              studentUser={studentUser} 
            />
          )}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>

    </div>
  );
}
