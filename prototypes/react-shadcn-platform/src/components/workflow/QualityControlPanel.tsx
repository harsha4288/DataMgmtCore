/**
 * Quality Control Panel - integrates with scripts/quality-pipeline.cjs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Code,
  Activity
} from 'lucide-react';

interface QualityCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details?: string;
}

interface QualityReport {
  timestamp: string;
  score: number;
  checks: QualityCheck[];
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  }
};

export const QualityControlPanel: React.FC = () => {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runQualityPipeline = async () => {
    setLoading(true);
    
    // Show TBD implementation - needs integration with actual scripts
    setReport({
      timestamp: new Date().toISOString(),
      score: 0,
      checks: [
        {
          id: 'eslint',
          name: 'ESLint Code Quality',
          status: 'fail',
          details: 'Run `node scripts/quality-pipeline.cjs` to get real results'
        },
        {
          id: 'typescript',
          name: 'TypeScript Validation',
          status: 'fail',
          details: 'Run `npm run type-check` to get real results'
        },
        {
          id: 'theme',
          name: 'Theme Compliance',
          status: 'fail',
          details: 'Run `node validate-theme-usage.js` to get real results'
        }
      ]
    });
    setLastRun(new Date().toLocaleString());
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Quality Control Pipeline
          </div>
          <Button 
            onClick={runQualityPipeline} 
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Run Checks
          </Button>
        </CardTitle>
        <CardDescription>
          Real quality checks from scripts/quality-pipeline.cjs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!report ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No quality report available. Click "Run Checks" to execute quality pipeline.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold">TBD</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
              {lastRun && (
                <div className="text-sm text-muted-foreground">
                  Last run: {lastRun}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {report.checks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={check.status} />
                    <div>
                      <div className="font-medium">{check.name}</div>
                      {check.details && (
                        <div className="text-sm text-muted-foreground">{check.details}</div>
                      )}
                    </div>
                  </div>
                  <Badge variant={check.status === 'pass' ? 'default' : 'destructive'}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>TBD Feature:</strong> Integration with scripts/quality-pipeline.cjs pending. 
                Run the script manually to get real quality metrics.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};