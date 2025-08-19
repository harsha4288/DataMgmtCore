import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2,
  XCircle,
  GitBranch,
  Terminal,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface QualityGate {
  name: string;
  status: 'passing' | 'failing' | 'running' | 'pending';
  description: string;
  lastRun?: string;
  details?: string;
}

interface GitInfo {
  branch: string;
  status: 'clean' | 'modified' | 'staged' | 'ahead';
  uncommittedFiles: number;
  stagedFiles: number;
  lastCommit: string;
}

interface ClaudeCommand {
  id: string;
  command: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: string;
  timestamp: string;
}

const WorkflowIntegration: React.FC = () => {
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([
    {
      name: 'ESLint',
      status: 'passing',
      description: 'JavaScript/TypeScript linting',
      lastRun: '2 minutes ago',
      details: '0 errors, 0 warnings'
    },
    {
      name: 'TypeScript',
      status: 'passing',
      description: 'Type checking',
      lastRun: '2 minutes ago',
      details: '0 type errors'
    },
    {
      name: 'Theme Validation',
      status: 'passing',
      description: 'Theme system validation',
      lastRun: '2 minutes ago',
      details: 'All theme variables valid'
    },
    {
      name: 'Build',
      status: 'passing',
      description: 'Production build',
      lastRun: '5 minutes ago',
      details: 'Bundle size: 439KB'
    }
  ]);

  const [gitInfo] = useState<GitInfo>({
    branch: 'Prototype-2-shadcn',
    status: 'modified',
    uncommittedFiles: 3,
    stagedFiles: 0,
    lastCommit: 'Prototype 2: stalte data table demos cleanup'
  });

  const [pendingCommands, setPendingCommands] = useState<ClaudeCommand[]>([
    {
      id: '1',
      command: 'npm run workflow:check',
      status: 'completed',
      result: 'All quality gates passing ✅',
      timestamp: '2 minutes ago'
    },
    {
      id: '2',
      command: 'git status',
      status: 'completed',
      result: 'On branch Prototype-2-shadcn\nYour branch is ahead of \'origin/main\' by 1 commit.',
      timestamp: '1 minute ago'
    }
  ]);

  const [commandInput, setCommandInput] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [testingNotes, setTestingNotes] = useState('');

  const runQualityGates = async () => {
    setQualityGates(gates => gates.map(gate => ({
      ...gate,
      status: 'running' as const
    })));

    // Simulate running quality checks
    setTimeout(() => {
      setQualityGates(gates => gates.map(gate => ({
        ...gate,
        status: 'passing' as const,
        lastRun: 'Just now'
      })));
    }, 3000);
  };

  const executeClaudeCommand = (command: string) => {
    const newCommand: ClaudeCommand = {
      id: Date.now().toString(),
      command,
      status: 'executing',
      timestamp: 'Just now'
    };

    setPendingCommands(prev => [...prev, newCommand]);

    // Simulate command execution
    setTimeout(() => {
      const result = generateCommandResult(command);
      setPendingCommands(prev => prev.map(cmd => 
        cmd.id === newCommand.id 
          ? { ...cmd, status: 'completed', result }
          : cmd
      ));
    }, 2000);
  };

  const generateCommandResult = (command: string): string => {
    if (command.includes('npm run')) return 'Command executed successfully ✅';
    if (command.includes('git')) return 'Git operation completed';
    if (command.includes('test')) return 'All tests passing';
    return 'Command completed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passing':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failing':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
      case 'executing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleApproval = (approved: boolean) => {
    if (approved) {
      executeClaudeCommand('npm run workflow:commit');
    }
    // In real implementation, this would trigger the actual commit workflow
    console.log(approved ? 'Task approved for commit' : 'Task needs revision', {
      comment: approvalComment,
      testingNotes
    });
  };

  const quickCommands = [
    'npm run workflow:check',
    'npm run lint',
    'npm run type-check',
    'git status',
    'git add .',
    'npm run build'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Quality Gates Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quality Gates Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {qualityGates.map((gate) => (
              <div key={gate.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(gate.status)}
                  <div>
                    <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                      {gate.name}
                    </p>
                    <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {gate.details}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={gate.status === 'passing' ? 'default' : 'destructive'}>
                    {gate.status}
                  </Badge>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {gate.lastRun}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={runQualityGates} variant="outline">
              Run All Checks
            </Button>
            <Button onClick={() => executeClaudeCommand('npm run workflow:validate')} variant="outline">
              Validate Workflow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Git Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Git Status & Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Current Branch</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{gitInfo.branch}</Badge>
                  <Badge variant={gitInfo.status === 'clean' ? 'default' : 'secondary'}>
                    {gitInfo.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Files Status</label>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm">Modified: {gitInfo.uncommittedFiles}</span>
                  <span className="text-sm">Staged: {gitInfo.stagedFiles}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Last Commit</label>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {gitInfo.lastCommit}
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => executeClaudeCommand('git status')} 
                variant="outline" 
                size="sm"
              >
                Check Status
              </Button>
              <Button 
                onClick={() => executeClaudeCommand('git add .')} 
                variant="outline" 
                size="sm"
              >
                Stage Changes
              </Button>
              <Button 
                onClick={() => executeClaudeCommand('git diff')} 
                variant="outline" 
                size="sm"
              >
                View Diff
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing & Approval Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Testing & Approval Interface</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Testing Notes</label>
            <Textarea
              value={testingNotes}
              onChange={(e) => setTestingNotes(e.target.value)}
              placeholder="Add your manual testing notes here..."
              className="min-h-20"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Approval Comments</label>
            <Textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Add comments for Claude Code..."
              className="min-h-16"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => handleApproval(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Commit
            </Button>
            <Button 
              onClick={() => handleApproval(false)}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Needs Revision
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Command Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Command Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Enter command for Claude Code to execute..."
              onKeyPress={(e) => e.key === 'Enter' && commandInput && executeClaudeCommand(commandInput)}
            />
            <Button 
              onClick={() => {
                if (commandInput) {
                  executeClaudeCommand(commandInput);
                  setCommandInput('');
                }
              }}
            >
              Execute
            </Button>
          </div>

          {/* Quick Commands */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Commands</label>
            <div className="flex flex-wrap gap-2">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd}
                  variant="outline"
                  size="sm"
                  onClick={() => executeClaudeCommand(cmd)}
                >
                  {cmd}
                </Button>
              ))}
            </div>
          </div>

          {/* Command History */}
          <div>
            <label className="text-sm font-medium mb-2 block">Recent Commands</label>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {pendingCommands.slice().reverse().map((cmd) => (
                  <div key={cmd.id} className="flex items-start gap-3 p-2 border rounded-lg">
                    {getStatusIcon(cmd.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono" style={{ color: 'hsl(var(--foreground))' }}>
                        {cmd.command}
                      </p>
                      {cmd.result && (
                        <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {cmd.result}
                        </p>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {cmd.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowIntegration;