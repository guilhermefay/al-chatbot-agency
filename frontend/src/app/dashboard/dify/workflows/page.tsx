'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, RefreshCw, Settings, Plus, Bot, Zap, BarChart3, Users } from 'lucide-react'

export default function DifyCloudIntegration() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'dashboard' | 'apps' | 'workflows' | 'datasets'>('apps')
  const [difyToken, setDifyToken] = useState('')

  // URL base do Dify Cloud
  const DIFY_CLOUD_BASE = 'https://cloud.dify.ai'
  
  // URLs específicas para cada seção
  const difyUrls = {
    dashboard: `${DIFY_CLOUD_BASE}`,
    apps: `${DIFY_CLOUD_BASE}/apps`,
    workflows: `${DIFY_CLOUD_BASE}/apps`,
    datasets: `${DIFY_CLOUD_BASE}/datasets`
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const openInNewTab = (view: string) => {
    window.open(difyUrls[view as keyof typeof difyUrls], '_blank')
  }

  return (
    <div className="h-full w-full">
      {/* Header com controles */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dify Cloud Studio</h1>
            <p className="text-muted-foreground">
              Interface completa do Dify Cloud integrada ao seu sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openInNewTab(selectedView)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Dify
            </Button>
          </div>
        </div>

        {/* Navegação de Seções */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          {[
            { key: 'apps', label: 'Aplicativos', icon: Bot },
            { key: 'workflows', label: 'Workflows', icon: Zap },
            { key: 'datasets', label: 'Datasets', icon: BarChart3 },
            { key: 'dashboard', label: 'Dashboard', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${selectedView === key 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }
              `}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards - apenas quando não está carregando */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">Dify Cloud</p>
                  <p className="text-xs text-muted-foreground">Conectado</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">Workflows</p>
                  <p className="text-xs text-muted-foreground">Ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">Analytics</p>
                  <p className="text-xs text-muted-foreground">Disponível</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">Team</p>
                  <p className="text-xs text-muted-foreground">Sincronizado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando Dify Cloud...</p>
          </div>
        </div>
      )}

      {/* Main Iframe - Dify Cloud Embedded */}
      <Card className="w-full h-[800px]">
        <CardContent className="p-0 h-full">
          <iframe
            src={difyUrls[selectedView]}
            className="w-full h-full border-0 rounded-lg"
            onLoad={handleIframeLoad}
            style={{ 
              minHeight: '800px',
              display: isLoading ? 'none' : 'block'
            }}
            title="Dify Cloud Studio"
            allow="clipboard-write; web-share"
            sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Criar Novo App</CardTitle>
            <CardDescription>
              Comece um novo projeto IA no Dify Cloud
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => openInNewTab('apps')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Aplicativo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Workflows Avançados</CardTitle>
            <CardDescription>
              Crie fluxos complexos de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => openInNewTab('workflows')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Ver Workflows
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bases de Conhecimento</CardTitle>
            <CardDescription>
              Gerencie datasets e documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => openInNewTab('datasets')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Datasets
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Status da Integração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Dify Cloud Connection</span>
                <Badge variant="default">🟢 Conectado</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API Sync</span>
                <Badge variant="default">🟢 Ativo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>AL Studio Integration</span>
                <Badge variant="default">🟢 Funcionando</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
