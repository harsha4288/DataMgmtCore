import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, RefreshCw, ExternalLink } from 'lucide-react';

interface SystemHeaderProps {
  isConnected: boolean;
  isRefreshing: boolean;
  lastUpdate: Date | null;
  onRefresh: () => void;
  onOpenDashboard: () => void;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  isConnected,
  isRefreshing,
  lastUpdate,
  onRefresh,
  onOpenDashboard
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Documentation System
              <Badge variant="outline" className="ml-2">Phase 5</Badge>
            </CardTitle>
            <CardDescription>
              GraphQL API • Validation Engine • Quality Pipeline • Real-time Dashboard
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button 
              onClick={onRefresh} 
              disabled={isRefreshing}
              size="sm"
              variant="outline"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={onOpenDashboard}
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'Never updated'}
        </div>
      </CardContent>
    </Card>
  );
};