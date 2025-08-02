import React, { useState, useEffect } from 'react';
import { Key, Plus, Edit2, Trash2, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ApiKey {
  token: string;
  is_admin: boolean;
  comment: string;
  created_at: string;
  last_used: string | null;
}

interface CreateKeyForm {
  comment: string;
  is_admin: boolean;
}

interface EditKeyForm {
  comment: string;
  is_admin: boolean;
}

export const ApiKeyManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState<CreateKeyForm>({
    comment: '',
    is_admin: false,
  });
  
  const [editForm, setEditForm] = useState<EditKeyForm>({
    comment: '',
    is_admin: false,
  });

  const fetchApiKeys = async () => {
    if (!user?.token) return;
    
    try {
      setError(null);
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setKeys(result.data.tokens);
      } else {
        setError(result.error?.message || 'Failed to fetch API keys');
      }
    } catch (err) {
      setError('Failed to fetch API keys');
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token || !createForm.comment.trim()) return;

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          comment: createForm.comment.trim(),
          is_admin: createForm.is_admin,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchApiKeys();
        setShowCreateForm(false);
        setCreateForm({ comment: '', is_admin: false });
        
        // Auto-copy the new token
        await navigator.clipboard.writeText(result.data.token);
        setCopiedToken(result.data.token);
        setTimeout(() => setCopiedToken(null), 3000);
      } else {
        setError(result.error?.message || 'Failed to create API key');
      }
    } catch (err) {
      setError('Failed to create API key');
      console.error('Error creating API key:', err);
    }
  };

  const handleUpdateKey = async (token: string) => {
    if (!user?.token) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          comment: editForm.comment.trim(),
          is_admin: editForm.is_admin,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchApiKeys();
        setEditingKey(null);
      } else {
        setError(result.error?.message || 'Failed to update API key');
      }
    } catch (err) {
      setError('Failed to update API key');
      console.error('Error updating API key:', err);
    }
  };

  const handleDeleteKey = async (token: string) => {
    if (!user?.token || !confirm('Are you sure you want to delete this API key?')) return;

    try {
      const response = await fetch(`/api/admin/api-keys/${token}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchApiKeys();
      } else {
        setError(result.error?.message || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Failed to delete API key');
      console.error('Error deleting API key:', err);
    }
  };

  const copyToClipboard = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 3000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const startEditing = (key: ApiKey) => {
    setEditingKey(key.token);
    setEditForm({
      comment: key.comment,
      is_admin: key.is_admin,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatToken = (token: string) => {
    return `${token.slice(0, 8)}...${token.slice(-8)}`;
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user?.token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-white">API Key Management</h1>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
          transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New API Key</h2>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Comment
                </label>
                <input
                  type="text"
                  value={createForm.comment}
                  onChange={(e) => setCreateForm({ ...createForm, comment: e.target.value })}
                  placeholder="Enter a description for this key"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={createForm.is_admin}
                  onChange={(e) => setCreateForm({ ...createForm, is_admin: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_admin" className="text-sm text-gray-200">
                  Admin privileges
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-200 font-medium">Token</th>
                <th className="text-left p-4 text-gray-200 font-medium">Comment</th>
                <th className="text-left p-4 text-gray-200 font-medium">Admin</th>
                <th className="text-left p-4 text-gray-200 font-medium">Created</th>
                <th className="text-left p-4 text-gray-200 font-medium">Last Used</th>
                <th className="text-left p-4 text-gray-200 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.token} className="border-t border-gray-700">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-300">
                        {formatToken(key.token)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(key.token)}
                        className="p-1 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                        title="Copy full token"
                      >
                        {copiedToken === key.token ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    {editingKey === key.token ? (
                      <input
                        type="text"
                        value={editForm.comment}
                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <span className="text-gray-300">{key.comment}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingKey === key.token ? (
                      <input
                        type="checkbox"
                        checked={editForm.is_admin}
                        onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        key.is_admin 
                          ? 'bg-red-900/50 text-red-200 border border-red-700' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}>
                        {key.is_admin ? 'Admin' : 'User'}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-300 text-sm">
                    {formatDate(key.created_at)}
                  </td>
                  <td className="p-4 text-gray-300 text-sm">
                    {key.last_used ? formatDate(key.last_used) : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {editingKey === key.token ? (
                        <>
                          <button
                            onClick={() => handleUpdateKey(key.token)}
                            className="p-1 text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="p-1 text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
                            title="Cancel editing"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(key)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            title="Edit key"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKey(key.token)}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {keys.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No API keys found</p>
            <p className="text-sm">Create your first API key to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};