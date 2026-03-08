import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminHome from './pages/AdminHome'
import UserHome from './pages/UserHome'
import CreateCourse from './pages/CreateCourse'
import CoursesList from './pages/CoursesList'
import CourseDetail from './pages/CourseDetail'
import Helpbook from './pages/Helpbook'
import AiPrompts from './pages/AiPrompts'
import Stats from './pages/Stats'
import NotFound from './pages/NotFound'
import UserCourseLibrary from './pages/UserCourseLibrary'
import { getRole } from './lib/fakeAuth'

type RequireRoleProps = {
  role: 'admin' | 'user'
  children: ReactNode
}

const RequireRole = ({ role, children }: RequireRoleProps) => {
  const currentRole = getRole()
  if (!currentRole) {
    return <Navigate to="/" replace />
  }
  if (currentRole !== role) {
    return <Navigate to={`/${currentRole}`} replace />
  }
  return <>{children}</>
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminHome />
          </RequireRole>
        }
      />
      <Route
        path="/admin/create-course"
        element={
          <RequireRole role="admin">
            <CreateCourse />
          </RequireRole>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <RequireRole role="admin">
            <CoursesList role="admin" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/courses/:id"
        element={
          <RequireRole role="admin">
            <CourseDetail role="admin" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/helpbook"
        element={
          <RequireRole role="admin">
            <Helpbook role="admin" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/ai-prompts"
        element={
          <RequireRole role="admin">
            <AiPrompts role="admin" />
          </RequireRole>
        }
      />
      <Route
        path="/admin/stats"
        element={
          <RequireRole role="admin">
            <Stats />
          </RequireRole>
        }
      />

      <Route
        path="/user"
        element={
          <RequireRole role="user">
            <UserHome />
          </RequireRole>
        }
      />
      <Route
        path="/user/courses"
        element={
          <RequireRole role="user">
            <CoursesList role="user" />
          </RequireRole>
        }
      />
      <Route
        path="/user/courses/:id"
        element={
          <RequireRole role="user">
            <CourseDetail role="user" />
          </RequireRole>
        }
      />
      <Route
        path="/user/courses/:id/library"
        element={
          <RequireRole role="user">
            <UserCourseLibrary />
          </RequireRole>
        }
      />
      <Route
        path="/user/helpbook"
        element={
          <RequireRole role="user">
            <Helpbook role="user" />
          </RequireRole>
        }
      />
      <Route
        path="/user/ai-prompts"
        element={
          <RequireRole role="user">
            <AiPrompts role="user" />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
