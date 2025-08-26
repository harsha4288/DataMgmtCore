/**
 * Real Project Management Dashboard - Main Container
 * Uses modular components with real API connections
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, CheckCircle } from 'lucide-react';
import { ProjectTreeView } from './ProjectTreeView';
import { QualityControlPanel } from './QualityControlPanel';
import { DocumentationHealthPanel } from './DocumentationHealthPanel';

export const RealWorkflowDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project">Project Structure</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="project" className="space-y-4">
          <ProjectTreeView />
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          <QualityControlPanel />
        </TabsContent>
        
        <TabsContent value="docs" className="space-y-4">
          <DocumentationHealthPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};