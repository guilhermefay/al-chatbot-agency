'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bot, Brain, MessageSquare, Settings, Plus, Play, BarChart3, Zap, Cpu } from 'lucide-react'

interface DifyApp {
  id: string
  name: string
  mode: string
  model_config: {
    model: string
    temperature: number
    max_tokens: number
  }
  created_at: string
  status: 'active' | 'inactive'
  conversations_count: number
}

interface DifyModel {
  name: string
  provider: string
  type: string
  max_tokens: number
}

export default function DifyWorkflowsPage() {
  const [apps, setApps] = useState<DifyApp[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [newApp, setNewApp] = useState({
    name: '',
    description: '',
    mode: 'chat',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 2000,
    prompt: ''
  })
  const [testQuery, setTestQuery] = useState('')
  const [testResponse, setTestResponse] = useState('')
  const [selectedApp, setSelectedApp] = useState<DifyApp | null>(null)

  const models: DifyModel[] = [
    { name: 'gpt-4', provider: 'openai', type: 'chat', max_tokens: 8000 },
    { name: 'gpt-3.5-turbo', provider: 'openai', type: 'chat', max_tokens: 4000 },
    { name: 'claude-3-sonnet', provider: 'anthropic', type: 'chat', max_tokens: 4000 },
    { name: 'claude-3-haiku', provider: 'anthropic', type: 'chat', max_tokens: 4000 },
    { name: 'gemini-pro', provider: 'google', type: 'chat', max_tokens: 4000 }
  ]

  const loadApps = async () => {
    setLoading(true)
    try {
      // Simular carregamento dos apps do Dify
      await new Promise(resolve => setTimeout(resolve, 1000))
      setApps([
        {
          id: '1',
          name: 'Atendimento WhatsApp',
          mode: 'chat',
          model_config: {
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 2000
          },
          created_at: '2025-07-02',
          status: 'active',
          conversations_count: 245
        },
        {
          id: '2', 
          name: 'Gerador de Propostas',
          mode: 'completion',
          model_config: {
            model: 'gpt-4',
            temperature: 0.3,
            max_tokens: 4000
          },
          created_at: '2025-07-01',
          status: 'active',
          conversations_count: 67
        }
      ])
    } catch (error) {
      console.error('Erro ao carregar apps:', error)
    }
    setLoading(false)
  }

  const createApp = async () => {
    try {
      const newAppData: DifyApp = {
        id: Date.now().toString(),
        name: newApp.name,
        mode: newApp.mode,
        model_config: {
          model: newApp.model,
          temperature: newApp.temperature,
          max_tokens: newApp.max_tokens
        },
        created_at: new Date().toISOString().split('T')[0],
        status: 'active',
        conversations_count: 0
      }
      
      setApps(prev => [newAppData, ...prev])
      setIsCreateDialogOpen(false)
      setNewApp({
        name: '',
        description: '',
        mode: 'chat',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 2000,
        prompt: ''
      })
    } catch (error) {
      console.error('Erro ao criar app:', error)
    }
  }

  const testApp = async () => {
    if (!selectedApp || !testQuery.trim()) return
    
    setLoading(true)
    try {
      // Simular teste do workflow
      await new Promise(resolve => setTimeout(resolve, 2000))
      setTestResponse(`Resposta simulada do ${selectedApp.name}:\n\n"${testQuery}"\n\nEsta é uma resposta de exemplo gerada pelo modelo ${selectedApp.model_config.model} com temperatura ${selectedApp.model_config.temperature}. Em produção, esta seria a resposta real da IA.`)
    } catch (error) {
      console.error('Erro ao testar app:', error)
      setTestResponse('Erro ao testar o workflow. Verifique as configurações.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadApps()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows IA</h1>
          <p className="text-muted-foreground">
            Gerencie assistentes IA, modelos e workflows personalizados
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Assistente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Assistente IA</DialogTitle>
              <DialogDescription>
                Configure um novo assistente inteligente para seu chatbot
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Assistente</label>
                <Input
                  value={newApp.name}
                  onChange={(e) => setNewApp(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Atendimento Comercial"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newApp.description}
                  onChange={(e) => setNewApp(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o propósito deste assistente..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Modelo de IA</label>
                  <Select value={newApp.model} onValueChange={(value) => setNewApp(prev => ({ ...prev, model: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map(model => (
                        <SelectItem key={model.name} value={model.name}>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3" />
                            {model.name} ({model.provider})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Modo</label>
                  <Select value={newApp.mode} onValueChange={(value) => setNewApp(prev => ({ ...prev, mode: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Modo do assistente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">💬 Chat Interativo</SelectItem>
                      <SelectItem value="completion">📝 Completar Texto</SelectItem>
                      <SelectItem value="agent">🤖 Agente Autônomo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Temperatura ({newApp.temperature})</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newApp.temperature}
                    onChange={(e) => setNewApp(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Máx. Tokens</label>
                  <Input
                    type="number"
                    value={newApp.max_tokens}
                    onChange={(e) => setNewApp(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    min="100"
                    max="8000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Prompt do Sistema</label>
                <Textarea
                  value={newApp.prompt}
                  onChange={(e) => setNewApp(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Você é um assistente especializado em..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={createApp} disabled={!newApp.name.trim()}>
                  <Zap className="h-4 w-4 mr-2" />
                  Criar Assistente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistentes Ativos</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apps.filter(a => a.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apps.reduce((sum, app) => sum + app.conversations_count, 0)}</div>
            <p className="text-xs text-muted-foreground">
              +180% vs semana passada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos em Uso</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(apps.map(a => a.model_config.model)).size}</div>
            <p className="text-xs text-muted-foreground">
              GPT-4, Claude, Gemini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">97.8%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% vs mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Assistentes */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Assistentes IA</CardTitle>
          <CardDescription>
            Gerencie e monitore todos os seus workflows inteligentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando assistentes...</p>
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum assistente criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro assistente IA para começar a automatizar conversas
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Assistente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {apps.map(app => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{app.name}</h3>
                        <Badge variant={app.status === 'active' ? 'default' : 'secondary'}>
                          {app.status === 'active' ? '🟢 Ativo' : '🔴 Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          {app.mode === 'chat' ? '💬 Chat' : app.mode === 'completion' ? '📝 Texto' : '🤖 Agente'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Modelo: <span className="font-mono">{app.model_config.model}</span></p>
                        <p>Conversas: <span className="font-medium">{app.conversations_count}</span> | Criado: {app.created_at}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedApp(app)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Testar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Testar Assistente: {selectedApp?.name}</DialogTitle>
                            <DialogDescription>
                              Envie uma mensagem de teste para ver como o assistente responde
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Mensagem de Teste</label>
                              <Textarea
                                value={testQuery}
                                onChange={(e) => setTestQuery(e.target.value)}
                                placeholder="Digite sua pergunta ou mensagem de teste..."
                                rows={3}
                              />
                            </div>
                            {testResponse && (
                              <div>
                                <label className="text-sm font-medium">Resposta do Assistente</label>
                                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                                  {testResponse}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setIsTestDialogOpen(false)
                                  setTestQuery('')
                                  setTestResponse('')
                                }}
                              >
                                Fechar
                              </Button>
                              <Button 
                                onClick={testApp} 
                                disabled={!testQuery.trim() || loading}
                              >
                                {loading ? 'Testando...' : 'Enviar Teste'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 