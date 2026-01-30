import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllWhiteboardPosts, createWhiteboardPost, updateWhiteboardPost, deleteWhiteboardPost } from '@/db';
import { getHKTime } from '@/utils/date';
import type { WhiteboardPost } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function WhiteboardPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner } = useAuth();
  const { isDark } = useTheme();
  const [posts, setPosts] = useState<WhiteboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<WhiteboardPost | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const allPosts = await getAllWhiteboardPosts();
      // Sort: pinned first, then by date
      const sorted = allPosts.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPosts(sorted);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!currentUser || !content.trim()) return;

    setSaving(true);
    try {
      const newPost: WhiteboardPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: content.trim(),
        pinned: false,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: getHKTime(),
        updatedAt: getHKTime(),
      };

      await createWhiteboardPost(newPost);
      setShowNewDialog(false);
      setContent('');
      await loadPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !content.trim()) return;

    setSaving(true);
    try {
      await updateWhiteboardPost({
        ...editingPost,
        content: content.trim(),
      });
      setEditingPost(null);
      setContent('');
      await loadPosts();
    } catch (error) {
      console.error('Failed to update post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (post: WhiteboardPost) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      await deleteWhiteboardPost(post.id);
      await loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleTogglePin = async (post: WhiteboardPost) => {
    try {
      await updateWhiteboardPost({
        ...post,
        pinned: !post.pinned,
      });
      await loadPosts();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const canEdit = (post: WhiteboardPost) => {
    if (isOwner()) return true;
    if (post.createdBy !== currentUser?.id) return false;
    // Non-owners can edit within 15 minutes
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes <= 15;
  };

  const openNewDialog = () => {
    setContent('');
    setShowNewDialog(true);
  };

  const openEditDialog = (post: WhiteboardPost) => {
    setEditingPost(post);
    setContent(post.content);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('en-HK', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={`page-header ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('whiteboard.title')}</h1>
          <Button
            onClick={openNewDialog}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            + {t('whiteboard.newPost')}
          </Button>
        </div>
      </div>

      {/* Posts List */}
      <div className="p-4 space-y-3">
        {posts.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            <p>{t('whiteboard.noPosts')}</p>
          </div>
        ) : (
          posts.map(post => (
            <div
              key={post.id}
              className={`card ${isDark ? 'bg-slate-800 border-slate-700' : ''} ${
                post.pinned ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {post.pinned && (
                    <span className="text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </span>
                  )}
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {post.createdByName}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {formatTime(post.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {isOwner() && (
                    <button
                      onClick={() => handleTogglePin(post)}
                      className={`p-1 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700' : ''}`}
                      title={post.pinned ? t('whiteboard.unpin') : t('whiteboard.pin')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${post.pinned ? 'text-blue-500' : isDark ? 'text-slate-400' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </button>
                  )}
                  {canEdit(post) && (
                    <>
                      <button
                        onClick={() => openEditDialog(post)}
                        className={`p-1 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post)}
                        className={`p-1 rounded hover:bg-slate-100 ${isDark ? 'hover:bg-slate-700' : ''}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className={`whitespace-pre-wrap ${isDark ? 'text-white' : ''}`}>
                {post.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className={isDark ? 'bg-slate-800 text-white' : ''}>
          <DialogHeader>
            <DialogTitle>{t('whiteboard.newPost')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('whiteboard.placeholder')}
              className={`min-h-[150px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNewDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={!content.trim() || saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? t('common.loading') : t('common.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className={isDark ? 'bg-slate-800 text-white' : ''}>
          <DialogHeader>
            <DialogTitle>{t('whiteboard.editPost')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`min-h-[150px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingPost(null)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpdatePost}
                disabled={!content.trim() || saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
