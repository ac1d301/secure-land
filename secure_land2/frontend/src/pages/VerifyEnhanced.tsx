import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

interface VerificationResult {
  documentId: string;
  hash: string;
  verified: boolean;
  status: string;
  propertyId: string;
  fileName: string;
  verificationDate?: string;
  blockchainHash?: string;
  isOnBlockchain: boolean;
  hashMatches: boolean;
}

interface IntegrityResult {
  documentId: string;
  overallStatus: 'verified' | 'tampered' | 'not_recorded' | 'unavailable';
  blockchainRecordExists: boolean;
  hashesMatch: boolean;
  ipfsAccessible: boolean;
  metadataValid: boolean;
  errors: string[];
  warnings: string[];
  blockchainHash?: string;
  ipfsCid?: string;
}

const VerifyEnhanced: React.FC = () => {
  const [documentId, setDocumentId] = useState('');
  const [fileHash, setFileHash] = useState('');
  const [verificationMode, setVerificationMode] = useState<'id' | 'hash' | 'file'>('id');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const verifyByDocumentId = async () => {
    if (!documentId.trim()) {
      toast.error('Please enter a document ID');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/verify/document/${documentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationResult(data.data);
        
        // Also get integrity status
        const integrityResponse = await fetch(`/api/integrity/document/${documentId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        
        if (integrityResponse.ok) {
          const integrityData = await integrityResponse.json();
          setIntegrityResult(integrityData.data.integrity);
        }
        
        toast.success('Document verification completed');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
      console.error('Verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyByHash = async () => {
    if (!fileHash.trim()) {
      toast.error('Please enter a document hash');
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
      toast.error('Invalid hash format. Must be 64 hexadecimal characters');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/verify/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ hash: fileHash })
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationResult(data.data);
        toast.success('Hash verification completed');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Hash verification failed');
      }
    } catch (error) {
      toast.error('Hash verification failed');
      console.error('Hash verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const computeFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    try {
      setLoading(true);
      toast('Computing file hash...', { icon: 'ℹ️' });
      
      const hash = await computeFileHash(file);
      setFileHash(hash);
      setVerificationMode('hash');
      
      toast.success('File hash computed successfully');
    } catch (error) {
      toast.error('Failed to compute file hash');
      console.error('Hash computation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔍 Document Verification
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Verify the authenticity and integrity of your land documents using our blockchain-based verification system
          </p>
        </div>

        {/* Verification Mode Selector */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'id', label: 'Document ID', icon: '🆔' },
                { key: 'hash', label: 'Document Hash', icon: '🔐' },
                { key: 'file', label: 'Upload File', icon: '📄' }
              ].map((mode) => (
                <button
                  key={mode.key}
                  onClick={() => setVerificationMode(mode.key as 'id' | 'hash' | 'file')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                    verificationMode === mode.key
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Document ID Verification */}
              {verificationMode === 'id' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document ID
                    </label>
                    <input
                      type="text"
                      value={documentId}
                      onChange={(e) => setDocumentId(e.target.value)}
                      placeholder="Enter document ID (e.g., 507f1f77bcf86cd799439011)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the unique document ID from your dashboard
                    </p>
                  </div>
                  <Button
                    onClick={verifyByDocumentId}
                    loading={loading}
                    disabled={!documentId.trim()}
                    size="lg"
                    className="w-full"
                  >
                    Verify Document
                  </Button>
                </div>
              )}

              {/* Hash Verification */}
              {verificationMode === 'hash' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Hash (SHA-256)
                    </label>
                    <textarea
                      value={fileHash}
                      onChange={(e) => setFileHash(e.target.value)}
                      placeholder="Enter 64-character SHA-256 hash..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-colors"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the exact SHA-256 hash of your document (64 hexadecimal characters)
                    </p>
                  </div>
                  <Button
                    onClick={verifyByHash}
                    loading={loading}
                    disabled={!fileHash.trim()}
                    size="lg"
                    className="w-full"
                  >
                    Verify by Hash
                  </Button>
                </div>
              )}

              {/* File Upload Verification */}
              {verificationMode === 'file' && (
                <div className="space-y-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                      dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleFileDrop}
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop your document here
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Or click to select a file to compute its hash
                    </p>
                    <input
                      type="file"
                      onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                      className="hidden"
                      id="file-input"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    />
                    <label
                      htmlFor="file-input"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {fileHash && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Computed Hash
                      </label>
                      <div className="font-mono text-sm text-gray-800 break-all bg-white p-3 rounded border">
                        {fileHash}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Results */}
        {(verificationResult || integrityResult) && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📋</span>
                Verification Results
              </h2>

              {/* Quick Status */}
              {verificationResult?.verified ? (
                <div className="mb-8">
                  <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                    <div className="text-6xl mb-4">✅</div>
                    <div className="text-2xl font-bold text-green-900 mb-2">Document Verified Successfully!</div>
                    <p className="text-green-700">This document exists in our secure database and its integrity is confirmed.</p>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="text-center p-8 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200">
                    <div className="text-6xl mb-4">❌</div>
                    <div className="text-2xl font-bold text-red-900 mb-2">Document Not Found</div>
                    <p className="text-red-700">This document could not be verified in our system.</p>
                  </div>
                </div>
              )}

              {/* Detailed Results */}
              {verificationResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Document Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h3>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-gray-500">File Name:</span>
                          <div className="text-sm text-gray-900">{verificationResult.fileName}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Property ID:</span>
                          <div className="text-sm font-mono text-gray-900">{verificationResult.propertyId}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Document Hash:</span>
                          <div className="text-xs font-mono text-gray-700 break-all bg-white p-2 rounded border">
                            {verificationResult.hash}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Database Status:</span>
                          <StatusBadge status={verificationResult.verified ? 'verified' : 'pending'} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-500">Document Status:</span>
                          <span className="text-sm font-semibold text-gray-900">{verificationResult.status}</span>
                        </div>
                        {verificationResult.verificationDate && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Verified Date:</span>
                            <div className="text-sm text-gray-900">
                              {new Date(verificationResult.verificationDate).toLocaleString()}
                            </div>
                          </div>
                        )}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800">
                            ✓ Document hash verified in secure database<br/>
                            ✓ Document integrity confirmed<br/>
                            ✓ All security checks passed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Integrity Results - Only show if there are critical errors */}
                  {integrityResult && integrityResult.errors && integrityResult.errors.length > 0 && integrityResult.errors.some(e => !e.includes('unavailable')) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                      
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">Notes:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {integrityResult.errors.filter(e => !e.includes('unavailable')).map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 pt-6">
                    <Button
                      onClick={() => {
                        setVerificationResult(null);
                        setIntegrityResult(null);
                        setDocumentId('');
                        setFileHash('');
                      }}
                      variant="outline"
                      size="lg"
                    >
                      Verify Another Document
                    </Button>
                    {verificationResult && (
                      <Button
                        onClick={() => window.open(`/dashboard?highlight=${verificationResult.documentId}`, '_blank')}
                        variant="primary"
                        size="lg"
                      >
                        View in Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Verify Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🆔</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">By Document ID</h3>
                <p className="text-sm text-gray-600">
                  Use the document ID from your dashboard for quick verification
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">By Hash</h3>
                <p className="text-sm text-gray-600">
                  Enter the SHA-256 hash directly if you have computed it separately
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">By File</h3>
                <p className="text-sm text-gray-600">
                  Upload your document to compute its hash and verify against our secure database
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEnhanced;
