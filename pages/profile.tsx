import { useEffect, useState } from 'react';
import { profile, password } from '../lib/api'; // Removed 'upload' as we use direct fetch
import Spinner from '../components/Spinner'
import RequireAuth from '../components/RequireAuth';
import { useRouter } from 'next/router';
// 🚀 NEW IMPORTS FOR DIRECT UPLOAD
import { useAuth } from '../components/AuthProvider'; 
import { BACKEND_URL } from '../lib/api'; // Assuming BACKEND_URL is exported from lib/api or a config file

// 🛑 IMPORTANT: Define the fields required for completion (matching the Guard logic)
const PROFILE_REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number'];

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
  [key: string]: any; 
}

export default function ProfilePage() {
  const router = useRouter();
// 🚀 FETCH ACCESS TOKEN AND USER CONTEXT
  const { access } = useAuth();
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
  const [uploadError, setUploadError] = useState(''); // State for file upload errors

  useEffect(() => {
    setLoading(true);
    profile.get()
      .then((res: { data: UserProfile }) => {
        const userData = res.data;
        setUser(userData);
        setForm(userData);

        // 🚀 NEW LOGIC: Check profile completeness on load
        const isIncomplete = PROFILE_REQUIRED_FIELDS.some(
          field => !userData[field]
        );

        // If the profile is incomplete, automatically enter edit mode
        if (isIncomplete) {
          setEditMode(true);
          setError('Please complete your profile information to proceed.');
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

// 🚀 DIRECT FILE UPLOAD HANDLER (Replaces the inline upload logic)
const handleFileChange = (file: File | null, fieldName: 'profile_picture' | 'passport_photo' = 'profile_picture') => {
    if (!file || !access) {
        setUploadError('No file selected or user not logged in.');
        return;
    }

    const fd = new FormData();
    fd.append('file', file);
    
    setUploading(true); 
    setUploadError('');
    setSuccess('');
    
    // 🚨 Using BACKEND_URL for direct communication, targeting the specific user endpoint
    fetch(`${BACKEND_URL}/users/me/upload/${fieldName}/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access}`, // CRITICAL: Auth header for direct call
        },
        body: fd,
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const uploadedUrl = data.url || data.location || data.path || data.file || '';

        if (uploadedUrl) {
            // 🚀 Cache-busting: Appending a timestamp
            const cacheBustedUrl = `${uploadedUrl}?t=${Date.now()}`;
            
            // Update the form state with the new URL
            setForm(f => ({ ...f, [fieldName]: cacheBustedUrl }));
            setSuccess(`${fieldName.replace('_', ' ')} uploaded successfully! Remember to click 'Save'.`);
        } else {
            throw new Error('Upload response missing URL.');
        }
    })
    .catch((e) => {
        const errorMsg = e.message || 'File upload failed.';
        setUploadError(`Failed to upload ${fieldName.replace('_', ' ')}: ${errorMsg}`);
    })
    .finally(() => {
        setUploading(false);
    });
};


  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Send the full form state to the update API
      await profile.update(form);
      setSuccess('Profile updated successfully!');
      setEditMode(false);

      // Re-fetch to update local user state and check for required fields
      const res = await profile.get();
      const updatedUser = res.data;

      // Check if required fields are now complete
      const isNowComplete = !PROFILE_REQUIRED_FIELDS.some(
        field => !updatedUser[field]
      );
      
      setUser(updatedUser);
      setForm(updatedUser);
      
      // 🚀 REDIRECTION LOGIC: Redirect to the next step (Student Application)
      if (isNowComplete) {
        const nextStep = '/student-application'; 
        router.push(nextStep);
      } else {
        // If still incomplete, stay in edit mode and show error
        setEditMode(true);
        setError('Profile saved, but still missing required fields. Please check the form.');
      }

    } catch (e: any) {
      // Display detailed backend error if available
      const apiError = e.response?.data?.detail || e.message;
      setError(`Failed to update profile: ${apiError}`);
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
    } catch (e: any) {
      const apiError = e.response?.data?.detail || e.message;
      setPwError(`Failed to change password: ${apiError}`);
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
            <div><strong>First Name:</strong> {user.first_name || '-'}</div>
            <div><strong>Last Name:</strong> {user.last_name || '-'}</div>
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
            <label className="block mb-1">First Name (Required)</label>
            <input className="w-full border rounded p-2 mb-2" value={form.first_name || ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            <label className="block mb-1">Last Name (Required)</label>
            <input className="w-full border rounded p-2 mb-2" value={form.last_name || ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            <label className="block mb-1">Phone Number (Required)</label>
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
            
            {/* 🚀 Profile Picture Upload Field */}
            <label className="block mb-1">Profile Picture (optional)</label>
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)} 
            />
              {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
            </div>
            {uploadError && <div className="text-red-600 text-sm mb-2">{uploadError}</div>}
            {form.profile_picture && (
              <div className="mb-2">
                <img src={form.profile_picture} alt="Preview" className="w-16 h-16 rounded-full border" />
              </div>
            )}
            {/* End Profile Picture Upload Field */}

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