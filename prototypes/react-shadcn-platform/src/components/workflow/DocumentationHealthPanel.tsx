/**
 * Documentation Health Panel - connects to Validation API (port 3005)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Database
} from 'lucide-react';

interface ValidationResult {
  ruleId: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  field: string;
  suggestion: string;
  autoFixable: boolean;
}

interface EntityReport {
  entityId: string;
  entityType: string;
  score: number;
  results: ValidationResult[];
  recommendations: string[];
}

interface ValidationReport {
  score: number;
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
    total?: number;
    totalErrors?: number;
    totalWarnings?: number;
    totalIssues?: number;
  };
  recommendations: string[];
  reports?: EntityReport[];
}

const getValidationReport = async (): Promise<ValidationReport | null> => {
  try {
    const response = await fetch('http://localhost:3005/validate-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectPath: '.',
        config: 'default' 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Validation API not available (${response.status})`);
    }
    
    const data = await response.json();
    
    // Transform the project validation response to match our interface
    const allRecommendations = data.reports?.flatMap((report: any) => report.recommendations) || [];
    
    // CALCULATE REAL ERROR COUNTS - don't trust API's totalErrors claim
    let realErrors = 0;
    let realWarnings = 0;
    
    if (data.reports) {
      data.reports.forEach((report: any) => {
        if (report.results) {
          report.results.forEach((result: any) => {
            if (result.severity === 'error') {
              realErrors++;
            } else if (result.severity === 'warning') {
              realWarnings++;
            }
          });
        }
      });
    }
    
    return {
      score: data.summary?.avgScore || 100,
      summary: {
        errors: realErrors, // Use calculated count, not API's lie
        warnings: realWarnings, // Use calculated count
        suggestions: 0, // Not provided in project response
        total: data.summary?.total || 0,
        totalErrors: realErrors, // Use calculated count
        totalWarnings: realWarnings, // Use calculated count
        totalIssues: realErrors + realWarnings // Real total
      },
      recommendations: [...new Set(allRecommendations)], // Remove duplicates
      reports: data.reports || []
    };
  } catch (error) {
    console.error('Validation API failed:', error);
    return null;
  }
};

export const DocumentationHealthPanel: React.FC = () => {
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  const checkDocumentationHealth = async () => {
    setLoading(true);
    setApiStatus('checking');
    
    const report = await getValidationReport();
    
    if (report) {
      setValidationReport(report);
      setApiStatus('online');
    } else {
      setApiStatus('offline');
      setValidationReport(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    checkDocumentationHealth();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentation Quality
            {apiStatus === 'online' && (
              <Badge variant="outline" className="ml-2">
                <Database className="h-3 w-3 mr-1" />
                API Connected
              </Badge>
            )}
          </div>
          <Button 
            onClick={checkDocumentationHealth} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Health
          </Button>
        </CardTitle>
        <CardDescription>
          Real validation from Validation API (port 3005)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiStatus === 'offline' ? (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Validation API (port 3005) is offline. Start it with: <code>npm run validation:server</code>
            </AlertDescription>
          </Alert>
        ) : apiStatus === 'checking' ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Connecting to validation API...
          </div>
        ) : validationReport ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">{validationReport.score}/100</div>
                <div className="text-sm text-muted-foreground">Quality Score</div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-red-500">{validationReport.summary.errors} errors</div>
                <div className="text-orange-500">{validationReport.summary.warnings} warnings</div>
                <div className="text-blue-500">{validationReport.summary.suggestions} suggestions</div>
              </div>
            </div>
            
            {/* Detailed Validation Results */}
            {validationReport.reports && validationReport.reports.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Detailed Validation Results</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {validationReport.reports
                    .filter(report => report.results.length > 0)
                    .map((report) => (
                    <div key={report.entityId} className="border rounded p-3 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{report.entityId}</h5>
                        <Badge variant={report.score >= 90 ? "default" : report.score >= 70 ? "secondary" : "destructive"}>
                          {report.score}/100
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {report.results.map((result, idx) => (
                          <div key={idx} className="text-sm">
                            <div className={`flex items-start gap-2 ${
                              result.severity === 'error' ? 'text-red-600' :
                              result.severity === 'warning' ? 'text-orange-600' :
                              result.severity === 'info' ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              <span className="font-mono text-xs mt-0.5">
                                {result.severity === 'error' ? '❌' :
                                 result.severity === 'warning' ? '⚠️' :
                                 result.severity === 'info' ? 'ℹ️' : '💡'}
                              </span>
                              <div className="flex-1">
                                <div className="font-medium">{result.message}</div>
                                {result.suggestion && (
                                  <div className="text-muted-foreground mt-1">
                                    💡 {result.suggestion}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Rule: {result.ruleId} | Field: {result.field}
                                  {result.autoFixable && <span className="ml-2 text-green-600">Auto-fixable</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {validationReport.reports.filter(r => r.results.length > 0).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    🎉 No validation issues found! All entities pass validation.
                  </div>
                )}
              </div>
            )}
            
            {validationReport.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <div className="space-y-1">
                  {validationReport.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      💡 {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No validation data available from API.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};