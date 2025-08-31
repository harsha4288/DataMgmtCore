/**
 * Inline Collaboration - Real-time collaboration features within task context
 * Provides comments, activity feed, and user presence without navigation
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Activity,
  Users
} from 'lucide-react';
import { SelectedTask } from '../workspace/UnifiedWorkspace';

interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  mentions?: string[];
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
  details?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
}

interface InlineCollaborationProps {
  task: SelectedTask;
  comments?: CommentItem[];
  activity?: ActivityItem[];
  onlineUsers?: OnlineUser[];
  onAddComment?: (_content: string) => void;
}

export const InlineCollaboration: React.FC<InlineCollaborationProps> = ({
  task: _task,
  comments = [],
  activity = [],
  onlineUsers = [],
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment?.(newComment);
      setNewComment('');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  return (
    <div className="space-y-4">
      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Online Now ({onlineUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-1">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-xs">
                        {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <span className="text-xs">{user.name ? user.name.split(' ')[0] : 'User'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Comment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Comment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Share your thoughts on this task..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Use @username to mention someone
            </span>
            <Button 
              size="sm" 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              <span className="text-xs">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Thread */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length > 0 ? (
            <ScrollArea className="max-h-60">
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback className="text-xs">
                        {comment.author ? comment.author.split(' ').map(n => n[0]).join('').slice(0, 2) : 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-foreground bg-muted/50 rounded p-2">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No comments yet</p>
              <p className="text-xs text-muted-foreground">Be the first to comment!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length > 0 ? (
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{item.user}</span>
                      <span className="text-muted-foreground"> {item.action}</span>
                      {item.details && (
                        <span className="text-muted-foreground"> - {item.details}</span>
                      )}
                      <div className="text-muted-foreground mt-0.5">
                        {formatTimeAgo(item.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-4">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};