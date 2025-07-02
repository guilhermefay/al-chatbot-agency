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

  const mockStats = {
    activeAssistants: 3,
    todayConversations: 127,
    modelsInUse: 2,
    successRate: 94.8
  }

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setApps([
        {
          id: '1',
          name: 'Assistente de Vendas',
          mode: 'chat',
          model_config: { model: 'gpt-4', temperature: 0.7, max_tokens: 2000 },
          created_at: '2024-01-15',
          status: 'active',
          conversations_count: 45
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows IA</h1>
          <p className="text-muted-foreground">Crie assistentes IA personalizados</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Assistente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assistentes Ativos</p>
                <p className="text-2xl font-bold">{mockStats.activeAssistants}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversas Hoje</p>
                <p className="text-2xl font-bold">{mockStats.todayConversations}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modelos em Uso</p>
                <p className="text-2xl font-bold">{mockStats.modelsInUse}</p>
              </div>
              <Cpu className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{mockStats.successRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Assistentes */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Assistentes IA</CardTitle>
          <CardDescription>Gerencie seus assistentes inteligentes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {apps.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-medium">{app.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{app.model_config.model}</Badge>
                          <span>{app.conversations_count} conversas</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Testar
                      </Button>
                      <Button variant="outline" size="sm">
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
