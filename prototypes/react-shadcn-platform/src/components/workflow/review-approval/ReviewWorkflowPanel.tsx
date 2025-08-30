/**
 * Review & Approval Workflow Panel - Comment threads, approval processes, and quality gates
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Send,
  Reply,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Bell,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { UserType } from '../status-management/StatusWorkflowPanel';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested'
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  entityType: 'task' | 'issue' | 'document';
  entityId: string;
  parentCommentId?: string;
  reactions: CommentReaction[];
  isEdited: boolean;
}

export interface CommentReaction {
  id: string;
  userId: string;
  userName: string;
  type: 'like' | 'dislike' | 'heart' | 'laugh';
  createdAt: Date;
}

export interface ApprovalWorkflow {
  id: string;
  entityType: 'task' | 'issue' | 'document';
  entityId: string;
  entityName: string;
  requiredApprovals: ApprovalRequirement[];
  currentApprovals: Approval[];
  status: ApprovalStatus;
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface ApprovalRequirement {
  id: string;
  approverType: UserType;
  approverIds?: string[];
  minApprovals: number;
  criteria: ApprovalCriteria[];
  timeLimit?: number;
}

export interface ApprovalCriteria {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

export interface Approval {
  id: string;
  workflowId: string;
  approverId: string;
  approverName: string;
  approverType: UserType;
  status: ApprovalStatus;
  comments?: string;
  approvedAt: Date;
  criteria: ApprovalCriteria[];
}

const getApprovalStatusIcon = (status: ApprovalStatus) => {
  switch (status) {
    case ApprovalStatus.PENDING: return <Clock className="h-4 w-4 text-orange-500" />;
    case ApprovalStatus.APPROVED: return <CheckCircle className="h-4 w-4 text-green-500" />;
    case ApprovalStatus.REJECTED: return <XCircle className="h-4 w-4 text-red-500" />;
    case ApprovalStatus.CHANGES_REQUESTED: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
};

const getApprovalStatusColor = (status: ApprovalStatus) => {
  switch (status) {
    case ApprovalStatus.PENDING: return 'secondary';
    case ApprovalStatus.APPROVED: return 'default';
    case ApprovalStatus.REJECTED: return 'destructive';
    case ApprovalStatus.CHANGES_REQUESTED: return 'secondary';
    default: return 'secondary';
  }
};

interface ReviewWorkflowPanelProps {
  comments?: Comment[];
  approvalWorkflows?: ApprovalWorkflow[];
  currentUser?: {
    id: string;
    name: string;
    type: UserType;
  };
  onCommentCreate?: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCommentUpdate?: (commentId: string, content: string) => void;
  onCommentDelete?: (commentId: string) => void;
  onApprovalSubmit?: (workflowId: string, approval: Omit<Approval, 'id' | 'approvedAt'>) => void;
}

export const ReviewWorkflowPanel: React.FC<ReviewWorkflowPanelProps> = ({
  comments = [],
  approvalWorkflows = [],
  currentUser = { id: 'current-user', name: 'Current User', type: UserType.DEVELOPER },
  onCommentCreate,
  onCommentUpdate,
  onCommentDelete,
  onApprovalSubmit
}) => {
  const [newComment, setNewComment] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null);
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Mock data for demonstration
  const mockComments: Comment[] = [
    {
      id: 'comment-1',
      content: 'The authentication system looks good overall, but I have some concerns about the JWT validation logic. Can we add more comprehensive error handling?',
      author: 'Tech Lead',
      authorId: 'user-1',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      entityType: 'task',
      entityId: 'task-2',
      reactions: [
        {
          id: 'reaction-1',
          userId: 'user-2',
          userName: 'Developer',
          type: 'like',
          createdAt: new Date(Date.now() - 1000 * 60 * 60)
        }
      ],
      isEdited: false
    },
    {
      id: 'comment-2',
      content: 'Good point about error handling. I\'ve added more specific error messages and improved the validation flow. Please review the updated code.',
      author: 'Claude AI',
      authorId: 'claude-ai',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
      entityType: 'task',
      entityId: 'task-2',
      parentCommentId: 'comment-1',
      reactions: [],
      isEdited: false
    }
  ];

  const mockApprovalWorkflows: ApprovalWorkflow[] = [
    {
      id: 'workflow-1',
      entityType: 'task',
      entityId: 'task-2',
      entityName: 'Implement authentication system',
      requiredApprovals: [
        {
          id: 'req-1',
          approverType: UserType.REVIEWER,
          minApprovals: 1,
          criteria: [
            {
              id: 'crit-1',
              title: 'Code Quality',
              description: 'Code follows established patterns and best practices',
              required: true,
              completed: true,
              completedBy: 'Tech Lead',
              completedAt: new Date(Date.now() - 1000 * 60 * 60)
            },
            {
              id: 'crit-2',
              title: 'Security Review',
              description: 'No security vulnerabilities identified',
              required: true,
              completed: false
            },
            {
              id: 'crit-3',
              title: 'Testing Coverage',
              description: 'Adequate test coverage (>80%)',
              required: true,
              completed: true,
              completedBy: 'QA Team',
              completedAt: new Date(Date.now() - 1000 * 60 * 30)
            }
          ],
          timeLimit: 48 // hours
        }
      ],
      currentApprovals: [
        {
          id: 'approval-1',
          workflowId: 'workflow-1',
          approverId: 'user-1',
          approverName: 'Tech Lead',
          approverType: UserType.REVIEWER,
          status: ApprovalStatus.CHANGES_REQUESTED,
          comments: 'Please address the JWT validation concerns mentioned in the comments',
          approvedAt: new Date(Date.now() - 1000 * 60 * 60),
          criteria: [
            {
              id: 'crit-1',
              title: 'Code Quality',
              description: 'Code follows established patterns and best practices',
              required: true,
              completed: true,
              completedBy: 'Tech Lead',
              completedAt: new Date(Date.now() - 1000 * 60 * 60)
            }
          ]
        }
      ],
      status: ApprovalStatus.CHANGES_REQUESTED,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      createdBy: 'Claude AI'
    }
  ];

  const displayComments = comments.length > 0 ? comments : mockComments;
  const displayWorkflows = approvalWorkflows.length > 0 ? approvalWorkflows : mockApprovalWorkflows;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} minutes ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} hours ago`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleCommentSubmit = (entityType: 'task' | 'issue' | 'document', entityId: string) => {
    if (!newComment.trim()) return;

    const comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'> = {
      content: newComment,
      author: currentUser.name,
      authorId: currentUser.id,
      entityType,
      entityId,
      parentCommentId: replyToComment || undefined,
      reactions: [],
      isEdited: false
    };

    if (onCommentCreate) {
      onCommentCreate(comment);
    }

    setNewComment('');
    setReplyToComment(null);
  };

  const handleCommentEdit = (commentId: string) => {
    const comment = displayComments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment(commentId);
      setEditContent(comment.content);
    }
  };

  const handleCommentUpdate = () => {
    if (editingComment && onCommentUpdate) {
      onCommentUpdate(editingComment, editContent);
    }
    setEditingComment(null);
    setEditContent('');
  };

  const handleApprovalSubmission = (workflowId: string, status: ApprovalStatus, comments?: string) => {
    if (onApprovalSubmit) {
      const workflow = displayWorkflows.find(w => w.id === workflowId);
      if (workflow) {
        const approval: Omit<Approval, 'id' | 'approvedAt'> = {
          workflowId,
          approverId: currentUser.id,
          approverName: currentUser.name,
          approverType: currentUser.type,
          status,
          comments,
          criteria: workflow.requiredApprovals[0]?.criteria || []
        };
        onApprovalSubmit(workflowId, approval);
      }
    }
  };

  const renderComment = (comment: Comment) => {
    const isReply = !!comment.parentCommentId;
    const replies = displayComments.filter(c => c.parentCommentId === comment.id);
    const isEditing = editingComment === comment.id;
    const canEdit = comment.authorId === currentUser.id;

    return (
      <div key={comment.id} className={`space-y-3 ${isReply ? 'ml-8' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getUserInitials(comment.author)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.author}</span>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <Badge variant="outline" className="text-xs">edited</Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCommentUpdate}>
                    <Send className="h-3 w-3 mr-1" />
                    Update
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingComment(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                {comment.content}
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {comment.reactions.map((reaction, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    👍 {reaction.userName}
                  </Badge>
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyToComment(comment.id)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCommentEdit(comment.id)}
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (onCommentDelete && confirm('Delete this comment?')) {
                        onCommentDelete(comment.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {replies.map(reply => renderComment(reply))}
      </div>
    );
  };

  const renderApprovalWorkflow = (workflow: ApprovalWorkflow) => {
    const overallProgress = workflow.requiredApprovals.reduce((acc, req) => {
      const completedCriteria = req.criteria.filter(c => c.completed).length;
      return acc + (completedCriteria / req.criteria.length);
    }, 0) / workflow.requiredApprovals.length * 100;

    return (
      <Card key={workflow.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{workflow.entityName}</CardTitle>
              <CardDescription>
                {workflow.entityType} #{workflow.entityId} • Created {formatTimeAgo(workflow.createdAt)}
              </CardDescription>
            </div>
            <Badge variant={getApprovalStatusColor(workflow.status)}>
              {getApprovalStatusIcon(workflow.status)}
              <span className="ml-1">{workflow.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {workflow.requiredApprovals.map(requirement => (
            <div key={requirement.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">
                  Approval from {requirement.approverType.replace('_', ' ')}
                </h5>
                <Badge variant="outline">
                  {requirement.minApprovals} required
                </Badge>
              </div>
              
              <div className="space-y-2">
                {requirement.criteria.map(criteria => (
                  <div key={criteria.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={criteria.completed} disabled />
                      <div>
                        <div className="text-sm font-medium">{criteria.title}</div>
                        <div className="text-xs text-muted-foreground">{criteria.description}</div>
                      </div>
                    </div>
                    {criteria.completed && criteria.completedBy && (
                      <div className="text-xs text-muted-foreground">
                        ✓ {criteria.completedBy}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {workflow.currentApprovals.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium">Current Approvals</h5>
              {workflow.currentApprovals.map(approval => (
                <div key={approval.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(approval.approverName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{approval.approverName}</div>
                      {approval.comments && (
                        <div className="text-xs text-muted-foreground">{approval.comments}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getApprovalStatusColor(approval.status)}>
                    {getApprovalStatusIcon(approval.status)}
                    <span className="ml-1">{approval.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {workflow.status === ApprovalStatus.PENDING && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                size="sm"
                onClick={() => handleApprovalSubmission(workflow.id, ApprovalStatus.APPROVED)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprovalSubmission(workflow.id, ApprovalStatus.CHANGES_REQUESTED, 'Changes requested')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Changes
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleApprovalSubmission(workflow.id, ApprovalStatus.REJECTED, 'Rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Review & Approval Workflow</h1>
        <Badge variant="outline">
          {displayComments.length} comments • {displayWorkflows.length} workflows
        </Badge>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList>
          <TabsTrigger value="comments">Comments & Discussion</TabsTrigger>
          <TabsTrigger value="approvals">Approval Workflows</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comments & Discussion</CardTitle>
              <CardDescription>
                Collaborative discussion threads for tasks, issues, and documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* New Comment Form */}
              <div className="space-y-3 mb-6 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{currentUser.name}</span>
                  {replyToComment && (
                    <Badge variant="secondary" className="text-xs">
                      Replying to comment
                    </Badge>
                  )}
                </div>
                <Textarea
                  placeholder={replyToComment ? "Write a reply..." : "Add a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCommentSubmit('task', 'task-2')}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Comment
                  </Button>
                  {replyToComment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyToComment(null)}
                    >
                      Cancel Reply
                    </Button>
                  )}
                </div>
              </div>

              {/* Comments List */}
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {displayComments
                    .filter(comment => !comment.parentCommentId)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .map(comment => renderComment(comment))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {displayWorkflows.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Approval Workflows</h3>
                <p className="text-muted-foreground">
                  Create approval workflows to manage review processes
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {displayWorkflows.map(workflow => renderApprovalWorkflow(workflow))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Notification Center</h3>
              <p className="text-muted-foreground">
                Real-time alerts for review requests, approvals, and comments
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};