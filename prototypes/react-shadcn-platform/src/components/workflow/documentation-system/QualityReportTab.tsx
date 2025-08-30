import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface QualityReport {
  overall: {
    score: number;
    status: 'passed' | 'failed' | 'warning';
  };
  checks: Array<{
    id: string;
    name: string;
    status: 'passed' | 'failed' | 'warning';
    score: number;
    summary: string;
    issues?: any;
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium';
    check: string;
    message: string;
    action: string;
  }>;
  timestamp: string;
}

interface QualityReportTabProps {
  qualityReport: QualityReport | null;
  runQualityPipeline: () => void;
  isRefreshing: boolean;
}

export function QualityReportTab({ 
  qualityReport, 
  runQualityPipeline, 
  isRefreshing 
}: QualityReportTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          onClick={runQualityPipeline}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Run Quality Pipeline
        </Button>
      </div>

      {qualityReport && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quality Overview
                <Badge 
                  variant={qualityReport.overall.status === 'passed' ? 'default' : 'destructive'}
                >
                  {qualityReport.overall.score}/100
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={qualityReport.overall.score} className="mb-4" />
              <div className="text-sm text-muted-foreground">
                Last run: {new Date(qualityReport.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {qualityReport.checks.map((check) => (
              <Card key={check.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {check.status === 'passed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{check.name}</span>
                    </div>
                    <Badge variant={check.status === 'passed' ? 'outline' : 'destructive'}>
                      {check.score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {check.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {qualityReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {qualityReport.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{rec.check}:</strong> {rec.message}
                        <br />
                        <em>Action: {rec.action}</em>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!qualityReport && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No quality report available. Run the quality pipeline to generate a report.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}