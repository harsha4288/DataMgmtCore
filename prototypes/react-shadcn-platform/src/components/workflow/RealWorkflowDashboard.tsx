/**
 * Real Project Management Dashboard - Main Container
 * Uses modular components with real API connections
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, CheckCircle } from 'lucide-react';
import { EnhancedProjectTreeView } from './EnhancedProjectTreeView';
import { QualityControlPanel } from './QualityControlPanel';
import { DocumentationHealthPanel } from './DocumentationHealthPanel';
import { StatusWorkflowPanel } from './status-management/StatusWorkflowPanel';
import { StatusHistoryPanel } from './status-management/StatusHistoryPanel';
import { IssueManagementPanel } from './issue-management/IssueManagementPanel';
import { ReviewWorkflowPanel } from './review-approval/ReviewWorkflowPanel';
import { CollaborationOverlay } from './collaboration/CollaborationOverlay';

export const RealWorkflowDashboard: React.FC = () => {
  return (
    <div className="relative space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Project Management Dashboard</h1>
        <Badge variant="outline">Real Data Only</Badge>
      </div>
      
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          This dashboard shows only real, implementable features. No mock data.
          APIs: GraphQL (3004), Validation (3005), Quality Pipeline (scripts/).
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="project">Project Structure</TabsTrigger>
          <TabsTrigger value="status">Status Management</TabsTrigger>
          <TabsTrigger value="issues">Issue Tracking</TabsTrigger>
          <TabsTrigger value="reviews">Reviews & Approval</TabsTrigger>
          <TabsTrigger value="history">Status History</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="project" className="space-y-4">
          <EnhancedProjectTreeView />
        </TabsContent>
        
        <TabsContent value="status" className="space-y-4">
          <StatusWorkflowPanel />
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-4">
          <IssueManagementPanel />
        </TabsContent>
        
        <TabsContent value="reviews" className="space-y-4">
          <ReviewWorkflowPanel />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <StatusHistoryPanel />
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          <QualityControlPanel />
        </TabsContent>
        
        <TabsContent value="docs" className="space-y-4">
          <DocumentationHealthPanel />
        </TabsContent>
      </Tabs>

      {/* Real-time Collaboration Overlay */}
      <CollaborationOverlay />
    </div>
  );
};