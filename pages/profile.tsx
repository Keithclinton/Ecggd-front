import { useEffect, useState, ReactNode } from 'react';
import { profile, auth } from '../lib/api';
import Spinner from '../components/Spinner'
import RequireAuth from '../components/RequireAuth';
import { useRouter } from 'next/router';
import { isProfileComplete } from '../lib/helpers';
import { getSlidingToken } from '../lib/auth';

interface UserProfileData {
  date_of_birth?: string;
  gender?: string;
  address?: string;
  qualification_level?: string;
  profile_picture?: string;
  nationality?: string;
  field_of_study?: string;
  passport_photo?: string;
  national_id?: string;
  passport?: string;
  academic_certificate?: string;
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  institution?: string;
  profile: UserProfileData;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

function ProfileCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
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
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatus>>({});


  useEffect(() => {
    setLoading(true);
    profile.get()
      .then((res: { data: UserProfile }) => {
        const userData = res.data;
        if (!userData.profile) {
          userData.profile = {}; // Ensure profile object exists
        }
        setUser(userData);
        setForm(userData);
        if (!isProfileComplete(userData)) {
          setEditMode(true);
        }
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (!user || !user.id) {
        throw new Error('User not loaded, cannot update.');
      }
  
      // Create a payload with only the non-file fields.
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        timezone: form.timezone,
        institution: form.institution,
        profile: {
          date_of_birth: form.profile?.date_of_birth,
          gender: form.profile?.gender,
          address: form.profile?.address,
          qualification_level: form.profile?.qualification_level,
          field_of_study: form.profile?.field_of_study,
          nationality: form.profile?.nationality,
        },
      };

      await profile.update(user.id, payload);
      setSuccess('Profile updated successfully!');
      setEditMode(false);
      // Re-fetch user data to update the view, but don't block
      profile.get().then((res: { data: UserProfile }) => {
        const userData = res.data;
        if (!userData.profile) {
          userData.profile = {};
        }
        setUser(userData);
        setForm(userData);
        // After successful save, follow workflow to dashboard/enrollment
        if (isProfileComplete(userData)) {
            const next = (router.query?.next as string) || '/dashboard';
            router.push(next);
        }
      });
    } catch (err: any) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : (err.message || 'Failed to update profile');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      profile: {
        ...f?.profile,
        [name]: value,
      },
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus(s => ({ ...s, [fieldName]: 'uploading' }));

    try {
        const token = getSlidingToken();
        const formData = new FormData();
        formData.append('file', file);

        // Bypassing the Next.js proxy and sending directly to the backend
        const response = await fetch(`http://localhost:8000/api/users/me/upload/${fieldName}/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
      
      // Add a cache-busting query parameter
      const newUrl = `${data.file_url}?t=${new Date().getTime()}`;
      // Update the user's profile data with the new file URL
      setUser(u => ({ ...u!, profile: { ...u!.profile, [fieldName]: newUrl } }));
      setForm(f => ({ ...f!, profile: { ...f!.profile, [fieldName]: newUrl } }));
      setUploadStatus(s => ({ ...s, [fieldName]: 'success' }));
    } catch {
      setUploadStatus(s => ({ ...s, [fieldName]: 'error' }));
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    try {
      await auth.changePassword(pwForm);
      setPwSuccess('Password changed successfully');
      setPwForm({ old_password: '', new_password: '' });
    } catch {
      setPwError('Failed to change password');
    }
  };

  const renderUploadStatus = (fieldName: string) => {
    const status = uploadStatus[fieldName];
    if (!status || status === 'idle') return null;
    if (status === 'uploading') return <span className="ml-2 text-sm text-gray-500">Uploading...</span>;
    if (status === 'success') return <span className="ml-2 text-sm text-green-600">✓</span>;
    if (status === 'error') return <span className="ml-2 text-sm text-red-600">Failed</span>;
  }

  return (
    <RequireAuth>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          {!editMode && (
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => setEditMode(true)}>Edit Profile</button>
          )}
        </div>
        {loading && <Spinner />}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {user && !editMode && (
          <div className="space-y-6">
            <ProfileCard title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>First Name:</strong> {user.first_name}</div>
                <div><strong>Last Name:</strong> {user.last_name}</div>
                <div><strong>Date of Birth:</strong> {user.profile?.date_of_birth || '-'}</div>
                <div><strong>Gender:</strong> {user.profile?.gender || '-'}</div>
                <div><strong>Nationality:</strong> {user.profile?.nationality || '-'}</div>
                {user.profile?.profile_picture && (
                  <div className="mt-3">
                    <img src={user.profile.profile_picture} alt="Profile" className="w-20 h-20 rounded-full border" />
                  </div>
                )}
              </div>
            </ProfileCard>
            
            <ProfileCard title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Phone:</strong> {user.phone || '-'}</div>
                <div><strong>Address:</strong> {user.profile?.address || '-'}</div>
                <div><strong>Timezone:</strong> {user.timezone || '-'}</div>
              </div>
            </ProfileCard>

            <ProfileCard title="Educational Background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Education Level:</strong> {user.profile?.qualification_level || '-'}</div>
                <div><strong>Field of Study:</strong> {user.profile?.field_of_study || '-'}</div>
                <div><strong>Institution:</strong> {user.institution || '-'}</div>
              </div>
            </ProfileCard>

            <ProfileCard title="Documents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Passport Photo:</strong> {user.profile?.passport_photo ? <a href={user.profile.passport_photo} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a> : '-'}</div>
                <div><strong>National ID:</strong> {user.profile?.national_id ? <a href={user.profile.national_id} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a> : '-'}</div>
                <div><strong>Passport:</strong> {user.profile?.passport ? <a href={user.profile.passport} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a> : '-'}</div>
                <div><strong>Academic Certificate:</strong> {user.profile?.academic_certificate ? <a href={user.profile.academic_certificate} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a> : '-'}</div>
              </div>
            </ProfileCard>
          </div>
        )}

        {editMode && (
          <div className="space-y-6">
            <ProfileCard title="Personal Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">First Name</label>
                  <input className="w-full border rounded p-2" value={form.first_name || ''} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1">Last Name</label>
                  <input className="w-full border rounded p-2" value={form.last_name || ''} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1">Date of Birth</label>
                  <input type="date" name="date_of_birth" className="w-full border rounded p-2" value={form.profile?.date_of_birth || ''} onChange={handleProfileChange} />
                </div>
                <div>
                  <label className="block mb-1">Gender</label>
                  <select name="gender" className="w-full border rounded p-2" value={form.profile?.gender || ''} onChange={handleProfileChange}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Nationality</label>
                  <NationalitySelector
                      value={form.profile?.nationality || ''}
                      onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, nationality: e.target.value } }))}
                  />
                </div>
                <div>
                    <label className="block mb-1">Profile Picture (optional)</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profile_picture')} aria-label="Profile Picture" />
                      {renderUploadStatus('profile_picture')}
                    </div>
                    {(form.profile?.profile_picture) && (
                      <div className="mt-2">
                        <img
                          src={form.profile.profile_picture}
                          alt="Preview"
                          className="w-16 h-16 rounded-full border"
                        />
                      </div>
                    )}
                </div>
              </div>
            </ProfileCard>

            <ProfileCard title="Contact Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Email</label>
                  <input className="w-full border rounded p-2" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1">Phone</label>
                  <input className="w-full border rounded p-2" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block mb-1">Address</label>
                  <input name="address" className="w-full border rounded p-2" value={form.profile?.address || ''} onChange={handleProfileChange} />
                </div>
                <div>
                  <label className="block mb-1">Timezone</label>
                  <TimezoneSelector
                    value={form.timezone || ''}
                    onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                  />
                </div>
              </div>
            </ProfileCard>

            <ProfileCard title="Educational Background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Education Level (optional)</label>
                  <EducationLevelSelector
                    value={form.profile?.qualification_level || ''}
                    onChange={e => setForm(f => ({ ...f, profile: { ...f.profile, qualification_level: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className="block mb-1">Field of Study (optional)</label>
                  <input name="field_of_study" className="w-full border rounded p-2" value={form.profile?.field_of_study || ''} onChange={handleProfileChange} />
                </div>
                <div>
                  <label className="block mb-1">Institution</label>
                  <input className="w-full border rounded p-2" value={form.institution || ''} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
                </div>
              </div>
            </ProfileCard>

            <ProfileCard title="Documents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Passport Photo (optional)</label>
                    <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'passport_photo')} aria-label="Passport Photo" />
                        {renderUploadStatus('passport_photo')}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">National ID (optional)</label>
                    <div className="flex items-center gap-3">
                        <input type="file" onChange={(e) => handleFileChange(e, 'national_id')} aria-label="National ID" />
                        {renderUploadStatus('national_id')}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Passport (optional)</label>
                    <div className="flex items-center gap-3">
                        <input type="file" onChange={(e) => handleFileChange(e, 'passport')} aria-label="Passport" />
                        {renderUploadStatus('passport')}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Academic Certificate (optional)</label>
                    <div className="flex items-center gap-3">
                        <input type="file" onChange={(e) => handleFileChange(e, 'academic_certificate')} aria-label="Academic Certificate" />
                        {renderUploadStatus('academic_certificate')}
                    </div>
                  </div>
              </div>
            </ProfileCard>

            <div className="flex gap-4">
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
          </div>
        )}
        
        {!editMode && (
          <ProfileCard title="Change Password">
            {pwError && <div className="text-red-600 mb-2">{pwError}</div>}
            {pwSuccess && <div className="text-green-600 mb-2">{pwSuccess}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="w-full border rounded p-2" type="password" placeholder="Old Password" value={pwForm.old_password} onChange={e => setPwForm(f => ({ ...f, old_password: e.target.value }))} />
              <input className="w-full border rounded p-2" type="password" placeholder="New Password" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} />
            </div>
            <button className="mt-4 px-4 py-2 rounded bg-blue-600 text-white" onClick={handleChangePassword}>Change Password</button>
          </ProfileCard>
        )}
      </div>
    </RequireAuth>
  );
}

// Timezone selector component
const timezones = [
  "Africa/Nairobi", "Europe/London", "America/New_York", "America/Chicago", 
  "America/Denver", "America/Los_Angeles", "Asia/Tokyo", "Australia/Sydney"
  // Add more common timezones as needed
];

function TimezoneSelector({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <select className="w-full border rounded p-2" value={value} onChange={onChange} aria-label="Timezone">
      <option value="">Select timezone</option>
      {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
    </select>
  )
}

// Education Level selector component
const educationLevels = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate",
  "Other"
];

function EducationLevelSelector({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  return (
    <select className="w-full border rounded p-2" value={value} onChange={onChange} aria-label="Education Level">
      <option value="">Select education level</option>
      {educationLevels.map(level => <option key={level} value={level}>{level}</option>)}
    </select>
  )
}

// Nationality selector component
const nationalities = [
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian",
    "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian",
    "Belgian", "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian",
    "Burkinabe", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian",
    "Chilean", "Chinese", "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech",
    "Danish", "Djibouti", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean",
    "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian",
    "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian",
    "Herzegovinian", "Honduran", "Hungarian", "I-Kiribati", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi",
    "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan",
    "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner",
    "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian", "Maltese",
    "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan",
    "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian",
    "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Panamanian",
    "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan",
    "Saint Lucian", "Salvadoran", "Samoan", "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian",
    "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian", "Solomon Islander", "Somali", "South African",
    "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi", "Swedish", "Swiss", "Syrian", "Taiwanese",
    "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian", "Tunisian", "Turkish", "Tuvaluan",
    "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh", "Yemenite", "Zambian", "Zimbabwean"
];

function NationalitySelector({ value, onChange }: { value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
    return (
        <select className="w-full border rounded p-2" value={value} onChange={onChange} aria-label="Nationality">
        <option value="">Select nationality</option>
        {nationalities.map(nat => <option key={nat} value={nat.toLowerCase()}>{nat}</option>)}
        </select>
    )
}