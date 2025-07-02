'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Database, Upload, Trash2, Edit, ThumbsUp, ThumbsDown, Plus, Search, Download, Settings } from 'lucide-react';

interface DifyConversation {
  id: string;
  contact: string;
  contact_name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  dify_conversation_id: string;
  dify_data?: {
    name: string;
    introduction: string;
    inputs: any;
  };
}

interface DifyMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  metadata?: any;
  dify_message_id?: string;
  dify_data?: {
    inputs: any;
    query: string;
    answer: string;
    feedback?: 'like' | 'dislike' | null;
    agent_thoughts?: any[];
    retriever_resources?: any[];
  };
}

interface DifyDataset {
  id: string;
  name: string;
  description: string;
  permission: string;
  created_at: string;
  document_count: number;
  local_documents: any[];
}

export default function DifyPage() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState<DifyConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DifyConversation | null>(null);
  const [messages, setMessages] = useState<DifyMessage[]>([]);
  const [datasets, setDatasets] = useState<DifyDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');
  const [newDatasetName, setNewDatasetName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // TODO: Pegar company_id do contexto/auth
  const COMPANY_ID = 'your-company-id';

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // **Funções de Conversas**
  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/conversations?company_id=${COMPANY_ID}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages?limit=100`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
    setLoading(false);
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta conversa?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/conversations/${conversationId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  const renameConversation = async () => {
    if (!selectedConversation || !newConversationName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/conversations/${selectedConversation.id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newConversationName })
      });
      const data = await response.json();
      if (data.success) {
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id 
            ? { ...c, contact_name: data.data.name }
            : c
        ));
        setSelectedConversation(prev => prev ? { ...prev, contact_name: data.data.name } : null);
        setIsRenameDialogOpen(false);
        setNewConversationName('');
      }
    } catch (error) {
      console.error('Erro ao renomear conversa:', error);
    }
  };

  const submitFeedback = async (messageId: string, rating: 'like' | 'dislike' | null) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => prev.map(m => 
          m.id === messageId 
            ? { 
                ...m, 
                dify_data: m.dify_data 
                  ? { ...m.dify_data, feedback: rating }
                  : { inputs: {}, query: '', answer: '', feedback: rating }
              }
            : m
        ));
      }
    } catch (error) {
      console.error('Erro ao submeter feedback:', error);
    }
  };

  // **Funções de Datasets**
  const loadDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/documents/datasets?company_id=${COMPANY_ID}&limit=50`);
      const data = await response.json();
      if (data.success) {
        setDatasets(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar datasets:', error);
    }
    setLoading(false);
  };

  const createDataset = async () => {
    if (!newDatasetName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/documents/datasets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company_id: COMPANY_ID, 
          name: newDatasetName,
          permission: 'only_me'
        })
      });
      const data = await response.json();
      if (data.success) {
        setDatasets(prev => [data.data, ...prev]);
        setIsDatasetDialogOpen(false);
        setNewDatasetName('');
      }
    } catch (error) {
      console.error('Erro ao criar dataset:', error);
    }
  };

  const uploadToDataset = async (datasetId: string) => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('company_id', COMPANY_ID);

    try {
      const response = await fetch(`${API_BASE}/documents/datasets/${datasetId}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        loadDatasets(); // Recarregar datasets
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations();
    } else if (activeTab === 'datasets') {
      loadDatasets();
    }
  }, [activeTab]);

  const filteredConversations = conversations.filter(conv => 
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Dify</h1>
          <p className="text-muted-foreground">
            Gerencie conversas, bases de conhecimento e integrações com Dify AI
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          ✅ Dify Integrado
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'conversations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('conversations')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Conversas
        </Button>
        <Button
          variant={activeTab === 'datasets' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('datasets')}
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Bases de Conhecimento
        </Button>
      </div>

      {/* Aba de Conversas */}
      {activeTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversas ({filteredConversations.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setSelectedConversation(conv);
                      loadMessages(conv.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{conv.contact_name || conv.contact}</p>
                        <p className="text-sm text-muted-foreground">
                          {conv.message_count} mensagens
                        </p>
                        {conv.dify_data && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Dify Integrado
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes da Conversa */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedConversation.contact_name || selectedConversation.contact}
                        {selectedConversation.dify_data && (
                          <Badge variant="outline" className="text-green-600">
                            Dify
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedConversation.dify_data?.introduction || 
                         `Conversa com ${selectedConversation.contact}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Renomear Conversa</DialogTitle>
                            <DialogDescription>
                              Digite um novo nome para esta conversa
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Nome da conversa"
                              value={newConversationName}
                              onChange={(e) => setNewConversationName(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button onClick={renameConversation} className="flex-1">
                                Salvar
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setIsRenameDialogOpen(false)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.role === 'user' 
                            ? 'bg-primary/10 ml-8' 
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              {message.role === 'user' ? 'Usuário' : 'Assistente'}
                            </p>
                            <p className="text-sm">{message.content}</p>
                            {message.dify_data?.agent_thoughts && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                Com Raciocínio IA
                              </Badge>
                            )}
                          </div>
                          
                          {/* Feedback para mensagens do assistente */}
                          {message.role === 'assistant' && message.dify_message_id && (
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => submitFeedback(message.id, 
                                  message.dify_data?.feedback === 'like' ? null : 'like'
                                )}
                                className={message.dify_data?.feedback === 'like' 
                                  ? 'text-green-600' : 'text-muted-foreground'
                                }
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => submitFeedback(message.id,
                                  message.dify_data?.feedback === 'dislike' ? null : 'dislike'
                                )}
                                className={message.dify_data?.feedback === 'dislike' 
                                  ? 'text-red-600' : 'text-muted-foreground'
                                }
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">
                    Selecione uma conversa para ver os detalhes
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Aba de Datasets */}
      {activeTab === 'datasets' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Bases de Conhecimento</h2>
            <Dialog open={isDatasetDialogOpen} onOpenChange={setIsDatasetDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Base
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Base de Conhecimento</DialogTitle>
                  <DialogDescription>
                    Crie uma nova base de conhecimento para treinar seu assistente IA
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nome da base de conhecimento"
                    value={newDatasetName}
                    onChange={(e) => setNewDatasetName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createDataset} className="flex-1">
                      Criar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDatasetDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <Card key={dataset.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {dataset.name}
                  </CardTitle>
                  <CardDescription>
                    {dataset.document_count} documentos • {dataset.permission}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => uploadToDataset(dataset.id)}
                        disabled={!selectedFile}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {dataset.local_documents.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Documentos locais:</p>
                        {dataset.local_documents.slice(0, 3).map((doc, idx) => (
                          <p key={idx} className="text-muted-foreground truncate">
                            • {doc.name}
                          </p>
                        ))}
                        {dataset.local_documents.length > 3 && (
                          <p className="text-muted-foreground">
                            +{dataset.local_documents.length - 3} mais...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p>Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
} 