import { useState } from 'react';
import { upload } from '../lib/api';
import RequireAuth from '../components/RequireAuth';

export default function FileUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await upload.file(formData);
      setSuccess('File uploaded successfully');
      setFile(null);
    } catch {
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">File Upload</h1>
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <input type="file" onChange={handleFileChange} className="mb-4" />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>
    </RequireAuth>
  );
}
