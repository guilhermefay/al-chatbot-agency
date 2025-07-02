'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  dify_api_key: string | null
}

interface IntegrationSettings {
  dify_api_key: string
  evolution_instance: string
}

export default function IntegrationsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [settings, setSettings] = useState<IntegrationSettings>({
    dify_api_key: '',
    evolution_instance: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const supabase = createClient()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      loadCompanySettings(selectedCompany)
    }
  }, [selectedCompany])

  async function fetchCompanies() {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, dify_api_key')
        .eq('status', 'active')

      if (error) throw error
      setCompanies(data || [])
      
      if (data && data.length > 0) {
        setSelectedCompany(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    }
  }

  async function loadCompanySettings(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('dify_api_key')
        .eq('id', companyId)
        .single()

      if (error) throw error

      // Buscar instância do WhatsApp
      const { data: whatsappData } = await supabase
        .from('whatsapp_sessions')
        .select('evolution_instance')
        .eq('company_id', companyId)
        .single()

      setSettings({
        dify_api_key: data?.dify_api_key || '',
        evolution_instance: whatsappData?.evolution_instance || ''
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function saveSettings() {
    if (!selectedCompany) return

    setLoading(true)
    try {
      // Atualizar dados da empresa
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          dify_api_key: settings.dify_api_key
        })
        .eq('id', selectedCompany)

      if (companyError) throw companyError

      // Criar ou atualizar sessão WhatsApp se necessário
      if (settings.evolution_instance) {
        const { error: whatsappError } = await supabase
          .from('whatsapp_sessions')
          .upsert({
            company_id: selectedCompany,
            evolution_instance: settings.evolution_instance,
            status: 'disconnected'
          })

        if (whatsappError) throw whatsappError
      }

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="mt-2 text-gray-600">
          Configure as integrações essenciais para suas empresas
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seletor de Empresa */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Selecionar Empresa</h2>
          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCompany === company.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCompany(company.id)}
              >
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-500">
                  {company.dify_api_key ? '✅ Dify configurado' : '❌ Dify não configurado'}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Configurações */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Configurações de Integração</h2>
          
          {selectedCompany ? (
            <div className="space-y-6">
              {/* Dify AI */}
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-green-700 mb-3">🤖 Dify AI (Obrigatório)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure sua API key do Dify para processamento de IA. O Dify já inclui OpenAI, Claude, e text-to-speech.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="dify_api_key">API Key do Dify</Label>
                    <Input
                      id="dify_api_key"
                      type="password"
                      placeholder="app-xxxxxxxxxx"
                      value={settings.dify_api_key}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        dify_api_key: e.target.value 
                      }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Encontre sua API em: Dify → API de Serviço → API Key
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Evolution API */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-700 mb-3">📱 WhatsApp Evolution API (Opcional)</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Configure a instância do WhatsApp para sua empresa
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="evolution_instance">Nome da Instância</Label>
                    <Input
                      id="evolution_instance"
                      placeholder="minha-empresa-001"
                      value={settings.evolution_instance}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        evolution_instance: e.target.value 
                      }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Nome único para identificar esta empresa no Evolution API
                    </p>
                  </div>
                </div>
              </div>

              {/* Aviso sobre funcionalidades */}
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold text-yellow-700 mb-3">💡 Sobre as funcionalidades</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>✅ OpenAI:</strong> Já incluído no Dify (GPT-4, Claude, etc.)</p>
                  <p><strong>✅ Text-to-Speech:</strong> Já incluído no Dify (nativo)</p>
                  <p><strong>✅ Conversação:</strong> Gerenciado pelo Dify</p>
                  <p><strong>🔧 WhatsApp:</strong> Opcional - para receber mensagens</p>
                </div>
              </div>

              <Button 
                onClick={saveSettings} 
                disabled={loading || !settings.dify_api_key}
                className="w-full"
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Selecione uma empresa para configurar</p>
            </div>
          )}
        </Card>
      </div>

      {/* Como Configurar */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">📋 Como Configurar</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-600 mb-2">1. Configure o Dify</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Acesse seu painel Dify</li>
              <li>• Vá em "API de Serviço"</li>
              <li>• Copie a API Key (app-xxxxx)</li>
              <li>• Cole aqui e salve</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-green-600 mb-2">2. Teste o Chat</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vá em "👥 Clientes"</li>
              <li>• Clique na empresa</li>
              <li>• Aba "🧪 Chat Teste"</li>
              <li>• Comece a conversar!</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
} 