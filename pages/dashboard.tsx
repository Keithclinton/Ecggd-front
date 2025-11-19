import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import Header from '../components/Header';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        let deadlinesData = [];
        let progressData = null;
        let messagesData = [];
        try {
          const [coursesRes, enrollmentsRes, userRes, notificationsRes, deadlinesRes, progressRes, messagesRes] = await Promise.all([
            api.get('/courses/'),
            api.get('/enrollments/'),
            api.get('/users/me/'),
            api.get('/notifications/'),
            api.get('/users/me/deadlines/'),
            api.get('/users/me/progress/'),
            api.get('/messages/')
          ]);
          setCourses(coursesRes.data || []);
          // For each enrollment, fetch courseObj if not present
          const enrollmentsData = enrollmentsRes.data || [];
          const withCourses = await Promise.all(enrollmentsData.map(async (e: any) => {
            if (!e.courseObj && e.course) {
              try {
                const c = await api.get(`/courses/${e.course}/`);
                return { ...e, courseObj: c.data };
              } catch {
                return e;
              }
            }
            return e;
          }));
          setEnrollments(withCourses);
          setUser(userRes.data || null);
          setNotifications(notificationsRes.data || []);
          // If deadlines/progress/messages response is not JSON, show friendly error
          if (typeof deadlinesRes.data === 'string') {
            deadlinesData = [];
          } else {
            deadlinesData = deadlinesRes.data || [];
          }
          if (typeof progressRes.data === 'string') {
            progressData = null;
          } else {
            progressData = progressRes.data || null;
          }
          if (typeof messagesRes.data === 'string') {
            messagesData = [];
          } else {
            messagesData = messagesRes.data || [];
          }
        } catch (err: any) {
          // fallback for any error
          deadlinesData = [];
          progressData = null;
          messagesData = [];
        }
        setDeadlines(deadlinesData);
        setProgress(progressData);
        setMessages(messagesData);
      } catch (err: any) {
        setError(err?.response?.data || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navigation Bar */}
      <nav className="bg-white shadow flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-brand-primary">CCGD LMS</span>
          <Link href="/dashboard" className="text-brand-primary font-medium hover:underline">Dashboard</Link>
          <Link href="/courses" className="text-brand-primary font-medium hover:underline">Courses</Link>
          <Link href="/profile" className="text-brand-primary font-medium hover:underline">Profile</Link>
        </div>
        <div>
          <Link href="/login" className="text-gray-600 font-medium hover:underline">Logout</Link>
        </div>
      </nav>
      {/* Welcome/User Info Section */}
      <div className="max-w-6xl mx-auto py-10 px-2 md:px-0">
        <div className="flex flex-col items-center mb-8">
          {user && (
            <>
              {user.avatar && (
                <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full mb-2 border-2 border-brand-primary" />
              )}
              <h1 className="text-3xl font-bold text-brand-primary mb-2">Welcome, {user.first_name || user.username}!</h1>
            </>
          )}
          {!user && <h1 className="text-3xl font-bold text-brand-primary mb-2">Welcome!</h1>}
        </div>
        {/* Notifications */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Notifications</h2>
          {notifications.length === 0 ? (
            <div className="text-gray-500">No notifications.</div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n: any) => (
                <li key={n.id} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-blue-800">{n.message || n.text}</li>
              ))}
            </ul>
          )}
        </div>
        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Upcoming Deadlines</h2>
          {deadlines.length === 0 ? (
            <div className="text-gray-500">No upcoming deadlines.</div>
          ) : (
            <ul className="space-y-2">
              {deadlines.map((d: any) => (
                <li key={d.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-yellow-800">
                  <span className="font-medium">{d.title || d.name}</span> — Due: {d.due_date}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Progress Overview</h2>
          {progress ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded text-green-800">
              <div>Completed: {progress.completed || 0}</div>
              <div>Total: {progress.total || 0}</div>
              <div>Grade: {progress.grade || 'N/A'}</div>
            </div>
          ) : (
            <div className="text-gray-500">No progress data.</div>
          )}
        </div>
        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <button
            className="px-6 py-2 rounded bg-brand-primary text-white font-semibold shadow hover:bg-brand-primary/90"
            onClick={() => router.push('/courses')}
          >Browse Courses</button>
          <button
            className="px-6 py-2 rounded bg-brand-primary text-white font-semibold shadow hover:bg-brand-primary/90"
            onClick={() => router.push('/upload')}
          >Upload Assignment</button>
          <button
            className="px-6 py-2 rounded bg-brand-primary text-white font-semibold shadow hover:bg-brand-primary/90"
            onClick={() => messages.length === 0 ? setError('No Messages') : router.push('/messages')}
          >Messages</button>
        </div>
        {/* Search/Filter for Courses */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full md:w-1/2 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        {/* Main Dashboard Content: Enrollments & Courses */}
        {error && <div className="text-red-600 text-center font-medium py-2 bg-red-50 rounded mb-6">{String(error)}</div>}
        {loading ? (
          <div className="text-center text-gray-500 mb-4">Loading dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">My Enrollments</h2>
              {enrollments.length === 0 ? (
                <div className="text-gray-500">No enrollments found.</div>
              ) : (
                <ul className="space-y-3">
                  {enrollments.map((e: any) => (
                    <li key={e.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                      <span>{e.courseObj?.title || `Course #${e.course}`}</span>
                      {e.courseObj && <Link href={`/courses/${e.courseObj.id}`} className="text-brand-primary hover:underline font-medium">View course</Link>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">All Courses</h2>
              {courses.length === 0 ? (
                <div className="text-gray-500">No courses available.</div>
              ) : (
                <ul className="space-y-3">
                  {courses.filter(c => c.title?.toLowerCase().includes(search.toLowerCase())).map((c: any) => (
                    <li key={c.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                      <span>{c.title}</span>
                      <Link href={`/courses/${c.id}`} className="text-brand-primary hover:underline font-medium">Details</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
