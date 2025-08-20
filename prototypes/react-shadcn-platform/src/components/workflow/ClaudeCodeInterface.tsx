import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Terminal,
  Send,
  Bot,
  User,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  GitCommit,
  Play,
  Code,
  FileJson,
  AlignLeft
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'claude' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    taskId?: string;
    command?: string;
    status?: 'pending' | 'executing' | 'completed' | 'failed';
  };
}

interface ClaudeSession {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'executing';
  messages: Message[];
  lastActivity: string;
}

const ClaudeCodeInterface: React.FC = () => {
  const [outputFormat, setOutputFormat] = useState<'raw' | 'formatted' | 'code'>('formatted');
  const [sessions, setSessions] = useState<ClaudeSession[]>([
    {
      id: '1',
      name: 'Main Development Session',
      status: 'active',
      lastActivity: new Date().toISOString(),
      messages: [
        {
          id: '1',
          type: 'system',
          content: 'Claude Code initialized. Ready for task execution.',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          type: 'user',
          content: 'Please proceed with Task 1.4 - Entity System Integration',
          timestamp: new Date().toISOString(),
          metadata: {
            taskId: '1.4',
            command: 'start-task'
          }
        },
        {
          id: '3',
          type: 'claude',
          content: 'I\'ll help you implement the Entity System Integration. Let me start by analyzing the current codebase and the entity system from Prototype 1.',
          timestamp: new Date().toISOString(),
          metadata: {
            taskId: '1.4',
            status: 'executing'
          }
        }
      ]
    }
  ]);

  const [activeSession, setActiveSession] = useState(sessions[0]);
  const [inputMessage, setInputMessage] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession.messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isExecuting) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    // Update active session with user message
    const updatedSession = {
      ...activeSession,
      messages: [...activeSession.messages, userMessage],
      status: 'executing' as const
    };

    setActiveSession(updatedSession);
    setSessions(sessions.map(s => s.id === activeSession.id ? updatedSession : s));
    setInputMessage('');
    setIsExecuting(true);

    // Simulate Claude response (in real implementation, this would call Claude Code API)
    setTimeout(() => {
      const claudeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'claude',
        content: generateClaudeResponse(inputMessage),
        timestamp: new Date().toISOString(),
        metadata: {
          status: 'completed'
        }
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, claudeMessage],
        status: 'active' as const,
        lastActivity: new Date().toISOString()
      };

      setActiveSession(finalSession);
      setSessions(sessions.map(s => s.id === activeSession.id ? finalSession : s));
      setIsExecuting(false);
    }, 2000);
  };

  const generateClaudeResponse = (_userInput: string): string => {
    // This would be replaced with actual Claude Code integration
    const responses = [
      'I\'ve analyzed your request. Let me implement the required changes.',
      'I\'ll start by reading the existing code structure and then proceed with the implementation.',
      'Task understood. I\'ll use the TodoWrite tool to break this down into manageable steps.',
      'I\'ll run the quality checks first and then implement the requested feature.',
      'Let me check the current git status and proceed with the implementation.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleQuickCommand = (command: string) => {
    setInputMessage(command);
  };

  const getMessageIcon = (type: string, _metadata?: Message['metadata']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'claude':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <Terminal className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'executing':
        return <Clock className="h-3 w-3 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const quickCommands = [
    'Run quality checks',
    'Update PROGRESS.md',
    'Create commit',
    'Run tests',
    'Check git status',
    'Start next task',
    'Generate documentation',
    'Review code changes'
  ];

  const formatClaudeOutput = (content: string, format: string) => {
    if (format === 'raw') return content;
    
    if (format === 'code') {
      // Check if content contains code blocks
      const codePattern = /```[\s\S]*?```/g;
      if (codePattern.test(content)) {
        return (
          <div className="space-y-2">
            {content.split(codePattern).map((text, idx) => {
              const codeMatch = content.match(codePattern)?.[idx];
              return (
                <div key={idx}>
                  {text && <p className="text-sm">{text}</p>}
                  {codeMatch && (
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                      <code className="text-xs">{codeMatch.replace(/```\w*\n?|```/g, '')}</code>
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
    }
    
    // Formatted view with better structure
    if (format === 'formatted') {
      return (
        <div className="space-y-2">
          {content.split('\n').map((line, idx) => {
            if (line.startsWith('- ')) {
              return <li key={idx} className="ml-4 text-sm">{line.substring(2)}</li>;
            } else if (line.startsWith('# ')) {
              return <h3 key={idx} className="font-bold text-sm mt-2">{line.substring(2)}</h3>;
            } else if (line.trim()) {
              return <p key={idx} className="text-sm">{line}</p>;
            }
            return null;
          })}
        </div>
      );
    }
    
    return content;
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <div className="border-b p-4" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Claude Code Interface
              </h2>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                AI Development Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded px-2 py-1">
              <Button
                variant={outputFormat === 'formatted' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2"
                onClick={() => setOutputFormat('formatted')}
              >
                <AlignLeft className="h-3 w-3" />
              </Button>
              <Button
                variant={outputFormat === 'code' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2"
                onClick={() => setOutputFormat('code')}
              >
                <Code className="h-3 w-3" />
              </Button>
              <Button
                variant={outputFormat === 'raw' ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-2"
                onClick={() => setOutputFormat('raw')}
              >
                <FileJson className="h-3 w-3" />
              </Button>
            </div>
            <Badge variant={activeSession.status === 'executing' ? 'default' : 'secondary'}>
              {activeSession.status}
            </Badge>
            {isExecuting && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm">Executing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {activeSession.messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.type, message.metadata)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize" style={{ color: 'hsl(var(--foreground))' }}>
                        {message.type === 'claude' ? 'Claude Code' : message.type}
                      </span>
                      <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.metadata?.status && getStatusIcon(message.metadata.status)}
                    </div>
                    <div 
                      className="text-sm p-3 rounded-lg max-w-3xl"
                      style={{ 
                        backgroundColor: message.type === 'user' ? 'hsl(var(--muted))' : 'transparent',
                        color: 'hsl(var(--foreground))',
                        border: message.type !== 'user' ? '1px solid hsl(var(--border))' : 'none'
                      }}
                    >
                      {message.type === 'claude' 
                        ? formatClaudeOutput(message.content, outputFormat)
                        : message.content}
                    </div>
                    {message.metadata?.taskId && (
                      <Badge variant="outline" className="mt-2" size="sm">
                        Task {message.metadata.taskId}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {isExecuting && (
                <div className="flex gap-3">
                  <Bot className="h-4 w-4 mt-1" />
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      Claude Code is thinking...
                    </div>
                    <Clock className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex gap-2 mb-3">
              <div className="flex flex-wrap gap-1">
                {quickCommands.slice(0, 4).map((command) => (
                  <Button
                    key={command}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCommand(command)}
                    disabled={isExecuting}
                  >
                    {command}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Terminal className="absolute left-3 top-3 h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Send command or instruction to Claude Code..."
                  className="pl-10"
                  disabled={isExecuting}
                />
              </div>
              <Button onClick={sendMessage} disabled={!inputMessage.trim() || isExecuting}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 border-l" style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickCommands.slice(4).map((command) => (
                <Button
                  key={command}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleQuickCommand(command)}
                  disabled={isExecuting}
                >
                  {command}
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-3">Session Status</h3>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Messages</span>
                  <span>{activeSession.messages.length}</span>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Status</span>
                  <Badge variant="outline" size="sm">
                    {activeSession.status}
                  </Badge>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Last Activity</span>
                  <span className="text-xs">
                    {new Date(activeSession.lastActivity).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-3">Development Tools</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View PROGRESS.md
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <GitCommit className="h-4 w-4 mr-2" />
                Git Status
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Run Quality Gates
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaudeCodeInterface;