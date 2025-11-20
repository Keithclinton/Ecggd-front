import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import Link from 'next/link';
import { isProfileComplete } from '../lib/helpers';
import RequireAuth from '../components/RequireAuth';

export default function Dashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profileIsComplete, setProfileIsComplete] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [coursesRes, enrollmentsRes, userRes, notificationsRes, messagesRes] = await Promise.all([
          api.get('/courses/'),
          api.get('/enrollments/'),
          api.get('/users/me/'),
          api.get('/notifications/'),
          api.get('/messages/')
        ]);
        
        const userData = userRes.data || null;
        setUser(userData);
        setProfileIsComplete(isProfileComplete(userData));

        setCourses(coursesRes.data || []);
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
        setNotifications(notificationsRes.data || []);
        setMessages(messagesRes.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-10 px-2 md:px-0">
          {!profileIsComplete && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-md" role="alert">
              <p className="font-bold">Complete Your Profile</p>
              <p>Your profile is incomplete. Please update your information to access all features, including course enrollments.</p>
              <Link href="/profile" className="font-bold text-yellow-800 hover:underline mt-2 inline-block">
                Go to Profile
              </Link>
            </div>
          )}

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
              className="w-full md:w-1/2 mx-auto block px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
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
                        <span>{e.courseObj?.fullname || `Course #${e.course}`}</span>
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
                    {courses.filter(c => c.fullname?.toLowerCase().includes(search.toLowerCase())).map((c: any) => (
                      <li key={c.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
                        <span>{c.fullname}</span>
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
    </RequireAuth>
  );
}
