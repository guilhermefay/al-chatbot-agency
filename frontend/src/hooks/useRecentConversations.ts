'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Conversation {
  id: string
  contact: string
  contact_name: string
  company_name: string
  last_message: string
  timestamp: Date
  unread: boolean
}

interface RecentConversationsData {
  conversations: Conversation[]
  loading: boolean
  error: string | null
}

export function useRecentConversations(): RecentConversationsData {
  const [data, setData] = useState<RecentConversationsData>({
    conversations: [],
    loading: true,
    error: null,
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchConversations() {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Buscar conversas recentes com as últimas mensagens
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select(`
            id,
            contact,
            contact_name,
            created_at,
            companies(name),
            messages(content, timestamp, role)
          `)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(5)

        if (error) throw error

                 // Processar dados para obter a última mensagem de cada conversa
        const processedConversations: Conversation[] = conversations?.map((conv: any) => {
          const messages = conv.messages || []
          const lastMessage = messages.length > 0 
            ? messages.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
            : null

          return {
            id: conv.id,
            contact: conv.contact,
            contact_name: conv.contact_name || 'Sem nome',
            company_name: conv.companies?.name || 'Empresa',
            last_message: lastMessage?.content || 'Nenhuma mensagem',
            timestamp: lastMessage ? new Date(lastMessage.timestamp) : new Date(conv.created_at),
            unread: Math.random() > 0.5, // Simulado por enquanto
          }
        }) || []

        setData({
          conversations: processedConversations,
          loading: false,
          error: null,
        })

      } catch (error) {
        console.error('Erro ao buscar conversas:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }))
      }
    }

    fetchConversations()
  }, [])

  return data
} 