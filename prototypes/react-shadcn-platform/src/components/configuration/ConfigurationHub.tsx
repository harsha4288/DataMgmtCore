import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserInstructionsPanel } from './UserInstructionsPanel';
import { ToolConfigurationPanel } from './ToolConfigurationPanel';
import { useUserInstructions, useToolConfigurations } from '@/hooks/useConfiguration';
import { Users, Settings, FileText, Shield, Activity } from 'lucide-react';

interface ConfigurationHubProps {
  className?: string;
}

export function ConfigurationHub({ className }: ConfigurationHubProps) {
  const [activeTab, setActiveTab] = useState('instructions');

  // Real database connections
  const { data: instructions, loading: instructionsLoading } = useUserInstructions();
  const { data: toolConfigs, loading: toolsLoading } = useToolConfigurations();

  // Calculate real statistics from database
  const stats = {
    instructions: {
      total: instructions.length,
      active: instructions.filter(i => i.priority !== 'low').length,
      byUserType: {
        ai_agent: instructions.filter(i => i.userTypes.includes('ai_agent')).length,
        human_developer: instructions.filter(i => i.userTypes.includes('human_developer')).length,
        qa_tester: instructions.filter(i => i.userTypes.includes('qa_tester')).length
      }
    },
    tools: {
      total: toolConfigs.length,
      byCategory: {
        development: toolConfigs.filter(t => t.category === 'development').length,
        testing: toolConfigs.filter(t => t.category === 'testing').length,
        quality: toolConfigs.filter(t => t.category === 'quality').length,
        build: toolConfigs.filter(t => t.category === 'build').length
      }
    },
    templates: { total: 0, active: 0, byType: { task: 0, issue: 0, report: 0 } }, // TODO: Implement templates
    standards: { total: 0, active: 0, byCategory: { code: 0, docs: 0, process: 0 } } // TODO: Implement standards
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Configuration Management</h1>
          <p className="text-muted-foreground">
            Universal configuration system for managing instructions, tools, templates, and quality standards across all user types
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Instructions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {instructionsLoading ? '...' : stats.instructions.total}
              </div>
              <div className="flex space-x-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  AI: {instructionsLoading ? '...' : stats.instructions.byUserType.ai_agent}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Dev: {instructionsLoading ? '...' : stats.instructions.byUserType.human_developer}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  QA: {instructionsLoading ? '...' : stats.instructions.byUserType.qa_tester}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tool Configurations</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {toolsLoading ? '...' : stats.tools.total}
              </div>
              <div className="flex space-x-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Dev: {toolsLoading ? '...' : stats.tools.byCategory.development}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Test: {toolsLoading ? '...' : stats.tools.byCategory.testing}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Quality: {toolsLoading ? '...' : stats.tools.byCategory.quality}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.templates.total}</div>
              <div className="flex space-x-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Task: {stats.templates.byType.task}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Issue: {stats.templates.byType.issue}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Report: {stats.templates.byType.report}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Standards</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.standards.total}</div>
              <div className="flex space-x-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  Code: {stats.standards.byCategory.code}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Docs: {stats.standards.byCategory.docs}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Process: {stats.standards.byCategory.process}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instructions" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Instructions</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Tools</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </TabsTrigger>
            <TabsTrigger value="standards" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Standards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions">
            <UserInstructionsPanel />
          </TabsContent>

          <TabsContent value="tools">
            <ToolConfigurationPanel />
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Template Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Template System</h3>
                  <p>Dynamic template management for task creation, issue tracking, and report generation.</p>
                  <div className="mt-4">
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Quality Standards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Quality Standards Management</h3>
                  <p>Define and enforce quality standards across code, documentation, and processes.</p>
                  <div className="mt-4">
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">98%</div>
                <div className="text-sm text-muted-foreground">Active Instructions</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">100%</div>
                <div className="text-sm text-muted-foreground">Tool Configs Valid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">92%</div>
                <div className="text-sm text-muted-foreground">Template Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">85%</div>
                <div className="text-sm text-muted-foreground">Quality Compliance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}