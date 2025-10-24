import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDocument } from '../hooks/useDocument';
import { Document } from '../types';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Download,
  Eye,
  MoreVertical,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import UploadForm from '../components/UploadForm';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user, isSeller } = useAuth();
  const { getUserDocuments, isLoading } = useDocument();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 0,
  });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadDocuments = async (page: number = 1) => {
    try {
      const result = await getUserDocuments(page, 10);
      setDocuments(result.documents);
      setPagination({
        total: result.total,
        page: result.page,
        pages: result.pages,
      });
      // Stats will be recalculated automatically when documents change
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents. Please try again.');
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status.toLowerCase() === filter;
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.propertyId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-warning-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-error-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'bg-success-100 text-success-800';
      case 'Pending':
        return 'bg-warning-100 text-warning-800';
      case 'Rejected':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate stats based on current documents
  const calculateStats = () => {
    const total = documents.length;
    const verified = documents.filter(doc => doc.status === 'Verified').length;
    const pending = documents.filter(doc => doc.status === 'Pending').length;
    const rejected = documents.filter(doc => doc.status === 'Rejected').length;

    return [
      {
        label: 'Total Documents',
        value: total,
        icon: FileText,
        color: 'text-primary-600',
        bgColor: 'bg-primary-100',
      },
      {
        label: 'Verified',
        value: verified,
        icon: CheckCircle,
        color: 'text-success-600',
        bgColor: 'bg-success-100',
      },
      {
        label: 'Pending',
        value: pending,
        icon: Clock,
        color: 'text-warning-600',
        bgColor: 'bg-warning-100',
      },
      {
        label: 'Rejected',
        value: rejected,
        icon: XCircle,
        color: 'text-error-600',
        bgColor: 'bg-error-100',
      },
    ];
  };

  // Get current stats
  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.firstName}! Manage your land documents here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="input w-full sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Upload Button */}
        {isSeller() && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="btn btn-primary btn-md inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Documents Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Documents</h3>
          <p className="card-description">
            Manage and track your uploaded land documents
          </p>
        </div>
        <div className="card-content p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filter !== 'all' 
                  ? 'No documents match your current filters.'
                  : 'You haven\'t uploaded any documents yet.'
                }
              </p>
              {isSeller() && !searchTerm && filter === 'all' && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn btn-primary"
                >
                  Upload your first document
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((document) => (
                    <tr key={document._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {document.originalName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {document.mimeType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {document.propertyId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          <span title={document.hash}>
                            {document.hash?.substring(0, 8)}...{document.hash?.substring(document.hash.length - 8)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(document.hash);
                              toast.success('Hash copied to clipboard!');
                            }}
                            className="ml-2 text-primary-600 hover:text-primary-800"
                            title="Copy full hash"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(document.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(document.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadDocuments(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => loadDocuments(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <UploadForm
          onClose={() => setShowUploadForm(false)}
          onSuccess={() => {
            setShowUploadForm(false);
            loadDocuments();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
