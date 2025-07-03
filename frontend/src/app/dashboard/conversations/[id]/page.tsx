'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  MoreVertical, 
  Paperclip,
  Mic,
  Check,
  CheckCheck,
  Clock,
  Bot,
  User
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  company_id: string;
  contact: string;
  contact_name?: string;
  contact_phone?: string;
  platform: string;
  status: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  companies?: {
    name: string;
  };
}

export default function ConversationDetailPage() {
  const params = useParams();
  const { id } = params;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-api-final-production.up.railway.app/api';

  useEffect(() => {
    if (id) {
      fetchConversation();
      fetchMessages();
      // Set up real-time subscription
      const messageSubscription = supabase
        .channel(`conversation-${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        messageSubscription.unsubscribe();
      };
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          companies (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage('');

    // Add optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: id as string,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send message via API to trigger WhatsApp
      const response = await fetch(`${API_BASE_URL}/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageText,
          role: 'user'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Remove optimistic message as real-time will add the actual one
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

    } catch (error) {
      console.error('Error sending message:', error);
      // Update optimistic message to show error
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'failed' as any }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageStatus = (message: Message) => {
    if (message.role === 'assistant') return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-gray-400" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Conversa não encontrada</h2>
          <p className="text-gray-500 mt-2">A conversa que você está procurando não existe.</p>
          <Button 
            onClick={() => window.history.back()} 
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => window.history.back()} 
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Avatar className="h-10 w-10 bg-blue-100">
            <div className="flex items-center justify-center h-full w-full text-blue-600 font-semibold">
              {conversation.contact_name ? conversation.contact_name[0].toUpperCase() : '👤'}
            </div>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {conversation.contact_name || conversation.contact}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{conversation.contact}</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {conversation.platform}
              </Badge>
              <span>•</span>
              <span>{conversation.companies?.name}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhuma mensagem ainda
              </h3>
              <p className="text-gray-500">
                Comece uma conversa enviando uma mensagem
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isBot = message.role === 'assistant';
            
            return (
              <div
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm border'
                  }`}
                >
                  {isBot && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Bot className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-500 font-medium">AI Bot</span>
                    </div>
                  )}
                  
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <span className="text-xs">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    {getMessageStatus(message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="pr-12 rounded-full border-gray-300 focus:border-blue-500"
              disabled={sending}
            />
            {newMessage.trim() && (
              <Button
                onClick={sendMessage}
                disabled={sending}
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {!newMessage.trim() && (
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Mic className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}