import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StudentApplication() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    nationality: '',
    id_document: null as File | null,
    passport: null as File | null,
    certificates: [] as File[],
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill form with profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        const resp = await fetch('/api/proxy/users/me');
        if (resp.ok) {
          const data = await resp.json();
          setForm((prev) => ({
            ...prev,
            first_name: data.first_name || prev.first_name,
            last_name: data.last_name || prev.last_name,
            email: data.email || prev.email,
          }));
        }
      } catch {}
      setProfileLoaded(true);
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files) return;

    if (name === 'certificates') {
      setForm({ ...form, certificates: Array.from(files) });
    } else {
      setForm({ ...form, [name]: files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'certificates' && Array.isArray(value)) {
          value.forEach((file) => formData.append('certificates', file));
        } else if (value) {
          formData.append(key, value as Blob | string);
        }
      });

      const resp = await fetch('/api/proxy/student-applications/', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Application failed' }));
        setError(err?.detail || err?.error || 'Application failed');
      } else {
        setSuccess('Application submitted successfully! Redirecting to dashboard...');
        setTimeout(() => router.push('/dashboard'), 2000); // Redirect to dashboard
      }
    } catch (err: any) {
      setError(err?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  if (!profileLoaded) return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center mb-4">Student Application</h1>

        {error && <div className="text-red-600 text-center">{error}</div>}
        {success && <div className="text-green-600 text-center">{success}</div>}

        <InputField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required />
        <InputField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required />
        <InputField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />

        <div>
          <label className="block mb-1 font-medium">Nationality</label>
          <select name="nationality" value={form.nationality} onChange={handleChange} required className="w-full border px-3 py-2 rounded">
            <option value="">Select nationality</option>
            <option value="kenyan">Kenyan</option>
            <option value="other">Other</option>
          </select>
        </div>

        {form.nationality === 'kenyan' && <FileInputField label="National ID" name="id_document" onChange={handleFileChange} required />}
        {form.nationality === 'other' && <FileInputField label="Passport" name="passport" onChange={handleFileChange} required />}
        <FileInputField label="Academic Certificates" name="certificates" multiple onChange={handleFileChange} required />

        <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white py-2 rounded font-semibold mt-2">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>

        <div className="text-center mt-4">
          <Link href="/login" className="text-brand-primary hover:underline">Already have an account? Login</Link>
        </div>
      </form>
    </div>
  );
}

// Reusable Input Field
function InputField({ label, name, type = 'text', value, onChange, required = false }: any) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} className="w-full border px-3 py-2 rounded" />
    </div>
  );
}

// Reusable File Input
function FileInputField({ label, name, onChange, multiple = false, required = false }: any) {
  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <input type="file" name={name} onChange={onChange} multiple={multiple} required={required} className="w-full border px-3 py-2 rounded" />
    </div>
  );
}
