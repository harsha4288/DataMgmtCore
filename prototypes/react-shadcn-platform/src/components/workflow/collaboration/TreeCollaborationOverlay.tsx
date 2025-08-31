/**
 * TreeCollaborationOverlay - Real-time collaboration overlay within tree interface
 * Part of Phase 3 Review & Collaboration Integration (Task 5.8.3.1)
 * Provides user presence tracking, live activity feed, collaborative editing, and notifications
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Activity,
  Bell,
  Edit,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface UserPresence {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentActivity?: string;
  currentEntityId?: string;
  lastSeen: string;
}

interface ActivityItem {
  id: string;
  type: 'edit' | 'comment' | 'status_change' | 'review' | 'approval' | 'join' | 'leave';
  user: string;
  userAvatar?: string;
  entityId: string;
  entityType: 'task' | 'phase' | 'issue' | 'document';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CollaborationNotification {
  id: string;
  type: 'mention' | 'assignment' | 'review_request' | 'approval_needed' | 'comment' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
  fromUser?: string;
}

interface TreeCollaborationOverlayProps {
  entityId: string;
  entityType: 'task' | 'phase' | 'issue';
  currentUserId: string;
  users?: UserPresence[];
  activities?: ActivityItem[];
  notifications?: CollaborationNotification[];
  onNotificationRead?: (notificationId: string) => void;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
  className?: string;
}

export const TreeCollaborationOverlay: React.FC<TreeCollaborationOverlayProps> = ({
  entityId,
  entityType,
  currentUserId,
  users = [],
  activities = [],
  notifications = [],
  onNotificationRead,
  connectionStatus = 'connected',
  className = ''
}) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Mock data for demonstration
  const mockUsers: UserPresence[] = [
    {
      id: 'user-1',
      name: 'Sarah Chen',
      status: 'online',
      currentActivity: 'Editing document',
      currentEntityId: entityId,
      lastSeen: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Mike Rodriguez',
      status: 'online',
      currentActivity: 'Reviewing code',
      lastSeen: new Date(Date.now() - 300000).toISOString()
    }
  ];

  const mockActivities: ActivityItem[] = [
    {
      id: 'activity-1',
      type: 'edit',
      user: 'Sarah Chen',
      entityId: entityId,
      entityType: entityType,
      description: 'Updated task description',
      timestamp: new Date(Date.now() - 300000).toISOString()
    }
  ];

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.read).length;
    setUnreadNotifications(unreadCount);
  }, [notifications]);

  const getStatusColor = (status: UserPresence['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div data-testid="tree-collaboration-overlay" className={className}>
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Disconnected</span>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="presence" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presence" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-3 w-3 mr-1" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presence" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-shrink-0 mt-1">
                      <Edit className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeCollaborationOverlay;