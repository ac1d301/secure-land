import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDocument } from '../hooks/useDocument';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Shield,
  Clock,
  Hash
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface VerifyFormData {
  documentId: string;
}

const Verify: React.FC = () => {
  const { verifyDocumentHash, getVerificationStatus, getDocumentIntegrity, isLoading } = useDocument();
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [documentIntegrity, setDocumentIntegrity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'verify' | 'status' | 'integrity'>('verify');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyFormData>();

  const onVerifySubmit = async (data: VerifyFormData) => {
    try {
      const result = await verifyDocumentHash(data.documentId);
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const onStatusSubmit = async (data: VerifyFormData) => {
    try {
      const status = await getVerificationStatus(data.documentId);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const onIntegritySubmit = async (data: VerifyFormData) => {
    try {
      const integrity = await getDocumentIntegrity(data.documentId);
      setDocumentIntegrity(integrity);
    } catch (error) {
      console.error('Integrity check failed:', error);
    }
  };

  const getIntegrityStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-success-600" />;
      case 'tampered':
        return <XCircle className="w-6 h-6 text-error-600" />;
      case 'not_recorded':
        return <AlertTriangle className="w-6 h-6 text-warning-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getIntegrityStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'tampered':
        return 'bg-error-100 text-error-800 border-error-200';
      case 'not_recorded':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tabs = [
    { id: 'verify', label: 'Verify Hash', icon: Search },
    { id: 'status', label: 'Check Status', icon: Clock },
    { id: 'integrity', label: 'Document Integrity', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
        <p className="text-gray-600 mt-2">
          Verify document authenticity and check blockchain integrity
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Verify Hash Tab */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Verify Document Hash
            </h3>
            <p className="text-gray-600 mb-6">
              Enter the document hash to verify its authenticity on the blockchain.
            </p>
            
            <form onSubmit={handleSubmit(onVerifySubmit)} className="space-y-4">
              <div>
                <label htmlFor="documentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Hash (SHA-256)
                </label>
                <input
                  {...register('documentId', {
                    required: 'Document hash is required',
                    pattern: {
                      value: /^[a-fA-F0-9]{16,64}$/,
                      message: 'Hash must be a valid hexadecimal string',
                    },
                  })}
                  type="text"
                  className="input w-full font-mono"
                  placeholder="Enter document hash (e.g., 1830ce9bc41612b1)"
                />
                {errors.documentId && (
                  <p className="mt-1 text-sm text-error-600">{errors.documentId.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify Hash</span>
                  </>
                )}
              </button>
            </form>

            {verificationResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {verificationResult.verified ? (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-error-600" />
                  )}
                  <span className={`font-medium ${
                    verificationResult.verified ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {verificationResult.verified ? 'Verification Successful' : 'Verification Failed'}
                  </span>
                </div>
                <p className="text-gray-600">{verificationResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Check Verification Status
            </h3>
            <p className="text-gray-600 mb-6">
              Check the current verification status of a document using its hash.
            </p>
            
            <form onSubmit={handleSubmit(onStatusSubmit)} className="space-y-4">
              <div>
                <label htmlFor="documentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Hash
                </label>
                <input
                  {...register('documentId', {
                    required: 'Document hash is required',
                    pattern: {
                      value: /^[a-fA-F0-9]{16,64}$/,
                      message: 'Hash must be a valid hexadecimal string',
                    },
                  })}
                  type="text"
                  className="input w-full font-mono"
                  placeholder="Enter document hash"
                />
                {errors.documentId && (
                  <p className="mt-1 text-sm text-error-600">{errors.documentId.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Check Status</span>
                  </>
                )}
              </button>
            </form>

            {verificationStatus && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Verification Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        verificationStatus.status === 'Verified' 
                          ? 'bg-success-100 text-success-800'
                          : verificationStatus.status === 'Pending'
                          ? 'bg-warning-100 text-warning-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {verificationStatus.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">On Blockchain:</span>
                      <span className={verificationStatus.isOnBlockchain ? 'text-success-600' : 'text-error-600'}>
                        {verificationStatus.isOnBlockchain ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hash Matches:</span>
                      <span className={verificationStatus.hashMatches ? 'text-success-600' : 'text-error-600'}>
                        {verificationStatus.hashMatches ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {verificationStatus.verificationDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verified Date:</span>
                        <span className="text-gray-900">
                          {new Date(verificationStatus.verificationDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Hash Information</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm">Local Hash:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                        {verificationStatus.hash}
                      </div>
                    </div>
                    {verificationStatus.blockchainHash && (
                      <div>
                        <span className="text-gray-600 text-sm">Blockchain Hash:</span>
                        <div className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                          {verificationStatus.blockchainHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Integrity Tab */}
      {activeTab === 'integrity' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Document Integrity Check
            </h3>
            <p className="text-gray-600 mb-6">
              Check if a document has been tampered with by comparing local and blockchain hashes.
            </p>
            
            <form onSubmit={handleSubmit(onIntegritySubmit)} className="space-y-4">
              <div>
                <label htmlFor="documentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Document Hash
                </label>
                <input
                  {...register('documentId', {
                    required: 'Document hash is required',
                    pattern: {
                      value: /^[a-fA-F0-9]{16,64}$/,
                      message: 'Hash must be a valid hexadecimal string',
                    },
                  })}
                  type="text"
                  className="input w-full font-mono"
                  placeholder="Enter document hash"
                />
                {errors.documentId && (
                  <p className="mt-1 text-sm text-error-600">{errors.documentId.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary inline-flex items-center space-x-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Check Integrity</span>
                  </>
                )}
              </button>
            </form>

            {documentIntegrity && (
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg border-2 ${getIntegrityStatusColor(documentIntegrity.integrityStatus)}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getIntegrityStatusIcon(documentIntegrity.integrityStatus)}
                    <span className="font-medium">
                      {documentIntegrity.integrityStatus.charAt(0).toUpperCase() + documentIntegrity.integrityStatus.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm">{documentIntegrity.message}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Integrity Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">On Blockchain:</span>
                      <span className={documentIntegrity.isOnBlockchain ? 'text-success-600' : 'text-error-600'}>
                        {documentIntegrity.isOnBlockchain ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hash Matches:</span>
                      <span className={documentIntegrity.hashMatches ? 'text-success-600' : 'text-error-600'}>
                        {documentIntegrity.hashMatches ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Hash Comparison</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-600 text-sm">Local Hash:</span>
                      <div className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                        {documentIntegrity.localHash}
                      </div>
                    </div>
                    {documentIntegrity.blockchainHash && (
                      <div>
                        <span className="text-gray-600 text-sm">Blockchain Hash:</span>
                        <div className="font-mono text-xs bg-white p-2 rounded border mt-1 break-all">
                          {documentIntegrity.blockchainHash}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-12 card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          How Document Verification Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Hash className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Hash Generation</h4>
            <p className="text-sm text-gray-600">
              Documents are hashed using SHA-256 algorithm to create a unique fingerprint.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Blockchain Storage</h4>
            <p className="text-sm text-gray-600">
              Document hashes are stored on the Ethereum blockchain for immutability.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Verification</h4>
            <p className="text-sm text-gray-600">
              Compare document hashes to verify authenticity and detect tampering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
