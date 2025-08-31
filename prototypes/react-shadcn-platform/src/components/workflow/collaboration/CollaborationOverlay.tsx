/**
 * Collaboration Overlay - Real-time collaboration features
 * Provides real-time updates, user presence, and collaborative editing
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Eye,
  Edit3,
  MessageCircle,
  Bell,
  Activity,
  Wifi,
  WifiOff,
  Circle
} from 'lucide-react';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentActivity?: string;
  lastSeen?: Date;
}

interface RealtimeActivity {
  id: string;
  userId: string;
  userName: string;
  type: 'comment' | 'edit' | 'status_change' | 'view';
  description: string;
  entityType: 'task' | 'issue' | 'document';
  entityId: string;
  timestamp: Date;
}

interface CollaborationOverlayProps {
  onlineUsers?: OnlineUser[];
  realtimeActivities?: RealtimeActivity[];
  currentUserId?: string;
  isConnected?: boolean;
}

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({
  onlineUsers = [],
  realtimeActivities = [],
  _currentUserId = 'current-user',
  isConnected = true
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Mock data for demonstration
  const mockUsers: OnlineUser[] = [
    {
      id: 'user-1',
      name: 'Tech Lead',
      status: 'online',
      currentActivity: 'Reviewing authentication task',
      lastSeen: new Date()
    },
    {
      id: 'user-2',
      name: 'QA Tester',
      status: 'online',
      currentActivity: 'Testing login flow',
      lastSeen: new Date()
    },
    {
      id: 'user-3',
      name: 'Product Manager',
      status: 'away',
      currentActivity: 'In meeting',
      lastSeen: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },
    {
      id: 'claude-ai',
      name: 'Claude AI',
      status: 'online',
      currentActivity: 'Working on documentation system',
      lastSeen: new Date()
    }
  ];

  const mockActivities: RealtimeActivity[] = [
    {
      id: 'activity-1',
      userId: 'user-1',
      userName: 'Tech Lead',
      type: 'comment',
      description: 'Added comment on JWT validation concerns',
      entityType: 'task',
      entityId: 'task-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
    },
    {
      id: 'activity-2',
      userId: 'claude-ai',
      userName: 'Claude AI',
      type: 'edit',
      description: 'Updated authentication system documentation',
      entityType: 'document',
      entityId: 'doc-auth',
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      id: 'activity-3',
      userId: 'user-2',
      userName: 'QA Tester',
      type: 'status_change',
      description: 'Changed status of "Create login form" to Completed',
      entityType: 'task',
      entityId: 'subtask-2-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 10) // 10 minutes ago
    },
    {
      id: 'activity-4',
      userId: 'user-3',
      userName: 'Product Manager',
      type: 'view',
      description: 'Viewed issue: Database connection timeout',
      entityType: 'issue',
      entityId: 'issue-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    }
  ];

  const displayUsers = onlineUsers.length > 0 ? onlineUsers : mockUsers;
  const displayActivities = realtimeActivities.length > 0 ? realtimeActivities : mockActivities;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="h-3 w-3" />;
      case 'edit': return <Edit3 className="h-3 w-3" />;
      case 'status_change': return <Activity className="h-3 w-3" />;
      case 'view': return <Eye className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const onlineUsersCount = displayUsers.filter(user => user.status === 'online').length;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* Connection Status */}
      <Card className="p-2">
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span className="text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500" />
              <span className="text-red-500">Disconnected</span>
            </>
          )}
        </div>
      </Card>

      {/* Online Users */}
      <Card className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUserList(!showUserList)}
          className="w-full justify-between h-8"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">{onlineUsersCount} online</span>
          </div>
          <div className="flex -space-x-1">
            {displayUsers.slice(0, 3).map(user => (
              <div key={user.id} className="relative">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background ${getStatusColor(user.status)}`} />
              </div>
            ))}
            {displayUsers.length > 3 && (
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">
                  +{displayUsers.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </Button>
        
        {showUserList && (
          <Card className="absolute right-0 top-full mt-1 w-80 z-10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Team Members</h4>
                <Badge variant="outline">{onlineUsersCount} online</Badge>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {displayUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{user.name}</div>
                        {user.currentActivity && (
                          <div className="text-xs text-muted-foreground truncate">
                            {user.currentActivity}
                          </div>
                        )}
                        {user.status !== 'online' && user.lastSeen && (
                          <div className="text-xs text-muted-foreground">
                            Last seen {formatTimeAgo(user.lastSeen)}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </Card>

      {/* Real-time Activity Feed */}
      <Card className="p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActivity(!showActivity)}
          className="w-full justify-between h-8"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Live Activity</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {displayActivities.length}
          </Badge>
        </Button>
        
        {showActivity && (
          <Card className="absolute right-0 top-full mt-1 w-96 z-10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Recent Activity</h4>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {displayActivities
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(activity.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getActivityIcon(activity.type)}
                            <span className="font-medium text-xs">{activity.userName}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.entityType}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </Card>

      {/* Notifications */}
      <Card className="p-2">
        <Button variant="ghost" size="sm" className="w-full h-8">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">3</span>
          </div>
        </Button>
      </Card>
    </div>
  );
};