'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ConversationWithCompany {
  id: string
  contact: string
  contact_name?: string
  contact_phone?: string
  platform: string
  status: string
  created_at: string
  updated_at: string
  company_id: string
  last_message?: {
    content: string
    timestamp: string
    role: string
  }
  company: {
    name: string
  }
  unread_count?: number
}

export function ConversationList() {
  const [conversations, setConversations] = useState<ConversationWithCompany[]>([])
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchConversations()
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          companies (name)
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Buscar última mensagem para cada conversa separadamente
      const processedData = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, timestamp, role')
            .eq('conversation_id', conv.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

          return {
            ...conv,
            company: conv.companies,
            last_message: lastMessage || null
          };
        })
      );

      setConversations(processedData)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact.includes(searchTerm) || 
                         conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter
    const matchesCompany = companyFilter === 'all' || conv.company_id === companyFilter
    return matchesSearch && matchesStatus && matchesCompany
  })

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por número ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="archived">Arquivadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredConversations.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conversa encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            As conversas aparecerão aqui quando os clientes entrarem em contato.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/dashboard/conversations/${conversation.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {conversation.contact_name || conversation.contact}
                    </h3>
                    <span className="text-sm text-gray-500">• {conversation.company.name}</span>
                    {conversation.platform && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {conversation.platform}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{conversation.contact}</p>
                  {conversation.last_message && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {conversation.last_message.role === 'user' ? '👤' : '🤖'} {conversation.last_message.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(conversation.last_message.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    conversation.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {conversation.status === 'active' ? 'Ativa' : 'Arquivada'}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(conversation.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}