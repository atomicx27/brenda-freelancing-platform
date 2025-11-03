import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/api';
import { FaPlus, FaSpinner } from 'react-icons/fa';

const GroupDetail = () => {
  const { slug } = useParams();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      try {
        const [gRes, pRes] = await Promise.all([
          apiService.getGroupBySlug(slug),
          apiService.getGroupPosts(slug, { limit: 20 })
        ]);
        const groupData = gRes?.data?.group || null;
        setGroup(groupData);
        // check membership & role if group exists
        if (groupData) {
          try {
            const mem = await apiService.checkGroupMembership(slug);
            setIsMember(mem?.data?.isMember || false);
            setUserRole(mem?.data?.role || null);
            // if owner/mod, fetch pending join requests
            if (mem?.data?.role === 'OWNER' || mem?.data?.role === 'MODERATOR') {
              const reqs = await apiService.getGroupJoinRequests(groupData.id);
              setJoinRequests(reqs?.data?.requests || []);
            }
          } catch (e) {
            setIsMember(false);
            setUserRole(null);
          }
        }
        setPosts(pRes?.data?.posts || []);
      } catch (err) {
        console.error('Failed to load group', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setCreating(true);
    try {
      const res = await apiService.createGroupPost(slug, { title, content, tags: [] });
      const newPost = res?.data?.post || null;
      if (newPost) setPosts(prev => [newPost, ...prev]);
      setShowCreate(false);
      setTitle('');
      setContent('');
    } catch (err) {
      console.error('Create group post failed', err);
      // show friendly error if permission denied
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-gray-500" /></div>
  );

  if (!group) return <div className="p-8 bg-white rounded-lg shadow">Group not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <p className="text-gray-600 mt-2">{group.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
                <span>{group._count?.members ?? group.memberCount} members</span>
                <span>{group._count?.posts ?? group.postCount} posts</span>
              </div>
            </div>
            <div>
              {group.isPublic || isMember ? (
                <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2">
                  <FaPlus />
                  <span>Create Post</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button onClick={async () => {
                    try {
                      await apiService.joinUserGroup(group.id);
                      // joinUserGroup may create a request; refresh membership
                      const mem = await apiService.checkGroupMembership(slug).catch(() => ({ data: { isMember: false } }));
                      setIsMember(mem?.data?.isMember || false);
                      setUserRole(mem?.data?.role || null);
                    } catch (err) {
                      console.error('Join failed', err);
                    }
                  }} className="bg-green-600 text-white px-4 py-2 rounded-md">Join Group</button>
                  <button disabled className="px-4 py-2 rounded-md border text-gray-500">Create Post</button>
                </div>
              )}
            </div>
            {userRole === 'OWNER' || userRole === 'MODERATOR' ? (
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Pending Join Requests</h4>
                {joinRequests.length === 0 ? (
                  <div className="text-sm text-gray-500">No pending requests</div>
                ) : (
                  <div className="space-y-3">
                    {joinRequests.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{r.user.firstName} {r.user.lastName}</div>
                          <div className="text-sm text-gray-500">Requested {new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="space-x-2">
                          <button onClick={async () => {
                            try {
                              await apiService.approveJoinRequest(group.id, r.id);
                              setJoinRequests(prev => prev.filter(x => x.id !== r.id));
                            } catch (err) { console.error(err); }
                          }} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                          <button onClick={async () => {
                            try {
                              await apiService.rejectJoinRequest(group.id, r.id);
                              setJoinRequests(prev => prev.filter(x => x.id !== r.id));
                            } catch (err) { console.error(err); }
                          }} className="px-3 py-1 bg-red-100 text-red-700 rounded">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
                  <Link to={`/groups/${slug}/posts/${post.id}`}>{post.title}</Link>
                </h3>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {post.author?.firstName} {post.author?.lastName}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Create Post in {group.name}</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-gray-800">Close</button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea required value={content} onChange={e => setContent(e.target.value)} rows={6} className="mt-1 block w-full border border-gray-200 rounded-md p-2" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md border mr-2">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-md">{creating ? 'Posting...' : 'Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
