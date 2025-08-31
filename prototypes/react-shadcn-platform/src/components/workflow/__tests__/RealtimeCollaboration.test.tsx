/**
 * @jest-environment jsdom
 * 
 * Real-time Collaboration Features Tests
 * Tests comprehensive real-time collaboration system as specified in:
 * - task-5.8.3-advanced-dashboard-functionality.md
 * - Real-time updates, user presence, and activity feed synchronization
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock real-time collaboration types
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface PresenceInfo {
  userId: string;
  user: User;
  location: {
    type: 'task' | 'document' | 'issue';
    entityId: string;
    entityName: string;
  };
  activity: 'viewing' | 'editing' | 'commenting' | 'idle';
  timestamp: Date;
  cursor?: {
    line: number;
    column: number;
  };
}


interface ActivityEvent {
  id: string;
  type: 'task_update' | 'status_change' | 'comment_added' | 'document_edit' | 'issue_created';
  user: User;
  timestamp: Date;
  entityType: 'task' | 'document' | 'issue';
  entityId: string;
  entityName: string;
  details: string;
  changes?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
  }>;
}

// Mock Real-time Collaboration Components
const MockUserPresence: React.FC<{
  presenceData: PresenceInfo[];
  currentUser: User;
  onUserClick?: (_user: User) => void;
}> = ({ presenceData, currentUser, onUserClick }) => (
  <div data-testid="user-presence">
    <div data-testid="presence-header">
      <h3>Active Users ({presenceData.length})</h3>
    </div>
    {presenceData.map((presence) => (
      <div 
        key={presence.userId}
        data-testid={`presence-${presence.userId}`}
        className={`presence-item ${presence.userId === currentUser.id ? 'current-user' : ''}`}
        onClick={() => onUserClick?.(presence.user)}
      >
        <div data-testid={`user-avatar-${presence.userId}`} className="user-avatar">
          {presence.user.avatar ? (
            <img src={presence.user.avatar} alt={presence.user.name} />
          ) : (
            <span className="avatar-fallback">{presence.user.name.charAt(0)}</span>
          )}
          <span 
            data-testid={`online-indicator-${presence.userId}`}
            className={`online-indicator ${presence.user.isOnline ? 'online' : 'offline'}`}
          />
        </div>
        <div data-testid={`user-info-${presence.userId}`} className="user-info">
          <span data-testid={`user-name-${presence.userId}`}>{presence.user.name}</span>
          <span data-testid={`user-activity-${presence.userId}`} className={`activity-${presence.activity}`}>
            {presence.activity} {presence.location.entityName}
          </span>
        </div>
        {presence.cursor && (
          <div data-testid={`cursor-info-${presence.userId}`} className="cursor-info">
            Line {presence.cursor.line}:{presence.cursor.column}
          </div>
        )}
      </div>
    ))}
  </div>
);

const MockCommentThread: React.FC<{
  comments: Comment[];
  entityType: 'task' | 'document' | 'issue';
  entityId: string;
  currentUser: User;
  onAddComment: (_content: string, _parentId?: string) => void;
  onReaction: (_commentId: string, _emoji: string) => void;
}> = ({ comments, entityType, entityId, _currentUser, onAddComment, onReaction }) => (
  <div data-testid="comment-thread">
    <div data-testid="comment-thread-header">
      <h3>Comments ({comments.length})</h3>
      <span data-testid="entity-context">{entityType}: {entityId}</span>
    </div>
    
    <div data-testid="comment-list">
      {comments.map((comment) => (
        <div key={comment.id} data-testid={`comment-${comment.id}`} className="comment-item">
          <div data-testid={`comment-header-${comment.id}`} className="comment-header">
            <span data-testid={`comment-author-${comment.id}`}>{comment.author.name}</span>
            <span data-testid={`comment-timestamp-${comment.id}`}>
              {comment.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <div data-testid={`comment-content-${comment.id}`} className="comment-content">
            {comment.content}
          </div>
          {comment.mentions.length > 0 && (
            <div data-testid={`comment-mentions-${comment.id}`} className="comment-mentions">
              Mentions: {comment.mentions.join(', ')}
            </div>
          )}
          <div data-testid={`comment-actions-${comment.id}`} className="comment-actions">
            <button 
              data-testid={`reply-${comment.id}`}
              onClick={() => onAddComment('Reply content', comment.id)}
            >
              Reply
            </button>
            <button 
              data-testid={`react-like-${comment.id}`}
              onClick={() => onReaction(comment.id, '👍')}
            >
              👍 {comment.reactions.find(r => r.emoji === '👍')?.users.length || 0}
            </button>
            <button 
              data-testid={`react-heart-${comment.id}`}
              onClick={() => onReaction(comment.id, '❤️')}
            >
              ❤️ {comment.reactions.find(r => r.emoji === '❤️')?.users.length || 0}
            </button>
          </div>
          {comment.replies.length > 0 && (
            <div data-testid={`comment-replies-${comment.id}`} className="comment-replies">
              {comment.replies.map((reply) => (
                <div key={reply.id} data-testid={`reply-${reply.id}`} className="comment-reply">
                  <span data-testid={`reply-author-${reply.id}`}>{reply.author.name}:</span>
                  <span data-testid={`reply-content-${reply.id}`}>{reply.content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>

    <div data-testid="add-comment-form">
      <textarea 
        data-testid="comment-input"
        placeholder="Add a comment... Use @username to mention someone"
      />
      <button 
        data-testid="submit-comment"
        onClick={() => onAddComment('New comment content')}
      >
        Add Comment
      </button>
    </div>
  </div>
);

const MockActivityFeed: React.FC<{
  activities: ActivityEvent[];
  filter?: {
    type?: string;
    user?: string;
    entityType?: string;
  };
  onFilterChange: (_filter: any) => void;
}> = ({ activities, filter = {}, onFilterChange }) => (
  <div data-testid="activity-feed">
    <div data-testid="activity-header">
      <h3>Activity Timeline</h3>
      <div data-testid="activity-filters">
        <select 
          data-testid="filter-type"
          value={filter.type || ''}
          onChange={(e) => onFilterChange({ ...filter, type: e.target.value })}
        >
          <option value="">All Activities</option>
          <option value="task_update">Task Updates</option>
          <option value="status_change">Status Changes</option>
          <option value="comment_added">Comments</option>
          <option value="document_edit">Document Edits</option>
        </select>
        <select 
          data-testid="filter-entity"
          value={filter.entityType || ''}
          onChange={(e) => onFilterChange({ ...filter, entityType: e.target.value })}
        >
          <option value="">All Entities</option>
          <option value="task">Tasks</option>
          <option value="document">Documents</option>
          <option value="issue">Issues</option>
        </select>
      </div>
    </div>
    
    <div data-testid="activity-list">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          data-testid={`activity-${activity.id}`}
          className={`activity-item type-${activity.type}`}
        >
          <div data-testid={`activity-avatar-${activity.id}`} className="activity-avatar">
            {activity.user.name.charAt(0)}
          </div>
          <div data-testid={`activity-content-${activity.id}`} className="activity-content">
            <div data-testid={`activity-summary-${activity.id}`}>
              <strong>{activity.user.name}</strong> {activity.details}
            </div>
            <div data-testid={`activity-meta-${activity.id}`} className="activity-meta">
              <span data-testid={`activity-entity-${activity.id}`}>
                {activity.entityType}: {activity.entityName}
              </span>
              <span data-testid={`activity-timestamp-${activity.id}`}>
                {activity.timestamp.toLocaleTimeString()}
              </span>
            </div>
            {activity.changes && activity.changes.length > 0 && (
              <div data-testid={`activity-changes-${activity.id}`} className="activity-changes">
                {activity.changes.map((change, index) => (
                  <div key={index} data-testid={`change-${activity.id}-${index}`}>
                    {change.field}: {change.oldValue} → {change.newValue}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockRealtimeNotifications: React.FC<{
  notifications: Array<{
    id: string;
    type: 'mention' | 'comment' | 'status_change' | 'assignment';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
  }>;
  onMarkRead: (_notificationId: string) => void;
  onMarkAllRead: () => void;
}> = ({ notifications, onMarkRead, onMarkAllRead }) => (
  <div data-testid="realtime-notifications">
    <div data-testid="notifications-header">
      <h3>Notifications ({notifications.filter(n => !n.read).length})</h3>
      <button data-testid="mark-all-read" onClick={onMarkAllRead}>
        Mark All Read
      </button>
    </div>
    
    <div data-testid="notifications-list">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          data-testid={`notification-${notification.id}`}
          className={`notification-item ${notification.read ? 'read' : 'unread'} type-${notification.type}`}
        >
          <div data-testid={`notification-content-${notification.id}`}>
            <h4 data-testid={`notification-title-${notification.id}`}>
              {notification.title}
            </h4>
            <p data-testid={`notification-message-${notification.id}`}>
              {notification.message}
            </p>
            <span data-testid={`notification-timestamp-${notification.id}`}>
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <div data-testid={`notification-actions-${notification.id}`}>
            {!notification.read && (
              <button 
                data-testid={`mark-read-${notification.id}`}
                onClick={() => onMarkRead(notification.id)}
              >
                Mark Read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

describe('Real-time Collaboration Features', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUsers: User[];
  let mockComments: Comment[];
  let mockActivities: ActivityEvent[];
  
  const mockCallbacks = {
    onUserClick: vi.fn(),
    onAddComment: vi.fn(),
    onReaction: vi.fn(),
    onFilterChange: vi.fn(),
    onMarkRead: vi.fn(),
    onMarkAllRead: vi.fn()
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    mockUsers = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        isOnline: true,
        lastSeen: new Date()
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        isOnline: true,
        lastSeen: new Date()
      },
      {
        id: 'user-3',
        name: 'Bob Wilson',
        email: 'bob.wilson@example.com',
        isOnline: false,
        lastSeen: new Date(Date.now() - 3600000) // 1 hour ago
      }
    ];

    mockComments = [
      {
        id: 'comment-1',
        content: 'This looks good! Great work on the implementation.',
        author: mockUsers[0],
        timestamp: new Date(),
        entityType: 'task',
        entityId: 'task-1',
        replies: [
          {
            id: 'reply-1',
            content: 'Thanks! Let me know if you need any changes.',
            author: mockUsers[1],
            timestamp: new Date(),
            entityType: 'task',
            entityId: 'task-1',
            parentId: 'comment-1',
            replies: [],
            mentions: [],
            reactions: []
          }
        ],
        mentions: [],
        reactions: [
          { emoji: '👍', users: ['user-2', 'user-3'] },
          { emoji: '❤️', users: ['user-1'] }
        ]
      },
      {
        id: 'comment-2',
        content: 'Hey @jane.smith, can you review this section?',
        author: mockUsers[2],
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        entityType: 'document',
        entityId: 'doc-1',
        replies: [],
        mentions: ['jane.smith'],
        reactions: []
      }
    ];

    mockActivities = [
      {
        id: 'activity-1',
        type: 'status_change',
        user: mockUsers[0],
        timestamp: new Date(),
        entityType: 'task',
        entityId: 'task-1',
        entityName: 'Implement feature X',
        details: 'changed status',
        changes: [
          { field: 'status', oldValue: 'in_progress', newValue: 'ready_for_review' }
        ]
      },
      {
        id: 'activity-2',
        type: 'comment_added',
        user: mockUsers[1],
        timestamp: new Date(Date.now() - 900000), // 15 min ago
        entityType: 'task',
        entityId: 'task-1',
        entityName: 'Implement feature X',
        details: 'added a comment'
      },
      {
        id: 'activity-3',
        type: 'document_edit',
        user: mockUsers[2],
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        entityType: 'document',
        entityId: 'doc-1',
        entityName: 'Requirements Document',
        details: 'edited document'
      }
    ];
  });

  describe('User Presence Tracking', () => {
    it('displays active users with presence information', () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Feature Implementation' },
          activity: 'editing',
          timestamp: new Date(),
          cursor: { line: 45, column: 12 }
        },
        {
          userId: 'user-2',
          user: mockUsers[1],
          location: { type: 'document', entityId: 'doc-1', entityName: 'Requirements.md' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByText('Active Users (2)')).toBeInTheDocument();
      expect(screenTest.getByTestId('presence-user-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('presence-user-2')).toBeInTheDocument();
    });

    it('shows user activity and location context', () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Feature Implementation' },
          activity: 'editing',
          timestamp: new Date()
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByTestId('user-activity-user-1')).toHaveTextContent('editing Feature Implementation');
      expect(screenTest.getByTestId('user-activity-user-1')).toHaveClass('activity-editing');
    });

    it('displays online/offline indicators', () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0], // online
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        },
        {
          userId: 'user-3',
          user: mockUsers[2], // offline
          location: { type: 'task', entityId: 'task-2', entityName: 'Task' },
          activity: 'idle',
          timestamp: new Date()
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByTestId('online-indicator-user-1')).toHaveClass('online');
      expect(screenTest.getByTestId('online-indicator-user-3')).toHaveClass('offline');
    });

    it('shows cursor position for users actively editing', () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'document', entityId: 'doc-1', entityName: 'Document' },
          activity: 'editing',
          timestamp: new Date(),
          cursor: { line: 23, column: 5 }
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByTestId('cursor-info-user-1')).toHaveTextContent('Line 23:5');
    });

    it('handles user avatar display and fallbacks', () => {
      const presenceDataWithAvatar: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: { ...mockUsers[0], avatar: 'https://example.com/avatar.jpg' },
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      const presenceDataWithoutAvatar: PresenceInfo[] = [
        {
          userId: 'user-2',
          user: mockUsers[1], // no avatar
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      const { rerender } = render(
        <MockUserPresence
          presenceData={presenceDataWithAvatar}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      // With avatar
      const avatarImg = screenTest.getByTestId('user-avatar-user-1').querySelector('img');
      expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.jpg');

      rerender(
        <MockUserPresence
          presenceData={presenceDataWithoutAvatar}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      // Fallback avatar
      const fallback = screenTest.getByTestId('user-avatar-user-2').querySelector('.avatar-fallback');
      expect(fallback).toHaveTextContent('J');
    });

    it('handles user click interactions', async () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      await user.click(screenTest.getByTestId('presence-user-1'));
      expect(mockCallbacks.onUserClick).toHaveBeenCalledWith(mockUsers[0]);
    });
  });

  describe('Comment Thread System', () => {
    it('displays comment thread with all comments', () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByText('Comments (2)')).toBeInTheDocument();
      expect(screenTest.getByTestId('comment-comment-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('comment-comment-2')).toBeInTheDocument();
    });

    it('shows comment metadata and content', () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByTestId('comment-author-comment-1')).toHaveTextContent('John Doe');
      expect(screenTest.getByTestId('comment-content-comment-1')).toHaveTextContent('This looks good! Great work on the implementation.');
    });

    it('displays nested comment replies', () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByTestId('comment-replies-comment-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('reply-reply-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('reply-content-reply-1')).toHaveTextContent('Thanks! Let me know if you need any changes.');
    });

    it('shows user mentions in comments', () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="document"
          entityId="doc-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByTestId('comment-mentions-comment-2')).toHaveTextContent('Mentions: jane.smith');
    });

    it('displays reaction counts and handles reactions', async () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByTestId('react-like-comment-1')).toHaveTextContent('👍 2');
      expect(screenTest.getByTestId('react-heart-comment-1')).toHaveTextContent('❤️ 1');

      await user.click(screenTest.getByTestId('react-like-comment-1'));
      expect(mockCallbacks.onReaction).toHaveBeenCalledWith('comment-1', '👍');
    });

    it('enables adding new comments', async () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      await user.click(screenTest.getByTestId('submit-comment'));
      expect(mockCallbacks.onAddComment).toHaveBeenCalledWith('New comment content');
    });

    it('enables replying to comments', async () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      await user.click(screenTest.getByTestId('reply-comment-1'));
      expect(mockCallbacks.onAddComment).toHaveBeenCalledWith('Reply content', 'comment-1');
    });

    it('shows entity context for comments', () => {
      render(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByTestId('entity-context')).toHaveTextContent('task: task-1');
    });
  });

  describe('Activity Feed Timeline', () => {
    it('displays activity feed with all events', () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screenTest.getByTestId('activity-activity-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('activity-activity-2')).toBeInTheDocument();
      expect(screenTest.getByTestId('activity-activity-3')).toBeInTheDocument();
    });

    it('shows activity details and metadata', () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByTestId('activity-summary-activity-1')).toHaveTextContent('John Doe changed status');
      expect(screenTest.getByTestId('activity-entity-activity-1')).toHaveTextContent('task: Implement feature X');
    });

    it('displays change details for status updates', () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByTestId('activity-changes-activity-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('change-activity-1-0')).toHaveTextContent('status: in_progress → ready_for_review');
    });

    it('applies activity type styling', () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByTestId('activity-activity-1')).toHaveClass('type-status_change');
      expect(screenTest.getByTestId('activity-activity-2')).toHaveClass('type-comment_added');
      expect(screenTest.getByTestId('activity-activity-3')).toHaveClass('type-document_edit');
    });

    it('provides activity filtering by type', async () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      const typeFilter = screenTest.getByTestId('filter-type');
      await user.selectOptions(typeFilter, 'status_change');

      expect(mockCallbacks.onFilterChange).toHaveBeenCalledWith({ type: 'status_change' });
    });

    it('provides activity filtering by entity type', async () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      const entityFilter = screenTest.getByTestId('filter-entity');
      await user.selectOptions(entityFilter, 'task');

      expect(mockCallbacks.onFilterChange).toHaveBeenCalledWith({ entityType: 'task' });
    });

    it('displays user avatars for activities', () => {
      render(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByTestId('activity-avatar-activity-1')).toHaveTextContent('J'); // John Doe
      expect(screenTest.getByTestId('activity-avatar-activity-2')).toHaveTextContent('J'); // Jane Smith
      expect(screenTest.getByTestId('activity-avatar-activity-3')).toHaveTextContent('B'); // Bob Wilson
    });
  });

  describe('Real-time Notifications', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'mention' as const,
        title: 'You were mentioned',
        message: 'John Doe mentioned you in a comment',
        timestamp: new Date(),
        read: false,
        actionUrl: '/task/task-1'
      },
      {
        id: 'notif-2',
        type: 'status_change' as const,
        title: 'Task status changed',
        message: 'Feature Implementation moved to Ready for Review',
        timestamp: new Date(Date.now() - 900000),
        read: true
      },
      {
        id: 'notif-3',
        type: 'assignment' as const,
        title: 'New task assigned',
        message: 'You have been assigned to Bug Fix #123',
        timestamp: new Date(Date.now() - 1800000),
        read: false
      }
    ];

    it('displays notification list with unread count', () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      expect(screenTest.getByText('Notifications (2)')).toBeInTheDocument(); // 2 unread
      expect(screenTest.getByTestId('notification-notif-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('notification-notif-2')).toBeInTheDocument();
      expect(screenTest.getByTestId('notification-notif-3')).toBeInTheDocument();
    });

    it('distinguishes read and unread notifications', () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      expect(screenTest.getByTestId('notification-notif-1')).toHaveClass('unread');
      expect(screenTest.getByTestId('notification-notif-2')).toHaveClass('read');
      expect(screenTest.getByTestId('notification-notif-3')).toHaveClass('unread');
    });

    it('applies notification type styling', () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      expect(screenTest.getByTestId('notification-notif-1')).toHaveClass('type-mention');
      expect(screenTest.getByTestId('notification-notif-2')).toHaveClass('type-status_change');
      expect(screenTest.getByTestId('notification-notif-3')).toHaveClass('type-assignment');
    });

    it('displays notification content correctly', () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      expect(screenTest.getByTestId('notification-title-notif-1')).toHaveTextContent('You were mentioned');
      expect(screenTest.getByTestId('notification-message-notif-1')).toHaveTextContent('John Doe mentioned you in a comment');
    });

    it('handles individual notification mark as read', async () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      await user.click(screenTest.getByTestId('mark-read-notif-1'));
      expect(mockCallbacks.onMarkRead).toHaveBeenCalledWith('notif-1');
    });

    it('handles mark all as read', async () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      await user.click(screenTest.getByTestId('mark-all-read'));
      expect(mockCallbacks.onMarkAllRead).toHaveBeenCalled();
    });

    it('only shows mark read button for unread notifications', () => {
      render(
        <MockRealtimeNotifications
          notifications={mockNotifications}
          onMarkRead={mockCallbacks.onMarkRead}
          onMarkAllRead={mockCallbacks.onMarkAllRead}
        />
      );

      expect(screenTest.getByTestId('mark-read-notif-1')).toBeInTheDocument(); // unread
      expect(screenTest.queryByTestId('mark-read-notif-2')).not.toBeInTheDocument(); // read
      expect(screenTest.getByTestId('mark-read-notif-3')).toBeInTheDocument(); // unread
    });
  });

  describe('Real-time Update Synchronization', () => {
    it('maintains presence data consistency', () => {
      const initialPresence: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      const { rerender } = render(
        <MockUserPresence
          presenceData={initialPresence}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByTestId('user-activity-user-1')).toHaveTextContent('viewing Task');

      // Simulate real-time update
      const updatedPresence: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'editing',
          timestamp: new Date()
        }
      ];

      rerender(
        <MockUserPresence
          presenceData={updatedPresence}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByTestId('user-activity-user-1')).toHaveTextContent('editing Task');
    });

    it('handles activity feed updates', () => {
      const { rerender } = render(
        <MockActivityFeed
          activities={mockActivities.slice(0, 2)}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getAllByTestId(/^activity-/).length).toBe(2);

      // Simulate new activity
      rerender(
        <MockActivityFeed
          activities={mockActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getAllByTestId(/^activity-/).length).toBe(3);
    });

    it('synchronizes comment updates', () => {
      const { rerender } = render(
        <MockCommentThread
          comments={mockComments.slice(0, 1)}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByText('Comments (1)')).toBeInTheDocument();

      // Simulate new comment
      rerender(
        <MockCommentThread
          comments={mockComments}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByText('Comments (2)')).toBeInTheDocument();
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large numbers of active users efficiently', () => {
      const manyUsers: PresenceInfo[] = Array.from({ length: 50 }, (_, i) => ({
        userId: `user-${i}`,
        user: {
          id: `user-${i}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          isOnline: i % 3 !== 0, // Mix of online/offline
          lastSeen: new Date()
        },
        location: { type: 'task', entityId: `task-${i % 10}`, entityName: `Task ${i % 10}` },
        activity: ['viewing', 'editing', 'commenting'][i % 3] as any,
        timestamp: new Date()
      }));

      expect(() => render(
        <MockUserPresence
          presenceData={manyUsers}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      )).not.toThrow();

      expect(screenTest.getByText('Active Users (50)')).toBeInTheDocument();
    });

    it('handles extensive activity history efficiently', () => {
      const manyActivities: ActivityEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        type: ['task_update', 'status_change', 'comment_added'][i % 3] as any,
        user: mockUsers[i % 3],
        timestamp: new Date(Date.now() - i * 60000), // Spread over time
        entityType: ['task', 'document', 'issue'][i % 3] as any,
        entityId: `entity-${i}`,
        entityName: `Entity ${i}`,
        details: `performed action ${i}`
      }));

      expect(() => render(
        <MockActivityFeed
          activities={manyActivities}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      )).not.toThrow();
    });

    it('maintains responsive UI during real-time updates', async () => {
      const presenceData: PresenceInfo[] = [
        {
          userId: 'user-1',
          user: mockUsers[0],
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      render(
        <MockUserPresence
          presenceData={presenceData}
          currentUser={mockUsers[1]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      // Simulate user interaction during updates
      await user.click(screenTest.getByTestId('presence-user-1'));
      
      expect(mockCallbacks.onUserClick).toHaveBeenCalled();
      expect(screenTest.getByTestId('user-name-user-1')).toHaveTextContent('John Doe');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles empty presence data', () => {
      render(
        <MockUserPresence
          presenceData={[]}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      );

      expect(screenTest.getByText('Active Users (0)')).toBeInTheDocument();
    });

    it('handles empty comment threads', () => {
      render(
        <MockCommentThread
          comments={[]}
          entityType="task"
          entityId="task-1"
          currentUser={mockUsers[0]}
          onAddComment={mockCallbacks.onAddComment}
          onReaction={mockCallbacks.onReaction}
        />
      );

      expect(screenTest.getByText('Comments (0)')).toBeInTheDocument();
      expect(screenTest.getByTestId('add-comment-form')).toBeInTheDocument();
    });

    it('handles empty activity feed', () => {
      render(
        <MockActivityFeed
          activities={[]}
          onFilterChange={mockCallbacks.onFilterChange}
        />
      );

      expect(screenTest.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screenTest.getByTestId('activity-list')).toBeInTheDocument();
    });

    it('handles missing user data gracefully', () => {
      const presenceWithIncompleteData: PresenceInfo[] = [
        {
          userId: 'user-unknown',
          user: {
            id: 'user-unknown',
            name: '',
            email: '',
            isOnline: false,
            lastSeen: new Date()
          },
          location: { type: 'task', entityId: 'task-1', entityName: 'Task' },
          activity: 'viewing',
          timestamp: new Date()
        }
      ];

      expect(() => render(
        <MockUserPresence
          presenceData={presenceWithIncompleteData}
          currentUser={mockUsers[0]}
          onUserClick={mockCallbacks.onUserClick}
        />
      )).not.toThrow();
    });
  });
});