/**
 * Real-time Code Quality Report Panel
 * Displays live quality metrics and detailed reports
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Code,
  FileText,
  Timer,
  Bug,
  Shield,
  Zap,
  RefreshCw,
  Eye
} from 'lucide-react';
import { QualityCheck, MetricsData } from '@/services/dashboard/WorkflowService';

interface QualityReportPanelProps {
  qualityChecks: QualityCheck[];
  metrics: MetricsData;
  onRunCheck: (_type: QualityCheck['type']) => void;
  isConnected: boolean;
}

interface QualityDetail {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  issues: QualityIssue[];
  recommendations: string[];
}

interface QualityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  message: string;
  rule?: string;
  suggestion?: string;
}

const QualityReportPanel: React.FC<QualityReportPanelProps> = ({
  qualityChecks,
  metrics,
  onRunCheck,
  isConnected
}) => {
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [detailView, setDetailView] = useState<'overview' | 'detailed'>('overview');

  // Mock detailed quality data (in real implementation, this would come from actual tools)
  const qualityDetails: QualityDetail[] = [
    {
      category: 'Code Quality',
      score: 92,
      trend: 'up',
      issues: [
        {
          id: '1',
          severity: 'warning',
          file: 'src/components/Table.tsx',
          line: 45,
          message: 'Prefer const assertion',
          rule: '@typescript-eslint/prefer-as-const',
          suggestion: 'Use const assertion instead of type annotation'
        }
      ],
      recommendations: [
        'Consider extracting complex conditions into named functions',
        'Add JSDoc comments for public interfaces'
      ]
    },
    {
      category: 'Performance',
      score: 88,
      trend: 'stable',
      issues: [
        {
          id: '2',
          severity: 'info',
          file: 'src/components/WorkflowDashboard.tsx',
          line: 123,
          message: 'Large component detected',
          suggestion: 'Consider breaking into smaller components'
        }
      ],
      recommendations: [
        'Implement React.memo for expensive components',
        'Consider code splitting for large modules'
      ]
    },
    {
      category: 'Security',
      score: 95,
      trend: 'up',
      issues: [],
      recommendations: [
        'All security checks passed',
        'Continue following secure coding practices'
      ]
    },
    {
      category: 'Maintainability',
      score: 89,
      trend: 'up',
      issues: [
        {
          id: '3',
          severity: 'info',
          file: 'src/services/WorkflowService.ts',
          line: 200,
          message: 'Complex function detected',
          suggestion: 'Consider breaking into smaller functions'
        }
      ],
      recommendations: [
        'Add more unit tests for edge cases',
        'Consider extracting utility functions'
      ]
    }
  ];

  const getStatusIcon = (status: QualityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityIcon = (severity: QualityIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'info':
        return <Activity className="h-3 w-3 text-blue-500" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const latestChecks = qualityChecks.slice(0, 5);
  const overallScore = Math.round(qualityDetails.reduce((sum, detail) => sum + detail.score, 0) / qualityDetails.length);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Code Quality Reports
            </CardTitle>
            <CardDescription>
              Real-time quality metrics and detailed analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailView(detailView === 'overview' ? 'detailed' : 'overview')}
            >
              <Eye className="h-3 w-3 mr-1" />
              {detailView === 'overview' ? 'Detailed' : 'Overview'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="checks">Checks</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {/* Overall Score */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      Overall Quality Score
                    </h3>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Composite score across all quality dimensions
                    </p>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                    {overallScore}%
                  </div>
                </div>
                <Progress value={overallScore} className="h-2" />
              </CardContent>
            </Card>

            {/* Quality Categories */}
            <div className="grid grid-cols-2 gap-4">
              {qualityDetails.map((detail) => (
                <Card key={detail.category}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{detail.category}</span>
                        {getTrendIcon(detail.trend)}
                      </div>
                      <span className={`font-bold ${getScoreColor(detail.score)}`}>
                        {detail.score}%
                      </span>
                    </div>
                    <Progress value={detail.score} className="h-1 mb-2" />
                    <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      <span>{detail.issues.length} issues</span>
                      <span>{detail.recommendations.length} recommendations</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      <span className="text-sm">Component Reusability</span>
                    </div>
                    <span className="font-medium">{metrics.componentReusability}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">Test Coverage</span>
                    </div>
                    <span className="font-medium">{metrics.testCoverage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      <span className="text-sm">Tech Debt</span>
                    </div>
                    <span className="font-medium">{metrics.techDebt}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm">Build Time</span>
                    </div>
                    <span className="font-medium">{metrics.buildTime}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Lines of Code</span>
                    </div>
                    <span className="font-medium">{metrics.linesOfCode.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm">Complexity</span>
                    </div>
                    <span className="font-medium">{metrics.codeComplexity}/10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checks" className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunCheck('lint')}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Run ESLint
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunCheck('type-check')}
                className="flex items-center gap-1"
              >
                <Code className="h-3 w-3" />
                Type Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunCheck('theme')}
                className="flex items-center gap-1"
              >
                <Activity className="h-3 w-3" />
                Theme Check
              </Button>
            </div>

            {/* Recent Checks */}
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {latestChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCheck(check)}
                    style={{ 
                      borderColor: 'hsl(var(--border))',
                      backgroundColor: selectedCheck?.id === check.id ? 'hsl(var(--muted))' : 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium text-sm capitalize">{check.type.replace('-', ' ')}</p>
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(check.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{check.message}</p>
                      {check.fileCount && (
                        <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {check.fileCount} files
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Check Details */}
            {selectedCheck && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(selectedCheck.status)}
                    {selectedCheck.type.charAt(0).toUpperCase() + selectedCheck.type.slice(1)} Check Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={selectedCheck.status === 'pass' ? 'default' : 'destructive'} className="ml-2">
                          {selectedCheck.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Files Checked:</span>
                        <span className="ml-2">{selectedCheck.fileCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Errors:</span>
                        <span className="ml-2 text-red-600">{selectedCheck.errorCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Warnings:</span>
                        <span className="ml-2 text-yellow-600">{selectedCheck.warningCount || 0}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Message:</span>
                      <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {selectedCheck.message}
                      </p>
                    </div>
                    {selectedCheck.details && (
                      <div>
                        <span className="text-sm font-medium">Details:</span>
                        <pre className="text-xs mt-1 p-2 rounded border overflow-auto" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                          {selectedCheck.details}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {qualityDetails.map((detail) => (
                  <div key={detail.category}>
                    {detail.issues.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{detail.category} Issues</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {detail.issues.map((issue) => (
                              <div key={issue.id} className="flex items-start gap-3 p-3 border rounded" style={{ borderColor: 'hsl(var(--border))' }}>
                                {getSeverityIcon(issue.severity)}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{issue.file}:{issue.line}</span>
                                    {issue.rule && (
                                      <Badge variant="outline" className="text-xs">{issue.rule}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm mb-1">{issue.message}</p>
                                  {issue.suggestion && (
                                    <p className="text-xs text-blue-600">💡 {issue.suggestion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {qualityDetails.map((detail) => (
                <Card key={detail.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{detail.category}</span>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(detail.trend)}
                        <span className={`font-bold ${getScoreColor(detail.score)}`}>
                          {detail.score}%
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Recommendations:</h4>
                      <ul className="text-sm space-y-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {detail.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default QualityReportPanel;