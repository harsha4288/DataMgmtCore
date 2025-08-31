/**
 * TreeReviewSystem - Review and approval workflow system within tree nodes
 * Part of Phase 3 Review & Collaboration Integration (Task 5.8.3.1)
 * Provides inline comment threads, approval workflows, review assignment, and audit trails
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Eye,
  FileText,
  Calendar,
  AlertTriangle,
  Plus
} from 'lucide-react';

type ReviewStatus = 'pending' | 'approved' | 'changes_requested' | 'rejected';
type CommentType = 'general' | 'suggestion' | 'issue' | 'question';

interface ReviewComment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  timestamp: string;
  type: CommentType;
  resolved: boolean;
  replies: ReviewComment[];
  lineNumber?: number;
  attachments?: string[];
}

interface Review {
  id: string;
  entityId: string;
  reviewer: string;
  reviewerAvatar?: string;
  status: ReviewStatus;
  comments: ReviewComment[];
  checklist: ChecklistItem[];
  approvalDate?: string;
  requestDate: string;
  summary?: string;
}

interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  required: boolean;
  completedBy?: string;
  completedAt?: string;
}

interface Approval {
  id: string;
  entityId: string;
  approver: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  comment?: string;
  conditions?: string[];
}

interface TreeReviewSystemProps {
  entityId: string;
  entityType: 'task' | 'phase' | 'issue' | 'document';
  reviews?: Review[];
  approvals?: Approval[];
  onCreateReview?: (review: Partial<Review>) => void;
  onUpdateReview?: (reviewId: string, updates: Partial<Review>) => void;
  onCreateApproval?: (approval: Partial<Approval>) => void;
  onAssignReviewer?: (reviewerId: string) => void;
  currentUser?: string;
  className?: string;
}

export const TreeReviewSystem: React.FC<TreeReviewSystemProps> = ({
  entityId,
  entityType,
  reviews = [],
  approvals = [],
  onCreateReview,
  onUpdateReview,
  onCreateApproval,
  onAssignReviewer,
  currentUser = 'Current User',
  className = ''
}) => {
  const [newComment, setNewComment] = useState('');
  const [newCommentType, setNewCommentType] = useState<CommentType>('general');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const [newReviewSummary, setNewReviewSummary] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Mock data if none provided
  const mockReviews: Review[] = reviews.length > 0 ? reviews : [
    {
      id: 'review-1',
      entityId,
      reviewer: 'Senior Developer',
      reviewerAvatar: '/avatars/senior-dev.jpg',
      status: 'changes_requested',
      requestDate: new Date(Date.now() - 86400000).toISOString(),
      summary: 'Code quality review - several improvements needed',
      comments: [
        {
          id: 'comment-1',
          content: 'Consider using async/await instead of promises here for better readability.',
          author: 'Senior Developer',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'suggestion',
          resolved: false,
          replies: [
            {
              id: 'reply-1',
              content: 'Good point, I\'ll refactor this.',
              author: 'Developer',
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              type: 'general',
              resolved: false,
              replies: []
            }
          ],
          lineNumber: 42
        }
      ],
      checklist: [
        { id: 'check-1', description: 'Code follows style guidelines', completed: true, required: true, completedBy: 'Auto Linter', completedAt: new Date().toISOString() },
        { id: 'check-2', description: 'Unit tests cover new functionality', completed: false, required: true },
        { id: 'check-3', description: 'Documentation updated', completed: false, required: true },
        { id: 'check-4', description: 'Performance impact assessed', completed: true, required: false, completedBy: 'Performance Team' }
      ]
    },
    {
      id: 'review-2',
      entityId,
      reviewer: 'QA Lead',
      reviewerAvatar: '/avatars/qa-lead.jpg',
      status: 'approved',
      requestDate: new Date(Date.now() - 172800000).toISOString(),
      approvalDate: new Date(Date.now() - 86400000).toISOString(),
      summary: 'QA review passed with minor suggestions',
      comments: [
        {
          id: 'comment-2',
          content: 'Test coverage looks good. Consider adding edge case tests.',
          author: 'QA Lead',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'suggestion',
          resolved: true,
          replies: []
        }
      ],
      checklist: [
        { id: 'check-5', description: 'All test cases pass', completed: true, required: true, completedBy: 'QA Team', completedAt: new Date().toISOString() },
        { id: 'check-6', description: 'Edge cases covered', completed: true, required: true, completedBy: 'QA Team' },
        { id: 'check-7', description: 'Performance benchmarks met', completed: true, required: false, completedBy: 'Auto Tests' }
      ]
    }
  ];

  const mockApprovals: Approval[] = approvals.length > 0 ? approvals : [
    {
      id: 'approval-1',
      entityId,
      approver: 'Project Manager',
      approverRole: 'PM',
      status: 'approved',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      comment: 'Approved for deployment after changes are implemented'
    },
    {
      id: 'approval-2',
      entityId,
      approver: 'Technical Lead',
      approverRole: 'Tech Lead',
      status: 'pending',
      timestamp: new Date(Date.now() - 21600000).toISOString(),
      conditions: ['Code review changes implemented', 'Unit test coverage > 90%']
    }
  ];

  const getReviewStatusIcon = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <ThumbsUp className="h-3 w-3" />;
      case 'changes_requested': return <AlertTriangle className="h-3 w-3" />;
      case 'rejected': return <ThumbsDown className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getReviewStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'approved': return 'default';
      case 'changes_requested': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getCommentTypeIcon = (type: CommentType) => {
    switch (type) {
      case 'suggestion': return <MessageSquare className="h-3 w-3" />;
      case 'issue': return <AlertTriangle className="h-3 w-3" />;
      case 'question': return <MessageSquare className="h-3 w-3" />;
      default: return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getCommentTypeColor = (type: CommentType) => {
    switch (type) {
      case 'suggestion': return 'default';
      case 'issue': return 'destructive';
      case 'question': return 'secondary';
      default: return 'outline';
    }
  };

  const handleAddComment = (review: Review) => {
    if (newComment.trim() && onUpdateReview) {
      const updatedComments = [
        ...review.comments,
        {
          id: `comment-${Date.now()}`,
          content: newComment,
          author: currentUser,
          timestamp: new Date().toISOString(),
          type: newCommentType,
          resolved: false,
          replies: []
        }
      ];
      onUpdateReview(review.id, { comments: updatedComments });
      setNewComment('');
      setNewCommentType('general');
    }
  };

  const handleAddReply = (comment: ReviewComment, review: Review) => {
    if (replyContent.trim() && onUpdateReview) {
      const updatedReplies = [
        ...comment.replies,
        {
          id: `reply-${Date.now()}`,
          content: replyContent,
          author: currentUser,
          timestamp: new Date().toISOString(),
          type: 'general' as CommentType,
          resolved: false,
          replies: []
        }
      ];
      
      const updatedComments = review.comments.map(c => 
        c.id === comment.id ? { ...c, replies: updatedReplies } : c
      );
      
      onUpdateReview(review.id, { comments: updatedComments });
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleResolveComment = (commentId: string, review: Review) => {
    if (onUpdateReview) {
      const updatedComments = review.comments.map(c => 
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      );
      onUpdateReview(review.id, { comments: updatedComments });
    }
  };

  const handleChecklistToggle = (itemId: string, review: Review) => {
    if (onUpdateReview) {
      const updatedChecklist = review.checklist.map(item => 
        item.id === itemId ? { 
          ...item, 
          completed: !item.completed,
          completedBy: !item.completed ? undefined : currentUser,
          completedAt: !item.completed ? undefined : new Date().toISOString()
        } : item
      );
      onUpdateReview(review.id, { checklist: updatedChecklist });
    }
  };

  const calculateProgress = (review: Review) => {
    const completed = review.checklist.filter(item => item.completed).length;
    const total = review.checklist.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  return (
    <div data-testid="tree-review-system" className={`w-full ${className}`}>
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Reviews ({mockReviews.length})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({mockApprovals.length})</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Code Reviews</h3>
              <Button size="sm" onClick={() => setIsCreatingReview(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Request Review
              </Button>
            </div>
            
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <Card key={review.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedReview(review)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.reviewerAvatar} />
                            <AvatarFallback>
                              {review.reviewer.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{review.reviewer}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getReviewStatusColor(review.status)}>
                            {getReviewStatusIcon(review.status)}
                            {review.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{review.summary}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {review.comments.length} comments
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {Math.round(calculateProgress(review))}% complete
                            </span>
                          </div>
                          {review.approvalDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Approved {new Date(review.approvalDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Approval Workflow</h3>
            </div>
            
            <div className="space-y-3">
              {mockApprovals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {approval.approver.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{approval.approver}</p>
                          <p className="text-xs text-muted-foreground">{approval.approverRole}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={approval.status === 'approved' ? 'default' : 
                                      approval.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {approval.status === 'approved' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                           approval.status === 'rejected' ? <XCircle className="h-3 w-3 mr-1" /> :
                           <Clock className="h-3 w-3 mr-1" />}
                          {approval.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(approval.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {approval.comment && (
                      <p className="text-sm text-muted-foreground mb-2">{approval.comment}</p>
                    )}
                    {approval.conditions && approval.conditions.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Conditions:</p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {approval.conditions.map((condition, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Review Comments</h3>
                <Button size="sm" variant="outline" onClick={() => setSelectedReview(null)}>
                  Back to Reviews
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {selectedReview.comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {comment.author.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{comment.author}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString()}
                                  {comment.lineNumber && ` • Line ${comment.lineNumber}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getCommentTypeColor(comment.type)}>
                                {getCommentTypeIcon(comment.type)}
                                {comment.type}
                              </Badge>
                              <Button
                                size="sm"
                                variant={comment.resolved ? 'default' : 'outline'}
                                onClick={() => handleResolveComment(comment.id, selectedReview)}
                              >
                                {comment.resolved ? 'Resolved' : 'Resolve'}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm pl-11">{comment.content}</p>
                          
                          {/* Replies */}
                          {comment.replies.length > 0 && (
                            <div className="pl-11 space-y-2 border-l-2 border-muted ml-4">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="pl-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {reply.author.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium text-xs">{reply.author}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(reply.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                  <p className="text-sm pl-8">{reply.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reply form */}
                          {replyingTo === comment.id ? (
                            <div className="pl-11 space-y-2">
                              <Textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddReply(comment, selectedReview)}>
                                  Reply
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="pl-11">
                              <Button size="sm" variant="ghost" onClick={() => setReplyingTo(comment.id)}>
                                Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {/* Add new comment */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Select value={newCommentType} onValueChange={(value) => setNewCommentType(value as CommentType)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="issue">Issue</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                    />
                    <Button onClick={() => handleAddComment(selectedReview)}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Review checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Review Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedReview.checklist.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleChecklistToggle(item.id, selectedReview)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {item.description}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {item.completed && item.completedBy && (
                            <p className="text-xs text-muted-foreground">
                              Completed by {item.completedBy}
                              {item.completedAt && ` on ${new Date(item.completedAt).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {!selectedReview && (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a review to view comments</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Audit Trail</h3>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {/* Mock audit entries */}
                {[
                  { action: 'Review requested', user: 'Project Manager', timestamp: new Date(Date.now() - 172800000).toISOString() },
                  { action: 'Review assigned to Senior Developer', user: 'System', timestamp: new Date(Date.now() - 172800000 + 300000).toISOString() },
                  { action: 'Review started', user: 'Senior Developer', timestamp: new Date(Date.now() - 86400000).toISOString() },
                  { action: 'Comments added', user: 'Senior Developer', timestamp: new Date(Date.now() - 3600000).toISOString() },
                  { action: 'Changes requested', user: 'Senior Developer', timestamp: new Date(Date.now() - 3600000 + 300000).toISOString() },
                  { action: 'Developer replied to comments', user: 'Developer', timestamp: new Date(Date.now() - 1800000).toISOString() }
                ].map((entry, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        by {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeReviewSystem;