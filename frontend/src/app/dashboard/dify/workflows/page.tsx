'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Bot, Zap, BarChart3, MessageSquare, Play, Settings, Trash2, ExternalLink, Key } from 'lucide-react'
import { toast } from 'sonner'

interface DifyApp {
  id: string
  name: string
  description: string
  mode: 'chat' | 'completion' | 'workflow' | 'agent-chat'
  enable_site: boolean
  enable_api: boolean
  api_url?: string
  created_at: string
}

export default function DifyAPIIntegration() {
  const [apps, setApps] = useState<DifyApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)

  // Stats calculados dos apps
  const stats = {
    totalApps: apps.length,
    chatbots: apps.filter(app => app.mode === 'chat').length,
    workflows: apps.filter(app => app.mode === 'workflow').length,
    agents: apps.filter(app => app.mode === 'agent-chat').length,
    activeApps: apps.filter(app => app.enable_api).length
  }

  // Configuração da API Key
  const handleConfigureAPI = async () => {
    if (!apiKey.trim()) {
      toast.error('Insira sua API Key do Dify Cloud')
      return
    }
    
    // Salvar no localStorage por enquanto (depois mover para backend)
    localStorage.setItem('dify_api_key', apiKey)
    setIsConfigured(true)
    setShowConfigDialog(false)
    toast.success('API Key configurada com sucesso!')
    await fetchApps()
  }

  // Buscar apps do Dify Cloud
  const fetchApps = async () => {
    setIsLoading(true)
    try {
      const savedApiKey = localStorage.getItem('dify_api_key')
      if (!savedApiKey) {
        setIsConfigured(false)
        setIsLoading(false)
        return
      }

      // Simular chamada da API do Dify Cloud
      // Na implementação real, seria: const response = await fetch('https://api.dify.ai/v1/apps', { headers: { 'Authorization': `Bearer ${savedApiKey}` } })
      
      // Mock data que simula resposta da API do Dify
      const mockApps: DifyApp[] = [
        {
          id: '1',
          name: 'Assistente de Suporte',
          description: 'Chatbot para atendimento ao cliente com IA avançada',
          mode: 'chat',
          enable_site: true,
          enable_api: true,
          api_url: 'https://api.dify.ai/v1/chat-messages',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2', 
          name: 'Análise de Documentos',
          description: 'Workflow para processar e extrair informações de documentos',
          mode: 'workflow',
          enable_site: false,
          enable_api: true,
          api_url: 'https://api.dify.ai/v1/workflows/run',
          created_at: '2024-01-14T15:30:00Z'
        },
        {
          id: '3',
          name: 'Agente de Vendas',
          description: 'Agente inteligente para qualificação e follow-up de leads',
          mode: 'agent-chat',
          enable_site: true,
          enable_api: true,
          api_url: 'https://api.dify.ai/v1/chat-messages',
          created_at: '2024-01-12T14:45:00Z'
        }
      ]

      setApps(mockApps)
      setIsConfigured(true)
      toast.success('Apps carregados com sucesso!')
      
    } catch (error) {
      console.error('Erro ao buscar apps:', error)
      toast.error('Erro ao conectar com Dify Cloud')
    } finally {
      setIsLoading(false)
    }
  }

  // Testar app
  const testApp = (app: DifyApp) => {
    toast.info(`Abrindo teste para: ${app.name}`)
    // Implementar modal de teste ou redirect
  }

  // Verificar configuração ao carregar
  useEffect(() => {
    const savedApiKey = localStorage.getItem('dify_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      fetchApps()
    } else {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Conectando com Dify Cloud...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Configurar Dify Cloud</CardTitle>
            <CardDescription>
              Configure sua API Key para conectar com o Dify Cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key do Dify Cloud</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="app-xxx..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha sua API Key em: <a href="https://cloud.dify.ai" target="_blank" className="text-blue-600 hover:underline">cloud.dify.ai</a>
              </p>
            </div>
            <Button onClick={handleConfigureAPI} className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Conectar com Dify Cloud
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dify Cloud Studio</h1>
          <p className="text-muted-foreground">
            Gerencie seus assistentes IA conectados ao Dify Cloud
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConfigDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Assistente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalApps}</p>
                <p className="text-xs text-muted-foreground">Total Apps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.chatbots}</p>
                <p className="text-xs text-muted-foreground">Chatbots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.workflows}</p>
                <p className="text-xs text-muted-foreground">Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.agents}</p>
                <p className="text-xs text-muted-foreground">Agentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeApps}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <Card key={app.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {app.mode === 'chat' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                    {app.mode === 'workflow' && <Zap className="h-5 w-5 text-purple-600" />}
                    {app.mode === 'agent-chat' && <Bot className="h-5 w-5 text-orange-600" />}
                    {app.mode === 'completion' && <BarChart3 className="h-5 w-5 text-green-600" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={app.enable_api ? "default" : "secondary"}>
                        {app.mode}
                      </Badge>
                      {app.enable_api && (
                        <Badge variant="outline" className="text-green-600">
                          API Ativa
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-2">
                {app.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Criado: {new Date(app.created_at).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" onClick={() => testApp(app)}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações do Dify Cloud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="config-api-key">API Key</Label>
              <Input
                id="config-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfigureAPI}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criar App */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Assistente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="app-name">Nome do Assistente</Label>
              <Input id="app-name" placeholder="Ex: Assistente de Vendas" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-description">Descrição</Label>
              <Textarea id="app-description" placeholder="Descreva o que este assistente fará..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-mode">Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chatbot</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="agent-chat">Agente</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                toast.success('Assistente criado com sucesso!')
                setShowCreateDialog(false)
              }}>
                Criar Assistente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
