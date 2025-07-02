'use client'

import { MessageCircle, Users, Building2, TrendingUp, Bot } from 'lucide-react'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export function DashboardStats() {
  const { 
    messagesToday, 
    activeConversations, 
    activeCompanies, 
    resolutionRate, 
    loading, 
    error 
  } = useDashboardStats()

  const stats = [
    {
      name: 'Mensagens Hoje',
      value: loading ? '...' : messagesToday.toString(),
      icon: MessageCircle,
      description: 'Total de mensagens processadas hoje'
    },
    {
      name: 'Conversas Ativas',
      value: loading ? '...' : activeConversations.toString(),
      icon: Users,
      description: 'Conversas em andamento'
    },
    {
      name: 'Chatbots Ativos',
      value: loading ? '...' : activeCompanies.toString(),
      icon: Bot,
      description: 'Empresas com chatbots funcionando'
    },
    {
      name: 'Taxa de Resolução',
      value: loading ? '...' : `${resolutionRate}%`,
      icon: TrendingUp,
      description: 'Eficiência dos chatbots'
    },
  ]

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erro ao carregar estatísticas: {error}</p>
      </div>
    )
  }

  // Mostrar aviso se não há dados
  const hasNoData = !loading && messagesToday === 0 && activeConversations === 0 && activeCompanies === 0;

  return (
    <div className="space-y-4">
      {hasNoData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-blue-600 mr-2" />
            <p className="text-blue-800 font-medium">Sistema pronto para uso!</p>
          </div>
          <p className="text-blue-600 text-sm mt-1">
            Adicione sua primeira empresa em <strong>Empresas → Nova Empresa</strong> para começar a ver dados reais.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-600 truncate">
                      {item.name}
                    </dt>
                    <dd className="mt-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {item.value}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}