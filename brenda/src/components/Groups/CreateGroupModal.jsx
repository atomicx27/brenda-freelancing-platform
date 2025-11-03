import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const CreateGroupModal = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isPublic = privacy === 'public';
      await onCreate({ 
        name, 
        description, 
        isPublic,
        requiresApproval: !isPublic && requiresApproval,
        category: 'GENERAL',
        rules: '',
        tags: []
      });
      setName('');
      setDescription('');
      setPrivacy('public');
      setRequiresApproval(false);
      onClose();
    } catch (err) {
      console.error('Create group failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Create Group</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-md p-2"
              placeholder="e.g. Frontend Developers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-md p-2"
              rows={4}
              placeholder="Short description about the group's purpose"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Privacy</label>
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-md p-2"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {privacy === 'private' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresApproval"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded"
              />
              <label htmlFor="requiresApproval" className="text-sm text-gray-700">
                Require approval to join (members must be approved by moderators)
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2">`
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-md">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
