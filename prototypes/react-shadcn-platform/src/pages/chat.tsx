import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  ArrowLeft,
  Users,
  Settings,
  Circle,
  Check,
  CheckCheck,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ChatUser {
  id: string
  name: string
  avatar?: string
  lastSeen: string
  isOnline: boolean
  role: 'member' | 'moderator' | 'admin'
  domain: string
  isTyping?: boolean
}

interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  status: 'sending' | 'sent' | 'delivered' | 'read'
  type: 'text' | 'image' | 'file'
}

interface ChatConversation {
  id: string
  participants: ChatUser[]
  lastMessage?: Message
  unreadCount: number
  isGroup: boolean
  name?: string
  description?: string
  createdAt: string
  lastActivity: string
}

const mockUsers: ChatUser[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    avatar: '/avatars/sarah.jpg',
    lastSeen: 'online',
    isOnline: true,
    role: 'member',
    domain: 'Healthcare',
    isTyping: false
  },
  {
    id: '2',
    name: 'Prof. Michael Kumar',
    avatar: '/avatars/michael.jpg',
    lastSeen: '5 minutes ago',
    isOnline: false,
    role: 'moderator',
    domain: 'Engineering',
    isTyping: false
  },
  {
    id: '3',
    name: 'Priya Sharma',
    avatar: '/avatars/priya.jpg',
    lastSeen: 'online',
    isOnline: true,
    role: 'member',
    domain: 'Arts & Design',
    isTyping: true
  },
  {
    id: '4',
    name: 'Admin Team',
    avatar: '/avatars/admin.jpg',
    lastSeen: '2 hours ago',
    isOnline: false,
    role: 'admin',
    domain: 'Administration',
    isTyping: false
  }
]

const mockConversations: ChatConversation[] = [
  {
    id: 'conv-1',
    participants: [mockUsers[0]],
    lastMessage: {
      id: 'msg-1',
      senderId: '1',
      content: 'Thanks for offering to help with the medical consultation setup!',
      timestamp: '2024-12-20T14:30:00Z',
      status: 'read',
      type: 'text'
    },
    unreadCount: 0,
    isGroup: false,
    lastActivity: '2024-12-20T14:30:00Z',
    createdAt: '2024-12-19T10:00:00Z'
  },
  {
    id: 'conv-2',
    participants: [mockUsers[1]],
    lastMessage: {
      id: 'msg-2',
      senderId: '2',
      content: 'The engineering workshop is scheduled for next week. Are you still interested?',
      timestamp: '2024-12-20T13:45:00Z',
      status: 'delivered',
      type: 'text'
    },
    unreadCount: 2,
    isGroup: false,
    lastActivity: '2024-12-20T13:45:00Z',
    createdAt: '2024-12-18T15:20:00Z'
  },
  {
    id: 'conv-3',
    participants: [mockUsers[2]],
    lastMessage: {
      id: 'msg-3',
      senderId: 'current-user',
      content: 'Perfect! I\'ll send you the portfolio examples tomorrow.',
      timestamp: '2024-12-20T12:15:00Z',
      status: 'read',
      type: 'text'
    },
    unreadCount: 1,
    isGroup: false,
    lastActivity: '2024-12-20T12:15:00Z',
    createdAt: '2024-12-20T08:30:00Z'
  },
  {
    id: 'conv-4',
    participants: [mockUsers[1], mockUsers[2], mockUsers[0]],
    name: 'Healthcare Innovation Group',
    description: 'Discussing medical technology improvements',
    lastMessage: {
      id: 'msg-4',
      senderId: '1',
      content: 'Let\'s schedule a meeting to discuss the telehealth initiative.',
      timestamp: '2024-12-20T11:20:00Z',
      status: 'read',
      type: 'text'
    },
    unreadCount: 3,
    isGroup: true,
    lastActivity: '2024-12-20T11:20:00Z',
    createdAt: '2024-12-15T09:00:00Z'
  }
]

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: '1',
    content: 'Hi! I saw your posting about needing help with medical consultation setup. I have 15 years of experience in telemedicine.',
    timestamp: '2024-12-20T14:25:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    content: 'That\'s exactly what we need! Could you help us understand the compliance requirements?',
    timestamp: '2024-12-20T14:27:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: 'msg-3',
    senderId: '1',
    content: 'Absolutely. There are several key areas we need to cover: HIPAA compliance, patient data security, and proper consultation protocols.',
    timestamp: '2024-12-20T14:28:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: 'msg-4',
    senderId: 'current-user',
    content: 'Perfect! When would be a good time to discuss this in detail?',
    timestamp: '2024-12-20T14:29:00Z',
    status: 'read',
    type: 'text'
  },
  {
    id: 'msg-5',
    senderId: '1',
    content: 'Thanks for offering to help with the medical consultation setup!',
    timestamp: '2024-12-20T14:30:00Z',
    status: 'read',
    type: 'text'
  }
]

export default function ChatPage() {
  const navigate = useNavigate()
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(mockConversations[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [activeTab, setActiveTab] = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (conv.name && conv.name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'unread') return matchesSearch && conv.unreadCount > 0
    if (activeTab === 'groups') return matchesSearch && conv.isGroup
    if (activeTab === 'direct') return matchesSearch && !conv.isGroup
    
    return matchesSearch
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatLastSeen = (lastSeen: string, isOnline: boolean) => {
    if (isOnline) return 'Online'
    if (lastSeen === 'online') return 'Online'
    return `Last seen ${lastSeen}`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500'
      case 'moderator': return 'bg-blue-500'
      default: return 'bg-green-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="h-3 w-3 text-muted-foreground" />
      case 'sent': return <Check className="h-3 w-3 text-muted-foreground" />
      case 'delivered': return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case 'read': return <CheckCheck className="h-3 w-3 text-blue-500" />
      default: return null
    }
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
      status: 'sending',
      type: 'text'
    }

    setMessages(prev => [...prev, newMessage])
    setMessageInput('')

    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      )
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getConversationName = (conversation: ChatConversation) => {
    if (conversation.isGroup) {
      return conversation.name || `Group (${conversation.participants.length})`
    }
    return conversation.participants[0]?.name || 'Unknown User'
  }

  const getConversationAvatar = (conversation: ChatConversation) => {
    if (conversation.isGroup) {
      return '/avatars/group.jpg'
    }
    return conversation.participants[0]?.avatar || '/avatars/default.jpg'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/member-dashboard')}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Messages</h1>
              <Badge variant="secondary" className="hidden md:inline-flex">
                {mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)} unread
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations Sidebar */}
          <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Conversations</h2>
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filter Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
                    <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
                    <TabsTrigger value="direct" className="text-xs">Direct</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="space-y-1 p-3">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getConversationAvatar(conversation)} />
                            <AvatarFallback>
                              {conversation.isGroup ? (
                                <Users className="h-4 w-4" />
                              ) : (
                                conversation.participants[0]?.name.slice(0, 2).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {!conversation.isGroup && conversation.participants[0]?.isOnline && (
                            <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                          )}
                          {conversation.isGroup && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-blue-500 border-2 border-background rounded-full flex items-center justify-center">
                              <Users className="h-2 w-2 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {getConversationName(conversation)}
                            </p>
                            <div className="flex items-center space-x-1">
                              {conversation.lastMessage && getStatusIcon(conversation.lastMessage.status)}
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessage && formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-3 ${selectedConversation ? 'block' : 'hidden lg:block'}`}>
            {selectedConversation ? (
              <Card className="h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getConversationAvatar(selectedConversation)} />
                          <AvatarFallback>
                            {selectedConversation.isGroup ? (
                              <Users className="h-4 w-4" />
                            ) : (
                              selectedConversation.participants[0]?.name.slice(0, 2).toUpperCase()
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {!selectedConversation.isGroup && selectedConversation.participants[0]?.isOnline && (
                          <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-semibold">{getConversationName(selectedConversation)}</h3>
                        <div className="flex items-center space-x-2">
                          {!selectedConversation.isGroup ? (
                            <>
                              <p className="text-xs text-muted-foreground">
                                {formatLastSeen(
                                  selectedConversation.participants[0]?.lastSeen || '',
                                  selectedConversation.participants[0]?.isOnline || false
                                )}
                              </p>
                              <div className={`w-2 h-2 rounded-full ${getRoleColor(selectedConversation.participants[0]?.role || 'member')}`} />
                              <p className="text-xs text-muted-foreground capitalize">
                                {selectedConversation.participants[0]?.role}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {selectedConversation.participants.length} members
                            </p>
                          )}
                          {selectedConversation.participants[0]?.isTyping && (
                            <Badge variant="outline" className="text-xs">
                              typing...
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Block User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Report User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {/* Security Warning */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border-b px-6 py-2">
                  <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                    <span>Messages are encrypted end-to-end. Session expires after 5 minutes of inactivity.</span>
                  </div>
                </div>

                {/* Messages Area */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.senderId === 'current-user'
                        const showAvatar = !isCurrentUser && (
                          index === 0 || 
                          messages[index - 1].senderId !== message.senderId
                        )
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                              showAvatar ? 'mt-4' : 'mt-1'
                            }`}
                          >
                            {!isCurrentUser && showAvatar && (
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={selectedConversation.participants[0]?.avatar} />
                                <AvatarFallback>
                                  {selectedConversation.participants[0]?.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {!isCurrentUser && !showAvatar && (
                              <div className="w-8 mr-2" />
                            )}

                            <div className={`max-w-[70%] ${isCurrentUser ? 'ml-12' : ''}`}>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                              </div>
                              <div className={`flex items-center mt-1 space-x-1 ${
                                isCurrentUser ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(message.timestamp)}
                                </span>
                                {isCurrentUser && getStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-end space-x-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="min-h-[44px] max-h-32 pr-12 resize-none"
                        rows={1}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 bottom-2"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Select a Conversation</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Choose a conversation from the sidebar to start messaging with other alumni members.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}