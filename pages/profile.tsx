import { useEffect, useState } from 'react';
import { profile, password, upload } from '../lib/api';
import Spinner from '../components/Spinner'
import RequireAuth from '../components/RequireAuth';
import { useRouter } from 'next/router';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  education_level?: string;
  profile_picture?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    profile.get()
      .then((res: { data: UserProfile }) => {
        setUser(res.data);
        setForm(res.data);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profile.update(form);
      setSuccess('Profile updated');
      setEditMode(false);
      profile.get().then((res: { data: UserProfile }) => {
        setUser(res.data);
        // After successful save, follow workflow to dashboard/enrollment
        const next = (router.query?.next as string) || '/courses';
        router.push(next);
      });
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    try {
      await password.change(pwForm);
      setPwSuccess('Password changed successfully');
      setPwForm({ old_password: '', new_password: '' });
    } catch {
      setPwError('Failed to change password');
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {user && !editMode && (
          <div className="mb-6">
            <div><strong>Username:</strong> {user.username}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>First Name:</strong> {user.first_name}</div>
            <div><strong>Last Name:</strong> {user.last_name}</div>
            <div><strong>Phone:</strong> {user.phone_number || '-'}</div>
            <div><strong>Date of Birth:</strong> {user.date_of_birth || '-'}</div>
            <div><strong>Gender:</strong> {user.gender || '-'}</div>
            <div><strong>Address:</strong> {user.address || '-'}</div>
            <div><strong>Education Level:</strong> {user.education_level || '-'}</div>
            {user.profile_picture && (
              <div className="mt-3">
                <img src={user.profile_picture} alt="Profile" className="w-20 h-20 rounded-full border" />
              </div>
            )}
            <button className="mt-4 px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>
        )}
        {editMode && (
          <div className="mb-6">
            <label className="block mb-1">Email</label>
            <input className="w-full border rounded p-2 mb-2" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <label className="block mb-1">First Name</label>
            <input className="w-full border rounded p-2 mb-2" value={form.first_name || ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <label className="block mb-1">Last Name</label>
            <input className="w-full border rounded p-2 mb-2" value={form.last_name || ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            <label className="block mb-1">Phone Number</label>
            <input className="w-full border rounded p-2 mb-2" value={form.phone_number || ''} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
            <label className="block mb-1">Date of Birth</label>
            <input type="date" className="w-full border rounded p-2 mb-2" value={form.date_of_birth || ''} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
            <label className="block mb-1">Gender</label>
            <select className="w-full border rounded p-2 mb-2" value={form.gender || ''} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            <label className="block mb-1">Address</label>
            <input className="w-full border rounded p-2 mb-2" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            <label className="block mb-1">Education Level (optional)</label>
            <input className="w-full border rounded p-2 mb-2" value={form.education_level || ''} onChange={e => setForm(f => ({ ...f, education_level: e.target.value }))} />
            <label className="block mb-1">Profile Picture (optional)</label>
            <div className="flex items-center gap-3 mb-2">
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await upload.file(fd);
                  const data = res?.data || {};
                  const url = data.url || data.location || data.path || data.file || '';
                  if (url) setForm(f => ({ ...f, profile_picture: url }));
                } catch (e) {
                  setError('Failed to upload profile picture');
                } finally {
                  setUploading(false);
                }
              }} />
              {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
            </div>
            {form.profile_picture && (
              <div className="mb-2">
                <img src={form.profile_picture} alt="Preview" className="w-16 h-16 rounded-full border" />
              </div>
            )}
            <button
              className={`px-4 py-2 rounded mr-2 font-semibold transition flex items-center justify-center gap-3 ${saving ? 'bg-green-600 text-white opacity-60 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
              onClick={handleUpdate}
              disabled={saving}
              aria-busy={saving}
              aria-disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner size={16} className="text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save'
              )}
            </button>
            <button className="px-4 py-2 rounded bg-gray-400 text-white" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        )}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          {pwError && <div className="text-red-600 mb-2">{pwError}</div>}
          {pwSuccess && <div className="text-green-600 mb-2">{pwSuccess}</div>}
          <input className="w-full border rounded p-2 mb-2" type="password" placeholder="Old Password" value={pwForm.old_password} onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} />
          <input className="w-full border rounded p-2 mb-2" type="password" placeholder="New Password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleChangePassword}>Change Password</button>
        </div>
      </div>
    </RequireAuth>
  );
}
