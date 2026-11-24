// API client helper
const API_BASE = '/api';

export const api = {
  // Auth
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Students
  getStudents: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/students?${query}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  },

  createStudent: async (studentData) => {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create student');
    return data;
  },

  updateStudent: async (studentId, studentData) => {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update student');
    return data;
  },

  deleteStudent: async (studentId) => {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete student');
    return data;
  },

  // Face Recognition
  registerFace: async (studentId, images) => {
    const res = await fetch(`${API_BASE}/face/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, images })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register face');
    return data;
  },

  recognizeFace: async (imageDataUrl, autoMark = true) => {
    const res = await fetch(`${API_BASE}/face/recognize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageDataUrl, auto_mark: autoMark })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Face recognition request failed');
    return data;
  },

  // Attendance Records
  getAttendance: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/attendance?${query}`);
    if (!res.ok) throw new Error('Failed to fetch attendance');
    return res.json();
  },

  manualMarkAttendance: async (payload) => {
    const res = await fetch(`${API_BASE}/attendance/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');
    return data;
  },

  deleteAttendance: async (id) => {
    const res = await fetch(`${API_BASE}/attendance/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete record');
    return data;
  },

  // Student Portal
  getStudentPortal: async (studentId) => {
    const res = await fetch(`${API_BASE}/student-portal/${studentId}`);
    if (!res.ok) throw new Error('Failed to fetch student portal data');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  saveSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return data;
  }
};
