import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw,
  XCircle,
  AlertTriangle
} from 'lucide-react';

interface DocumentationValidation {
  totalFiles: number;
  errors: number;
  warnings: number;
  healthScore: number;
  details: Array<{
    file: string;
    errors: number;
    warnings: number;
    issues: Array<{
      type: 'error' | 'warning';
      message: string;
      suggestion?: string;
    }>;
  }>;
}

interface ValidationOverviewProps {
  documentationValidation: DocumentationValidation | null;
  loadDocumentationValidation: () => void;
}

export function ValidationOverview({ 
  documentationValidation, 
  loadDocumentationValidation 
}: ValidationOverviewProps) {
  return (
    <div className="space-y-4">
      {/* Documentation Validation Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {documentationValidation?.totalFiles || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {documentationValidation?.errors || 0}
              </div>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {documentationValidation?.warnings || 0}
              </div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documentationValidation?.healthScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Health Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Validation Details */}
      {documentationValidation && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Comprehensive Documentation Validation
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={loadDocumentationValidation}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Validation
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Validation against documentation standards - {documentationValidation.errors} errors, {documentationValidation.warnings} warnings found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Health Score</span>
                  <Badge variant={documentationValidation.healthScore > 80 ? 'default' : 'destructive'}>
                    {documentationValidation.healthScore}%
                  </Badge>
                </div>
                <Progress value={documentationValidation.healthScore} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-96">
            <div className="space-y-3">
              {documentationValidation.details.map((detail, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono text-sm">
                        {detail.file}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {detail.errors > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {detail.errors} errors
                          </Badge>
                        )}
                        {detail.warnings > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {detail.warnings} warnings
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detail.issues.map((issue, issueIndex) => (
                        <Alert key={issueIndex} className={issue.type === 'error' ? 'border-red-200' : 'border-yellow-200'}>
                          {issue.type === 'error' ? (
                            <XCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <AlertDescription>
                            <div className="space-y-1">
                              <p className="text-sm">{issue.message}</p>
                              {issue.suggestion && (
                                <p className="text-xs text-muted-foreground">
                                  💡 <em>{issue.suggestion}</em>
                                </p>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {!documentationValidation && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Loading documentation validation results...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}