'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRecentConversations } from '@/hooks/useRecentConversations'

export function RecentConversations() {
  const { conversations, loading, error } = useRecentConversations()

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Conversas Recentes
          </h3>
        </div>
        <div className="border-t border-gray-200 p-4">
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-600 text-sm">Erro ao carregar conversas: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Conversas Recentes
        </h3>
      </div>
      <div className="border-t border-gray-200">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <p className="text-gray-500 text-center">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
            <li key={conversation.id}>
              <a
                href={`/dashboard/conversations/${conversation.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-400 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {conversation.contact_name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {conversation.contact_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {conversation.contact} • {conversation.company_name}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(conversation.timestamp, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    {conversation.unread && (
                      <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nova
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </li>
                      ))}
          </ul>
        )}
      </div>
    </div>
  )
}