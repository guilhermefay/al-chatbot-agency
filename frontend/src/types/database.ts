export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
  dify_app_id?: string
  features: {
    voice_enabled?: boolean
    calendar_enabled?: boolean
    crm_enabled?: boolean
  }
  voice_config?: {
    voiceId?: string
    stability?: number
    similarity?: number
  }
  created_at: string
  updated_at: string
}

export interface WhatsAppSession {
  id: string
  company_id: string
  evolution_instance: string
  phone_number?: string
  status: 'connected' | 'disconnected' | 'qr_code'
  qr_code?: string
  webhook_url?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  company_id: string
  contact: string
  contact_name?: string
  status: 'active' | 'archived'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  raw_message?: any
  timestamp: string
  created_at: string
}

export interface Document {
  id: string
  company_id: string
  name: string
  type?: string
  url?: string
  dify_document_id?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ToolConfig {
  id: string
  company_id: string
  tool_id: string
  tool_name: string
  tool_type: 'calendar' | 'crm' | 'custom'
  enabled: boolean
  credentials?: string
  custom_config?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface UsageMetrics {
  id: string
  company_id: string
  metric_date: string
  messages_sent: number
  messages_received: number
  audio_minutes: number
  tokens_used: number
  tool_calls: number
  created_at: string
}