import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Activity, BarChart3 } from 'lucide-react';

interface SystemStatus {
  graphql: {
    status: 'healthy' | 'error' | 'down';
    response_time: number;
    port: number;
  };
  validation: {
    status: 'healthy' | 'error' | 'down';
    response_time: number;
    port: number;
  };
  dashboard: {
    status: 'healthy' | 'error' | 'down';
    response_time: number;
    port: number;
  };
}

interface SystemHealthCardsProps {
  systemStatus: SystemStatus;
}

export const SystemHealthCards: React.FC<SystemHealthCardsProps> = ({ systemStatus }) => {
  const getStatusBadge = (status: 'healthy' | 'error' | 'down') => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500"><span className="w-2 h-2 bg-white rounded-full mr-1" />Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive"><span className="w-2 h-2 bg-white rounded-full mr-1" />Error</Badge>;
      case 'down':
        return <Badge variant="secondary"><span className="w-2 h-2 bg-gray-500 rounded-full mr-1" />Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            GraphQL API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(systemStatus.graphql.status)}
            <div className="text-sm text-muted-foreground">
              Port: {systemStatus.graphql.port}
              {systemStatus.graphql.response_time > 0 && (
                <span className="block">Response: {systemStatus.graphql.response_time}ms</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Validation API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(systemStatus.validation.status)}
            <div className="text-sm text-muted-foreground">
              Port: {systemStatus.validation.port}
              {systemStatus.validation.response_time > 0 && (
                <span className="block">Response: {systemStatus.validation.response_time}ms</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getStatusBadge(systemStatus.dashboard.status)}
            <div className="text-sm text-muted-foreground">
              Port: {systemStatus.dashboard.port}
              {systemStatus.dashboard.response_time > 0 && (
                <span className="block">Response: {systemStatus.dashboard.response_time}ms</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};