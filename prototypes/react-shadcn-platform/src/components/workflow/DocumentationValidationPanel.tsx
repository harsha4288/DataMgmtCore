/**
 * Documentation Validation Panel Component
 * Integrates with validate-documentation.js script to display validation results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Play,
  AlertCircle,
  Link,
  Users,
  TrendingUp,
  FileX,
  FileCheck
} from 'lucide-react';

interface ValidationError {
  id: string;
  type: 'SIZE_VIOLATION' | 'TEMPLATE_VIOLATION' | 'STATUS_MISMATCH' | 'BROKEN_LINK' | 
        'REDUNDANCY_DETECTED' | 'LINK_PLACEMENT_VIOLATION' | 'INVALID_STATUS' | 
        'SINGLE_ACTIVE_RULE_VIOLATION' | 'PROGRESS_MATH_ERROR' | 'HIERARCHY_VIOLATION' | 'AI_VIOLATION' | 'STANDARDS_VIOLATION';
  severity: 'error' | 'warning';
  file: string;
  message: string;
  suggestion?: string;
  lineNumber?: number;
}

interface ValidationWarning {
  id: string;
  type: 'SYNC_WARNING' | 'MISSING_PROGRESS' | 'MISSING_CONTENT' | 'LINK_WARNING' | 'AI_RESTRICTION_WARNING' | 'NO_ACTIVE_WORK';
  message: string;
  file?: string;
  recommendation?: string;
}

interface ValidationResults {
  isRunning: boolean;
  lastRun: Date | null;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalFiles: number;
    filesWithErrors: number;
    filesWithWarnings: number;
    coverage: string[];
  };
  fixes?: string[];
}

interface DocumentationValidationPanelProps {
  onRunValidation?: () => Promise<void>;
  isConnected?: boolean;
}

const DocumentationValidationPanel: React.FC<DocumentationValidationPanelProps> = ({
  onRunValidation,
  isConnected = true
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResults>({
    isRunning: false,
    lastRun: null,
    errors: [],
    warnings: [],
    summary: {
      totalFiles: 0,
      filesWithErrors: 0,
      filesWithWarnings: 0,
      coverage: []
    }
  });

  const [selectedErrorType, setSelectedErrorType] = useState<string>('all');
  const [showFixSuggestions, setShowFixSuggestions] = useState(false);

  // Remove mock data useEffect and replace with real fetch
  useEffect(() => {
    const fetchValidationResults = async () => {
      setValidationResults(prev => ({ ...prev, isRunning: true }));
      try {
        const response = await fetch('http://localhost:3002/api/validation-results');
        if (response.ok) {
          const data = await response.json();
          setValidationResults({
            ...data,
            isRunning: false,
            lastRun: new Date(),
          });
        } else {
          // fallback to empty or mock data if needed
          setValidationResults(prev => ({ ...prev, isRunning: false }));
        }
      } catch (error) {
        // fallback to empty or mock data if needed
        setValidationResults(prev => ({ ...prev, isRunning: false }));
      }
    };
    fetchValidationResults();
  }, []);

  const runValidation = async () => {
    setValidationResults(prev => ({ ...prev, isRunning: true }));
    try {
      if (onRunValidation) {
        await onRunValidation();
      } else {
        // Call the same fetch as above to refresh results
        const response = await fetch('http://localhost:3002/api/validation-results');
        if (response.ok) {
          const data = await response.json();
          setValidationResults({
            ...data,
            isRunning: false,
            lastRun: new Date(),
          });
        } else {
          setValidationResults(prev => ({ ...prev, isRunning: false }));
        }
      }
    } catch (error) {
      setValidationResults(prev => ({ ...prev, isRunning: false }));
    }
  };

  // Add support for STANDARDS_VIOLATION error type
  const getErrorTypeIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'TEMPLATE_VIOLATION':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'BROKEN_LINK':
        return <Link className="h-4 w-4 text-red-500" />;
      case 'SIZE_VIOLATION':
        return <FileX className="h-4 w-4 text-orange-500" />;
      case 'STATUS_MISMATCH':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'LINK_PLACEMENT_VIOLATION':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'SINGLE_ACTIVE_RULE_VIOLATION':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'AI_VIOLATION':
        return <AlertCircle className="h-4 w-4 text-red-700" />;
      case 'STANDARDS_VIOLATION':
        return <AlertTriangle className="h-4 w-4 text-pink-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getErrorTypeLabel = (type: ValidationError['type']) => {
    switch (type) {
      case 'TEMPLATE_VIOLATION':
        return 'Template Compliance';
      case 'BROKEN_LINK':
        return 'Link Integrity';
      case 'SIZE_VIOLATION':
        return 'Size Limits';
      case 'STATUS_MISMATCH':
        return 'Status Consistency';
      case 'LINK_PLACEMENT_VIOLATION':
        return 'Link Placement';
      case 'SINGLE_ACTIVE_RULE_VIOLATION':
        return 'Single Active Rule';
      case 'AI_VIOLATION':
        return 'AI Restrictions';
      case 'STANDARDS_VIOLATION':
        return 'Standards Violation';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const filteredErrors = selectedErrorType === 'all' 
    ? validationResults.errors 
    : validationResults.errors.filter(error => error.type === selectedErrorType);

  const errorTypeCount = validationResults.errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Documentation Validation
              </CardTitle>
              <CardDescription>
                Comprehensive validation against documentation standards
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={validationResults.errors.length === 0 ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {validationResults.errors.length === 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    All Passed
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    {validationResults.errors.length} Error{validationResults.errors.length !== 1 ? 's' : ''}
                  </>
                )}
              </Badge>
              {validationResults.warnings.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationResults.warnings.length} Warning{validationResults.warnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {!isConnected ? (
                <>API Offline - Manual validation required</>
              ) : validationResults.lastRun ? (
                <>Last run: {validationResults.lastRun.toLocaleString()}</>
              ) : (
                'Never run - Click "Run Validation" to start'
              )}
            </div>
            <Button 
              onClick={runValidation} 
              disabled={validationResults.isRunning || !isConnected}
              size="sm"
            >
              {validationResults.isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {validationResults.isRunning ? 'Running...' : 'Run Validation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{validationResults.summary.totalFiles}</div>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Total Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{validationResults.errors.length}</div>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Errors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{validationResults.warnings.length}</div>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(((validationResults.summary.totalFiles - validationResults.summary.filesWithErrors) / validationResults.summary.totalFiles) * 100)}%
              </div>
              <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>Health Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="errors">
            Errors ({validationResults.errors.length})
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings ({validationResults.warnings.length})
          </TabsTrigger>
          <TabsTrigger value="coverage">
            Coverage
          </TabsTrigger>
          <TabsTrigger value="fixes">
            Fixes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          {/* Error Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedErrorType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedErrorType('all')}
            >
              All ({validationResults.errors.length})
            </Button>
            {Object.entries(errorTypeCount).map(([type, count]) => (
              <Button
                key={type}
                variant={selectedErrorType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedErrorType(type)}
                className="flex items-center gap-1"
              >
                {getErrorTypeIcon(type as ValidationError['type'])}
                {getErrorTypeLabel(type as ValidationError['type'])} ({count})
              </Button>
            ))}
          </div>

          {/* Errors List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredErrors.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {selectedErrorType === 'all' 
                      ? 'No errors found! All documentation validation checks passed.'
                      : `No ${getErrorTypeLabel(selectedErrorType as ValidationError['type']).toLowerCase()} errors found.`
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                filteredErrors.map((error) => (
                  <Card key={error.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {getErrorTypeIcon(error.type)}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">
                              {getErrorTypeLabel(error.type)}
                            </Badge>
                            <code className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              {error.file}
                            </code>
                          </div>
                          <div className="text-sm font-medium whitespace-pre-line">{error.message}</div>
                          {error.suggestion && (
                            <div className="p-2 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-sm">
                                <strong>💡 Suggestion:</strong> {error.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {validationResults.warnings.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No warnings found! Documentation is in good health.
                  </AlertDescription>
                </Alert>
              ) : (
                validationResults.warnings.map((warning) => (
                  <Card key={warning.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {warning.type.replace(/_/g, ' ')}
                            </Badge>
                            {warning.file && (
                              <code className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                {warning.file}
                              </code>
                            )}
                          </div>
                          <p className="text-sm font-medium">{warning.message}</p>
                          {warning.recommendation && (
                            <div className="p-2 rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                              <p className="text-sm">
                                <strong>💡 Recommendation:</strong> {warning.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validation Coverage</CardTitle>
              <CardDescription>
                8 Core Rules + AI Restrictions Detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationResults.summary.coverage.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">✅ {index + 1}. {rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fixes" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant={showFixSuggestions ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFixSuggestions(!showFixSuggestions)}
            >
              {showFixSuggestions ? 'Hide' : 'Show'} Auto-Fix Suggestions
            </Button>
          </div>
          
          {showFixSuggestions && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Auto-fixes are suggestions only. Review carefully before applying.
                AI should never auto-update status without human approval.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fix Commands</CardTitle>
              <CardDescription>
                Commands to resolve validation issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Run validation with fixes:</p>
                <code className="block p-2 text-xs rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  node validate-documentation.js --fix --verbose
                </code>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Check documentation health:</p>
                <code className="block p-2 text-xs rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  npm run health:docs
                </code>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Integrate with quality checks:</p>
                <code className="block p-2 text-xs rounded" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  npm run check:all
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentationValidationPanel;