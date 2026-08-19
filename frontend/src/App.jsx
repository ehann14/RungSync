import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';

import StudentDashboard from './pages/student/Dashboard';
import StudentSchedule from './pages/student/Schedule';

import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherSchedule from './pages/teacher/Schedule';
import TeacherRooms from './pages/teacher/Rooms';
import TeacherTransfer from './pages/teacher/Transfer';

import AdminDashboard from './pages/admin/Dashboard';
import AdminSchedules from './pages/admin/Schedules';
import AdminRooms from './pages/admin/Rooms';
import AdminTeachers from './pages/admin/Teachers';
import AdminStudents from './pages/admin/Students';
import AdminClasses from './pages/admin/Classes';
import AdminSubjects from './pages/admin/Subjects';
import AdminTransfers from './pages/admin/Transfers';

// 1 komponen profil untuk semua role (ganti nama & kata sandi)
import Profile from './pages/Profile';

export default function App() {
  const [splash, setSplash] = useState(true);

  return (
    <>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>

          {/* ============ SISWA ============ */}
          <Route
            path="student/dashboard"
            element={
              <ProtectedRoute roles={['student', 'siswa']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/schedule"
            element={
              <ProtectedRoute roles={['student', 'siswa']}>
                <StudentSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="student/profile"
            element={
              <ProtectedRoute roles={['student', 'siswa']}>
                <Profile role="siswa" />
              </ProtectedRoute>
            }
          />

          {/* ============ GURU ============ */}
          <Route
            path="teacher/dashboard"
            element={
              <ProtectedRoute roles={['teacher', 'guru']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/schedule"
            element={
              <ProtectedRoute roles={['teacher', 'guru']}>
                <TeacherSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/rooms"
            element={
              <ProtectedRoute roles={['teacher', 'guru']}>
                <TeacherRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/room-transfers"
            element={
              <ProtectedRoute roles={['teacher', 'guru']}>
                <TeacherTransfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="teacher/profile"
            element={
              <ProtectedRoute roles={['teacher', 'guru']}>
                <Profile role="guru" />
              </ProtectedRoute>
            }
          />

          {/* ============ ADMIN ============ */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/profile"
            element={
              <ProtectedRoute roles={['admin']}>
                <Profile role="admin" />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/schedules"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/rooms"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/teachers"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTeachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/students"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/classes"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/subjects"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminSubjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/room-transfers"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminTransfers />
              </ProtectedRoute>
            }
          />

        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}