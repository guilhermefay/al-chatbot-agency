'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, MoreHorizontal, Play, Settings, Copy, Trash2, Calendar } from 'lucide-react'

interface App {
  id: string
  name: string
  description: string
  mode: string
  icon: string
  icon_background: string
  created_at: string
  created_by: string
}

export interface AppCardProps {
  app: App
  onRefresh?: () => void
}

const AppCard = ({ app, onRefresh }: AppCardProps) => {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getModeLabel = (mode: string) => {
    const modes: Record<string, string> = {
      'chat': 'Chatbot',
      'workflow': 'Workflow',
      'completion': 'Completion',
      'agent-chat': 'Agente',
      'advanced-chat': 'Chat Avançado'
    }
    return modes[mode] || mode
  }

  const getModeColor = (mode: string) => {
    const colors: Record<string, string> = {
      'chat': 'bg-blue-100 text-blue-700',
      'workflow': 'bg-purple-100 text-purple-700',
      'completion': 'bg-green-100 text-green-700',
      'agent-chat': 'bg-orange-100 text-orange-700',
      'advanced-chat': 'bg-indigo-100 text-indigo-700'
    }
    return colors[mode] || 'bg-gray-100 text-gray-700'
  }

  return (
    <Card className="group relative h-[160px] cursor-pointer transition-all hover:shadow-md border-[0.5px] bg-white">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header com ícone e menu */}
        <div className="flex items-start justify-between mb-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-medium"
            style={{ backgroundColor: app.icon_background }}
          >
            {app.icon}
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
                <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Play className="h-3 w-3" />
                  Testar
                </button>
                <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="h-3 w-3" />
                  Configurar
                </button>
                <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Copy className="h-3 w-3" />
                  Duplicar
                </button>
                <div className="border-t my-1"></div>
                <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                  <Trash2 className="h-3 w-3" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1">
          <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
            {app.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
            {app.description}
          </p>
          
          <Badge variant="secondary" className={`text-xs ${getModeColor(app.mode)}`}>
            {getModeLabel(app.mode)}
          </Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(app.created_at)}
          </div>
          <Bot className="h-3 w-3" />
        </div>
      </CardContent>
    </Card>
  )
}

export default AppCard 