'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  messagesToday: number
  activeConversations: number
  activeCompanies: number
  resolutionRate: number
  loading: boolean
  error: string | null
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    messagesToday: 0,
    activeConversations: 0,
    activeCompanies: 0,
    resolutionRate: 0,
    loading: true,
    error: null,
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }))

        // Buscar mensagens de hoje
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .gte('timestamp', new Date().toISOString().split('T')[0])

        if (messagesError) throw messagesError

        // Buscar conversas ativas
        const { data: conversations, error: conversationsError } = await supabase
          .from('conversations')
          .select('id')
          .eq('status', 'active')

        if (conversationsError) throw conversationsError

        // Buscar empresas ativas
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .eq('status', 'active')

        if (companiesError) throw companiesError

        // Buscar todas as conversas para calcular taxa de resolução real
        const { data: allConversations, error: allConversationsError } = await supabase
          .from('conversations')
          .select('id, status')

        if (allConversationsError) throw allConversationsError

        // Calcular taxa de resolução REAL baseada nos dados
        let resolutionRate = 0
        if (allConversations && allConversations.length > 0) {
          const resolvedCount = allConversations.filter(conv => 
            conv.status === 'completed' || conv.status === 'resolved'
          ).length
          resolutionRate = Math.round((resolvedCount / allConversations.length) * 100)
        }

        setStats({
          messagesToday: messages?.length || 0,
          activeConversations: conversations?.length || 0,
          activeCompanies: companies?.length || 0,
          resolutionRate,
          loading: false,
          error: null,
        })

      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }))
      }
    }

    fetchStats()
  }, [])

  return stats
} 