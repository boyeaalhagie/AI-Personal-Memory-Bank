import { useState } from 'react';
import { uploadService } from '../services/api';

interface PhotoUploadProps {
  userId: string;
  onUploadSuccess: () => void;
}

export function PhotoUpload({ userId, onUploadSuccess }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await uploadService.uploadPhoto(userId, file);
      setSuccess(true);
      setFile(null);
      setPreview(null);
      onUploadSuccess();
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-lg">⬆️</div>
        <h2 className="text-lg font-semibold text-slate-900">Upload Photo</h2>
      </div>

      <div className="space-y-4">
        <label
          htmlFor="file-input"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PNG, JPG up to a few MB</p>
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>

        {preview && (
          <div className="w-full">
            <p className="text-sm text-slate-600 mb-2">Preview</p>
            <img src={preview} alt="Preview" className="max-h-72 rounded-lg shadow-sm border border-slate-200" />
          </div>
        )}

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        )}

        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-100 text-sm">Photo uploaded successfully! Processing emotion...</div>}
      </div>
    </div>
  );
}

