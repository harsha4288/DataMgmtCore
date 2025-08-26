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

interface ValidationReport {
  score: number;
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
  };
  recommendations: string[];
}

const getValidationReport = async (): Promise<ValidationReport | null> => {
  try {
    const response = await fetch('http://localhost:3005/validate/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: 'default' })
    });
    
    if (!response.ok) {
      throw new Error(`Validation API not available (${response.status})`);
    }
    
    return await response.json();
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
            
            {validationReport.recommendations.length > 0 && (
              <div>
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