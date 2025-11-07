import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../services/api';
import { FaSpinner } from 'react-icons/fa';

const GroupPostDetail = () => {
  const { slug, postId } = useParams();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [replyingTo, setReplyingTo] = useState({});
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentInfo, setCommentInfo] = useState(null);
  const [commentPreviewLoading, setCommentPreviewLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, membershipRes] = await Promise.all([
          apiService.getGroupPost(slug, postId),
          apiService.checkGroupMembership(slug).catch(() => ({ data: { isMember: false, role: null } }))
        ]);
        setPost(pRes?.data?.post || null);
        setComments(pRes?.data?.post?.comments || []);
        setIsMember(membershipRes?.data?.isMember || false);
        setUserRole(membershipRes?.data?.role || null);
      } catch (err) {
        console.error('Failed to load group post', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, postId]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isMember) {
      alert('You must join the group to comment.');
      return;
    }
    setCommentError(null);
    setCommentInfo(null);
    setPosting(true);
    try {
      const res = await apiService.createGroupPostComment(slug, postId, { content: newComment });
      const created = res?.data?.comment;
      if (created) setComments(prev => [created, ...prev]);
      if (res?.data?.ai?.enhanced) {
        setCommentInfo('We polished your comment for clarity before posting.');
      }
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
      if (err?.message?.includes('403')) {
        alert('You must be a group member to comment.');
      } else {
        setCommentError(err?.message || 'Failed to post comment.');
      }
    } finally {
      setPosting(false);
    }
  };

  const handlePreviewComment = async () => {
    if (!newComment.trim()) {
      setCommentError('Please enter a comment before using AI enhance.');
      return;
    }
    if (!isMember) {
      setCommentError('Join the group to use AI assistance.');
      return;
    }
    setCommentError(null);
    setCommentInfo(null);
    setCommentPreviewLoading(true);
    try {
      const response = await apiService.previewGroupPostComment(slug, postId, { content: newComment });
      const payload = response?.data || {};
      if (payload.isRelevant === false) {
        setCommentError(payload.justification || 'Your comment seems off-topic for this group.');
        return;
      }
      if (payload.enhancedContent && payload.enhancedContent.trim().length > 0) {
        setNewComment(payload.enhancedContent);
      }
      if (payload.justification) {
        setCommentInfo(payload.justification);
      } else {
        setCommentInfo('AI polished your comment. Review before posting.');
      }
    } catch (err) {
      console.error('Comment preview failed', err);
      setCommentError(err?.message || 'Failed to enhance comment.');
    } finally {
      setCommentPreviewLoading(false);
    }
  };

  const handleReply = async (parentId, text) => {
    if (!text || !text.trim()) return;
    if (!isMember) { alert('You must join the group to comment.'); return; }

    // optimistic reply
    const tempId = `temp-${Date.now()}`;
    const tempReply = {
      id: tempId,
      content: text,
      author: { firstName: 'You', lastName: '' },
      createdAt: new Date().toISOString()
    };

    setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [tempReply, ...(c.replies || [])] } : c));

    try {
      const res = await apiService.createGroupPostComment(slug, postId, { content: text, parentId });
      const created = res?.data?.comment;
      if (created) {
        setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [created, ...(c.replies || []).filter(r => r.id !== tempId)] } : c));
      }
      if (res?.data?.ai?.enhanced) {
        alert('AI polished your reply before posting.');
      }
    } catch (err) {
      console.error('Reply failed', err);
      // remove temp reply
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== tempId) } : c));
      alert(err?.message || 'Reply failed.');
    } finally {
      setReplyingTo(prev => ({ ...prev, [parentId]: false }));
    }
  };

  if (loading) return <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-3xl text-gray-500" /></div>;

  if (!post) return <div className="p-8 bg-white rounded-lg shadow">Post not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          <p className="text-gray-600 mb-4">By {post.author?.firstName} {post.author?.lastName} • {new Date(post.createdAt).toLocaleDateString()}</p>
          <div className="prose max-w-none text-gray-800">{post.content}</div>
          {(userRole === 'OWNER' || userRole === 'MODERATOR') && (
            <div className="mt-4 flex space-x-2">
              <button onClick={async () => {
                try {
                  const res = await apiService.pinGroupPost(slug, postId);
                  setPost(res?.data?.post || post);
                } catch (err) { console.error(err); }
              }} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">{post.isPinned ? 'Unpin' : 'Pin'}</button>
              <button onClick={async () => {
                if (!confirm('Delete this post? This action cannot be undone.')) return;
                try {
                  await apiService.deleteGroupPost(slug, postId);
                  // navigate back or clear post
                  setPost(null);
                } catch (err) { console.error(err); }
              }} className="px-3 py-1 bg-red-100 text-red-700 rounded">Delete</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>

          {!isMember && (
            <div className="mb-4 p-4 bg-yellow-50 rounded">This is a private group — you must join to comment. Use the group page to join.</div>
          )}

          <form onSubmit={handlePostComment} className="mb-4">
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={4} className="w-full border rounded p-2" placeholder={isMember ? 'Write a comment...' : 'Join the group to comment.'} disabled={!isMember} />
            {commentError && <p className="mt-2 text-sm text-red-600">{commentError}</p>}
            {commentInfo && <p className="mt-2 text-sm text-green-600">{commentInfo}</p>}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <button
                type="button"
                onClick={handlePreviewComment}
                disabled={!isMember || commentPreviewLoading}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                {commentPreviewLoading ? 'Enhancing…' : 'AI Enhance Comment'}
              </button>
              <button type="submit" disabled={!isMember || posting} className="px-4 py-2 bg-blue-600 text-white rounded transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">{posting ? 'Posting...' : 'Post Comment'}</button>
            </div>
          </form>

          <div className="space-y-4">
            {comments.map(c => (
              <div key={c.id} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-600">{c.author?.firstName} {c.author?.lastName} • {new Date(c.createdAt).toLocaleString()}</div>
                  { (userRole === 'OWNER' || userRole === 'MODERATOR') && (
                    <div className="space-x-2">
                      {/* moderation per comment could be added here */}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-gray-800">{c.content}</div>
                <div className="mt-2 flex items-center space-x-2">
                  <button onClick={() => setReplyingTo(prev => ({ ...prev, [c.id]: !prev[c.id] }))} className="text-sm text-blue-600">Reply</button>
                </div>
                {replyingTo[c.id] && (
                  <div className="mt-3">
                    <ReplyForm onSubmit={(text) => handleReply(c.id, text)} />
                  </div>
                )}
                {c.replies && c.replies.length > 0 && (
                  <div className="mt-2 pl-4 border-l">
                    {c.replies.map(r => (
                      <div key={r.id} className="text-sm text-gray-700 mb-2">
                        <div className="text-gray-600">{r.author?.firstName} {r.author?.lastName} • {new Date(r.createdAt).toLocaleString()}</div>
                        <div className="mt-1">{r.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReplyForm = ({ onSubmit }) => {
  const [value, setValue] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(value); setValue(''); }} className="space-y-2">
      <textarea value={value} onChange={e => setValue(e.target.value)} rows={3} className="w-full border rounded p-2" />
      <div className="flex justify-end">
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Reply</button>
      </div>
    </form>
  );
};

export default GroupPostDetail;
