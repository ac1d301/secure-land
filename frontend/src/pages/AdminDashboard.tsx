import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  documents: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    verificationRate: string;
  };
  users: {
    total: number;
  };
  system: {
    proxyMode: string;
    environment: string;
    uptime: number;
    lastUpdated: string;
  };
}

interface PendingDocument {
  _id: string;
  originalName: string;
  hash: string;
  ownerId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  propertyId: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'verify' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/documents/pending?limit=50', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (statsResponse.ok && pendingResponse.ok) {
        const statsData = await statsResponse.json();
        const pendingData = await pendingResponse.json();
        
        setStats(statsData.data);
        setPendingDocs(pendingData.data.documents);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'verify' | 'reject') => {
    if (selectedDocs.length === 0) {
      toast.error('Please select documents first');
      return;
    }

    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      
      const endpoint = action === 'verify' 
        ? '/api/admin/documents/bulk-verify'
        : '/api/admin/documents/bulk-reject';
      
      const body = action === 'verify'
        ? { documentIds: selectedDocs }
        : { documentIds: selectedDocs, reason: rejectReason };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${action === 'verify' ? 'Verified' : 'Rejected'} ${result.data.summary.successCount} documents`);
        
        if (result.data.summary.failedCount > 0) {
          toast.error(`${result.data.summary.failedCount} documents failed`);
        }
        
        setSelectedDocs([]);
        setRejectReason('');
        setBulkAction(null);
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error('Bulk action failed');
      }
    } catch (error) {
      toast.error(`Failed to ${action} documents`);
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Government Official Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage document verification and system integrity
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.documents.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.documents.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.documents.verified || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.documents.verificationRate || '0%'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Blockchain Mode</div>
              <div className="text-lg font-semibold text-green-600 uppercase">
                {stats?.system.proxyMode || 'mock'}
              </div>
              <div className="text-xs text-gray-500">No ETH Required</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Environment</div>
              <div className="text-lg font-semibold text-blue-600 uppercase">
                {stats?.system.environment || 'development'}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">System Uptime</div>
              <div className="text-lg font-semibold text-purple-600">
                {stats ? formatUptime(stats.system.uptime) : '0h 0m'}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Documents Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Documents ({pendingDocs.length})
              </h2>
              
              {selectedDocs.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('verify')}
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Verify Selected ({selectedDocs.length})
                  </button>
                  <button
                    onClick={() => setBulkAction('reject')}
                    disabled={loading}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Reject Selected ({selectedDocs.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocs(pendingDocs.map(doc => doc._id));
                        } else {
                          setSelectedDocs([]);
                        }
                      }}
                      checked={selectedDocs.length === pendingDocs.length && pendingDocs.length > 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property ID
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
                {pendingDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDocs.includes(doc._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDocs([...selectedDocs, doc._id]);
                          } else {
                            setSelectedDocs(selectedDocs.filter(id => id !== doc._id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{doc.originalName}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(doc.fileSize)} • {doc.mimeType}
                        </div>
                        <div className="text-xs font-mono text-gray-400">
                          Hash: {doc.hash.slice(0, 16)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {doc.ownerId.firstName} {doc.ownerId.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{doc.ownerId.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-600">
                        {doc.propertyId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(doc.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/verify?id=${doc._id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pendingDocs.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending documents</h3>
                <p className="mt-1 text-sm text-gray-500">All documents have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {bulkAction === 'reject' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Provide a reason for rejecting {selectedDocs.length} documents:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setBulkAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject Documents
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
