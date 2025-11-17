import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Loader, CheckCircle } from 'lucide-react';
import { parseFile, validateFile } from '../utils/fileParser';
import { storageService } from '../services/firebaseStorage';

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function ResumeUploadModal({ isOpen, onClose, onUploadSuccess }: ResumeUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [currentResumeName, setCurrentResumeName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCurrentResume = async () => {
      if (isOpen && !file) {
        const resume = await storageService.getCurrentResume();
        setCurrentResumeName(resume?.name || null);
      }
    };
    
    loadCurrentResume();
    
    if (!isOpen) {
      setFile(null);
      setCurrentResumeName(null);
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setStatusMessage('Extracting text from resume...');
    try {
      const text = await parseFile(file);
      if (text.length < 100) {
        throw new Error('Resume text is too short. Please upload a valid resume.');
      }
      // Save to Firestore and set as current resume
      const resumeData = {
        name: file.name,
        text,
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
      };
      // Clear current resume before saving new one to avoid race condition
      await storageService.clearCurrentResume();
      const resumeId = await storageService.saveResume(resumeData);
      await storageService.setCurrentResume(resumeId);
      setSuccess(true);
      setStatusMessage('Resume uploaded successfully!');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
      setStatusMessage('');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    setUploading(true);
    setError("");
    setStatusMessage("Clearing current resume...");
    try {
      await storageService.clearCurrentResume();
      setFile(null);
      setCurrentResumeName(null);
      setSuccess(false);
      setStatusMessage("Current resume cleared.");
      setTimeout(() => {
        setStatusMessage("");
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to clear resume");
      setStatusMessage("");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setError('');
      setSuccess(false);
      setStatusMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume</h2>
        <p className="text-gray-600 mb-2">Upload your resume to use across all features</p>
        {currentResumeName && !file && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-emerald-700 justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              <span className="font-medium">Current: {currentResumeName}</span>
            </div>
            <button
              onClick={handleClear}
              disabled={uploading}
              className="ml-2 text-xs text-red-600 border border-red-200 bg-red-50 rounded px-2 py-1 hover:bg-red-100 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all mb-4 ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {success ? (
            <div className="space-y-3">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-green-600 font-medium">{statusMessage}</p>
            </div>
          ) : file ? (
            <div className="space-y-3">
              <FileText className="w-12 h-12 text-blue-600 mx-auto" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-blue-600 text-sm hover:underline disabled:opacity-50"
              >
                Change file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your resume here or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">PDF or DOCX, up to 10MB</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Select File
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {uploading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
            <Loader className="w-5 h-5 animate-spin" />
            <div className="flex-1">
              <span className="font-medium">{statusMessage || 'Uploading resume...'}</span>
              {statusMessage.includes('Extracting') && (
                <p className="text-sm text-blue-600 mt-1">This may take a moment for scanned PDFs...</p>
              )}
              {statusMessage.includes('Clearing') && (
                <p className="text-sm text-blue-600 mt-1">Please wait while we clear your current resume...</p>
              )}
            </div>
          </div>
        )}

        {file && !uploading && !success && (
          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Upload Resume
          </button>
        )}
      </div>
    </div>
  );
}
