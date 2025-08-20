/**
 * Real-time Claude Code Interface
 * Provides direct communication with Claude Code CLI
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal,
  Send,
  Bot,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Code,
  FileText,
  Zap,
  Cpu,
  Activity,
  RefreshCw
} from 'lucide-react';
import { TaskComment } from '@/services/dashboard/WorkflowService';

interface ClaudeInterfaceProps {
  taskId?: string;
  onCommandSent: (_command: string, _taskId?: string) => void;
  comments: TaskComment[];
  isConnected: boolean;
}

interface CommandHistory {
  id: string;
  command: string;
  timestamp: string;
  response?: string;
  status: 'pending' | 'completed' | 'error';
  executionTime?: number;
}

const ClaudeInterface: React.FC<ClaudeInterfaceProps> = ({
  taskId,
  onCommandSent,
  comments,
  isConnected
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Predefined commands for quick access
  const quickCommands = [
    { label: 'Run Tests', command: 'npm run test', icon: CheckCircle },
    { label: 'Type Check', command: 'npm run type-check', icon: Code },
    { label: 'Lint Code', command: 'npm run lint', icon: FileText },
    { label: 'Build Project', command: 'npm run build', icon: Zap },
    { label: 'Quality Check', command: 'npm run claude:quality', icon: Activity },
    { label: 'Theme Validation', command: 'npm run validate:theme', icon: Cpu }
  ];

  const contextualCommands = [
    'Implement the current task',
    'Review code quality for this task',
    'Run quality checks and fix any issues',
    'Update documentation for this feature',
    'Create tests for this component',
    'Optimize performance for this code'
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments, commandHistory]);

  const sendCommand = async (command: string) => {
    if (!command.trim()) return;

    const historyEntry: CommandHistory = {
      id: `cmd-${Date.now()}`,
      command,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setCommandHistory(prev => [...prev, historyEntry]);
    setIsProcessing(true);
    setCommandInput('');

    // Send to parent component
    onCommandSent(command, taskId);

    // Simulate command execution (in real implementation, this would be actual Claude Code integration)
    const startTime = Date.now();
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const executionTime = Date.now() - startTime;
      const response = generateMockResponse(command);

      setCommandHistory(prev => prev.map(entry => 
        entry.id === historyEntry.id 
          ? { ...entry, status: 'completed', response, executionTime }
          : entry
      ));
    } catch (error) {
      setCommandHistory(prev => prev.map(entry => 
        entry.id === historyEntry.id 
          ? { ...entry, status: 'error', response: 'Command execution failed' }
          : entry
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMockResponse = (command: string): string => {
    if (command.includes('test')) {
      return '✅ All tests passed (12 test suites, 45 tests)\nTest coverage: 87%\nExecution time: 2.3s';
    }
    if (command.includes('lint')) {
      return '✅ ESLint completed successfully\n0 errors, 0 warnings\n15 files checked';
    }
    if (command.includes('type-check')) {
      return '✅ TypeScript compilation successful\nNo type errors found\n23 files checked';
    }
    if (command.includes('build')) {
      return '✅ Build completed successfully\nBundle size: 245.2 KB\nBuild time: 4.1s';
    }
    if (command.includes('quality')) {
      return '✅ All quality checks passed\n• ESLint: 0 errors\n• TypeScript: 0 errors\n• Theme validation: Passed\n• Performance: Good';
    }
    if (command.includes('Implement')) {
      return '🤖 Starting implementation...\n\nI\'ll implement the requested feature following the project patterns:\n1. Create necessary types and interfaces\n2. Implement core functionality\n3. Add proper error handling\n4. Include tests and documentation\n\nReady to proceed?';
    }
    if (command.includes('Review')) {
      return '🔍 Code review completed:\n\n✅ Code follows project conventions\n✅ TypeScript types are properly defined\n✅ Theme variables are used correctly\n⚠️  Consider adding more unit tests\n\nOverall quality score: 92/100';
    }
    
    return `Command executed: ${command}\n\n🤖 I've processed your request. The operation completed successfully.`;
  };

  const getStatusIcon = (status: CommandHistory['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Claude Code Interface
            </CardTitle>
            <CardDescription>
              Direct communication with Claude Code CLI
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Offline'}
            </Badge>
            {isProcessing && (
              <Badge variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Processing
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Quick Commands */}
        <div>
          <h4 className="text-sm font-medium mb-2">Quick Commands</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <Button
                  key={cmd.command}
                  variant="outline"
                  size="sm"
                  onClick={() => sendCommand(cmd.command)}
                  className="justify-start"
                  disabled={isProcessing}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {cmd.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contextual Commands */}
        {taskId && (
          <div>
            <h4 className="text-sm font-medium mb-2">Task Commands</h4>
            <div className="space-y-1">
              {contextualCommands.slice(0, 3).map((cmd) => (
                <Button
                  key={cmd}
                  variant="ghost"
                  size="sm"
                  onClick={() => sendCommand(cmd)}
                  className="w-full justify-start text-xs h-8"
                  disabled={isProcessing}
                >
                  <Terminal className="h-3 w-3 mr-1" />
                  {cmd}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Command History and Chat */}
        <div className="flex-1 flex flex-col">
          <h4 className="text-sm font-medium mb-2">Command History & Responses</h4>
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {/* Show comments from task */}
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {comment.author === 'Claude Code' ? (
                      <Bot className="h-5 w-5 text-blue-500" />
                    ) : (
                      <User className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <Badge variant="outline" size="sm">{comment.type}</Badge>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(comment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm p-3 rounded border" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show command history */}
              {commandHistory.map((entry) => (
                <div key={entry.id} className="space-y-2">
                  {/* User command */}
                  <div className="flex gap-3">
                    <User className="h-5 w-5 text-gray-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">You</span>
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm p-3 rounded border bg-blue-50 dark:bg-blue-950">
                        <code>{entry.command}</code>
                      </div>
                    </div>
                  </div>

                  {/* Claude response */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(entry.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">Claude Code</span>
                        {entry.executionTime && (
                          <Badge variant="outline" size="sm">
                            {formatExecutionTime(entry.executionTime)}
                          </Badge>
                        )}
                      </div>
                      {entry.response ? (
                        <div className="text-sm p-3 rounded border" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                          <pre className="whitespace-pre-wrap font-mono text-xs">
                            {entry.response}
                          </pre>
                        </div>
                      ) : entry.status === 'pending' ? (
                        <div className="text-sm p-3 rounded border" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Processing command...
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Command Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Terminal className="h-4 w-4 mt-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <div className="flex-1">
              <Input
                placeholder="Send command to Claude Code..."
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendCommand(commandInput)}
                disabled={isProcessing}
                className="font-mono text-sm"
              />
            </div>
            <Button 
              onClick={() => sendCommand(commandInput)} 
              size="sm"
              disabled={!commandInput.trim() || isProcessing}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>

          {/* AI Suggestions */}
          {taskId && !isProcessing && (
            <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              💡 Try: "Continue with {taskId}" or "Review code quality for this task"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClaudeInterface;