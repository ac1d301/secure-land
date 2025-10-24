import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDocument } from '../hooks/useDocument';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface UploadFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadFormData {
  propertyAddress: string;
  file: FileList;
}

const UploadForm: React.FC<UploadFormProps> = ({ onClose, onSuccess }) => {
  const { uploadDocument, isLoading } = useDocument();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UploadFormData>();

  const onSubmit = async (data: UploadFormData) => {
    try {
      const file = data.file[0];
      await uploadDocument({
        propertyAddress: data.propertyAddress,
        file,
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the useDocument hook
    }
  };

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
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setValue('file', e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const isFileTypeValid = (file: File) => {
    return acceptedTypes.includes(file.type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Property Address */}
          <div>
            <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Property Address *
            </label>
            <input
              {...register('propertyAddress', {
                required: 'Property address is required',
                minLength: {
                  value: 10,
                  message: 'Property address must be at least 10 characters',
                },
              })}
              type="text"
              className="input w-full"
              placeholder="Enter the full property address"
            />
            {errors.propertyAddress && (
              <p className="mt-1 text-sm text-error-600">{errors.propertyAddress.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document File *
            </label>
            
            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                {...register('file', {
                  required: 'Please select a file',
                  validate: (files) => {
                    if (!files || files.length === 0) return 'Please select a file';
                    const file = files[0];
                    if (!isFileTypeValid(file)) {
                      return 'Invalid file type. Please upload PDF, images, or Word documents.';
                    }
                    if (file.size > 10 * 1024 * 1024) {
                      return 'File size must be less than 10MB.';
                    }
                    return true;
                  },
                })}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 text-primary-600 mx-auto" />
                  <div className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {selectedFile.type}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div className="text-sm font-medium text-gray-900">
                    Drop your file here, or click to browse
                  </div>
                  <div className="text-sm text-gray-500">
                    PDF, JPG, PNG, GIF, DOC, DOCX up to 10MB
                  </div>
                </div>
              )}
            </div>

            {errors.file && (
              <div className="mt-2 flex items-center text-sm text-error-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.file.message}
              </div>
            )}
          </div>

          {/* File Requirements */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">File Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Document will be hashed and stored on IPFS</li>
              <li>• Hash will be recorded on the blockchain</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadForm;
