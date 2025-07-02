'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { 
  Bot, 
  MessageSquare, 
  Phone, 
  Settings, 
  Calendar, 
  Users, 
  QrCode,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  features: any;
  dify_api_key: string;
  dify_app_id: string;
  whatsapp_sessions?: any[];
  conversations?: any[];
  tools_config?: any[];
}

interface Conversation {
  id: string;
  contact_name: string;
  contact_phone: string;
  platform: string;
  status: string;
  last_message: string;
  last_message_at: string;
  messages_count: number;
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const [company, setCompany] = useState<Company | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'integrations');
  const [loading, setLoading] = useState(true);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Estados das configurações
  const [difyConfig, setDifyConfig] = useState({
    api_key: '',
    app_id: '',
    base_url: 'https://api.dify.ai/v1'
  });
  
  const [calendarConfig, setCalendarConfig] = useState({
    google_calendar_id: '',
    service_account_key: '',
    enabled: false
  });
  
  const [crmConfig, setCrmConfig] = useState({
    crm_type: 'pipedrive', // pipedrive, hubspot, salesforce
    api_key: '',
    domain: '',
    enabled: false
  });

  const supabase = createClient();

  useEffect(() => {
    if (id) {
      fetchCompanyDetails();
      fetchConversations();
    }
  }, [id]);

  const fetchCompanyDetails = async () => {
    try {
      // Buscar dados da empresa
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*, whatsapp_sessions(*), tools_config(*)')
        .eq('id', id)
        .single();

      if (error) throw error;

      setCompany(companyData);
      
      // Configurar estados baseado nos dados existentes
      if (companyData.dify_api_key) {
        setDifyConfig({
          api_key: companyData.dify_api_key,
          app_id: companyData.dify_app_id || '',
          base_url: 'https://api.dify.ai/v1'
        });
      }

      // Buscar configurações de ferramentas
      const toolsConfig = companyData.tools_config || [];
      toolsConfig.forEach((tool: any) => {
        if (tool.tool_name === 'google_calendar') {
          setCalendarConfig({
            google_calendar_id: tool.config?.calendar_id || '',
            service_account_key: tool.config?.service_account_key || '',
            enabled: tool.enabled || false
          });
        }
        if (tool.tool_name === 'crm') {
          setCrmConfig({
            crm_type: tool.config?.crm_type || 'pipedrive',
            api_key: tool.config?.api_key || '',
            domain: tool.config?.domain || '',
            enabled: tool.enabled || false
          });
        }
      });

      // Verificar status do WhatsApp se existir sessão
      if (companyData.whatsapp_sessions?.length > 0) {
        await checkWhatsAppStatus();
      }

    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_name,
          contact_phone,
          platform,
          status,
          last_message,
          last_message_at,
          messages(count)
        `)
        .eq('company_id', id)
        .order('last_message_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const processedConversations = data.map((conv: any) => ({
        ...conv,
        messages_count: conv.messages?.length || 0
      }));

      setConversations(processedConversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(`/api/companies/${id}/whatsapp/status`);
      const data = await response.json();
      setWhatsappStatus(data);
    } catch (error) {
      console.error('Erro ao verificar status WhatsApp:', error);
    }
  };

  const createWhatsAppSession = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/companies/${id}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (response.ok) {
        setQrCode(data.qr_code);
        setWhatsappStatus({ status: 'disconnected' });
        
        // Polling para verificar conexão
        const pollStatus = setInterval(async () => {
          await checkWhatsAppStatus();
          const currentStatus = whatsappStatus?.status;
          if (currentStatus === 'open') {
            clearInterval(pollStatus);
          }
        }, 3000);
        
        // Limpar polling após 2 minutos
        setTimeout(() => clearInterval(pollStatus), 120000);
      }
    } catch (error) {
      console.error('Erro ao criar sessão WhatsApp:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveDifyConfig = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('companies')
        .update({
          dify_api_key: difyConfig.api_key,
          dify_app_id: difyConfig.app_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      alert('Configuração Dify salva com sucesso!');
      await fetchCompanyDetails();
    } catch (error) {
      console.error('Erro ao salvar Dify:', error);
      alert('Erro ao salvar configuração Dify');
    } finally {
      setSaving(false);
    }
  };

  const saveCalendarConfig = async () => {
    try {
      setSaving(true);
      
      // Salvar/atualizar configuração do Google Calendar
      const { error } = await supabase
        .from('tools_config')
        .upsert({
          company_id: id,
          tool_name: 'google_calendar',
          enabled: calendarConfig.enabled,
          config: {
            calendar_id: calendarConfig.google_calendar_id,
            service_account_key: calendarConfig.service_account_key
          }
        });

      if (error) throw error;
      
      alert('Configuração Google Calendar salva!');
    } catch (error) {
      console.error('Erro ao salvar Calendar:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const saveCrmConfig = async () => {
    try {
      setSaving(true);
      
      // Salvar/atualizar configuração do CRM
      const { error } = await supabase
        .from('tools_config')
        .upsert({
          company_id: id,
          tool_name: 'crm',
          enabled: crmConfig.enabled,
          config: {
            crm_type: crmConfig.crm_type,
            api_key: crmConfig.api_key,
            domain: crmConfig.domain
          }
        });

      if (error) throw error;
      
      alert('Configuração CRM salva!');
    } catch (error) {
      console.error('Erro ao salvar CRM:', error);
      alert('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl text-gray-600">Empresa não encontrada</h1>
      </div>
    );
  }

  const getIntegrationStatus = () => {
    const difyConnected = !!company.dify_api_key;
    const whatsappConnected = whatsappStatus?.status === 'open';
    const calendarConnected = calendarConfig.enabled && calendarConfig.google_calendar_id;
    const crmConnected = crmConfig.enabled && crmConfig.api_key;
    
    const totalIntegrations = 4;
    const connectedCount = [difyConnected, whatsappConnected, calendarConnected, crmConnected]
      .filter(Boolean).length;
    
    return { connectedCount, totalIntegrations, percentage: (connectedCount / totalIntegrations) * 100 };
  };

  const integrationStatus = getIntegrationStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-gray-600 mt-1">{company.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={`${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {company.status}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {company.plan}
            </Badge>
          </div>
        </div>
        
        <Card className="w-64">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {integrationStatus.connectedCount}/{integrationStatus.totalIntegrations}
              </div>
              <div className="text-sm text-gray-600">Integrações Ativas</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${integrationStatus.percentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'integrations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Integrações
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Conversas ({conversations.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Dify AI Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  Dify AI - Chatbot
                  {company.dify_api_key && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  Configure a IA conversacional do chatbot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dify-key">API Key</Label>
                  <Input
                    id="dify-key"
                    type="password"
                    value={difyConfig.api_key}
                    onChange={(e) => setDifyConfig({...difyConfig, api_key: e.target.value})}
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <Label htmlFor="dify-app">App ID</Label>
                  <Input
                    id="dify-app"
                    value={difyConfig.app_id}
                    onChange={(e) => setDifyConfig({...difyConfig, app_id: e.target.value})}
                    placeholder="app-..."
                  />
                </div>
                <Button onClick={saveDifyConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-green-600" />
                  WhatsApp - Evolution API
                  {whatsappStatus?.status === 'open' && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  Conecte via QR Code para receber mensagens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {whatsappStatus ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span>Status:</span>
                      <Badge className={
                        whatsappStatus.status === 'open' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {whatsappStatus.status === 'open' ? 'Conectado' : 'Desconectado'}
                      </Badge>
                    </div>
                    {whatsappStatus.phone_number && (
                      <div className="text-sm text-gray-600">
                        Número: {whatsappStatus.phone_number}
                      </div>
                    )}
                    {qrCode && whatsappStatus.status !== 'open' && (
                      <div className="text-center">
                        <img src={qrCode} alt="QR Code" className="mx-auto max-w-48" />
                        <p className="text-sm text-gray-600 mt-2">
                          Escaneie o QR Code no WhatsApp
                        </p>
                      </div>
                    )}
                    <Button onClick={checkWhatsAppStatus} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar Status
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                      Nenhuma sessão WhatsApp configurada
                    </p>
                    <Button onClick={createWhatsAppSession} disabled={saving}>
                      {saving ? 'Criando...' : 'Conectar WhatsApp'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Calendar Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Google Agenda
                  {calendarConfig.enabled && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  Integração para agendamentos automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="calendar-enabled"
                    checked={calendarConfig.enabled}
                    onChange={(e) => setCalendarConfig({...calendarConfig, enabled: e.target.checked})}
                  />
                  <Label htmlFor="calendar-enabled">Habilitar integração</Label>
                </div>
                
                {calendarConfig.enabled && (
                  <>
                    <div>
                      <Label htmlFor="calendar-id">Calendar ID</Label>
                      <Input
                        id="calendar-id"
                        value={calendarConfig.google_calendar_id}
                        onChange={(e) => setCalendarConfig({...calendarConfig, google_calendar_id: e.target.value})}
                        placeholder="your-calendar@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-key">Service Account Key (JSON)</Label>
                      <Textarea
                        id="service-key"
                        value={calendarConfig.service_account_key}
                        onChange={(e) => setCalendarConfig({...calendarConfig, service_account_key: e.target.value})}
                        placeholder='{"type": "service_account", ...}'
                        rows={3}
                      />
                    </div>
                  </>
                )}
                
                <Button onClick={saveCalendarConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardContent>
            </Card>

            {/* CRM Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-orange-600" />
                  CRM
                  {crmConfig.enabled && (
                    <CheckCircle className="h-4 w-4 ml-2 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>
                  Sincronização com sistema de CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="crm-enabled"
                    checked={crmConfig.enabled}
                    onChange={(e) => setCrmConfig({...crmConfig, enabled: e.target.checked})}
                  />
                  <Label htmlFor="crm-enabled">Habilitar integração</Label>
                </div>
                
                {crmConfig.enabled && (
                  <>
                    <div>
                      <Label htmlFor="crm-type">Tipo de CRM</Label>
                      <select
                        id="crm-type"
                        value={crmConfig.crm_type}
                        onChange={(e) => setCrmConfig({...crmConfig, crm_type: e.target.value})}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="pipedrive">Pipedrive</option>
                        <option value="hubspot">HubSpot</option>
                        <option value="salesforce">Salesforce</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="crm-key">API Key</Label>
                      <Input
                        id="crm-key"
                        type="password"
                        value={crmConfig.api_key}
                        onChange={(e) => setCrmConfig({...crmConfig, api_key: e.target.value})}
                        placeholder="API Key do CRM"
                      />
                    </div>
                    <div>
                      <Label htmlFor="crm-domain">Domínio/URL</Label>
                      <Input
                        id="crm-domain"
                        value={crmConfig.domain}
                        onChange={(e) => setCrmConfig({...crmConfig, domain: e.target.value})}
                        placeholder="yourcompany.pipedrive.com"
                      />
                    </div>
                  </>
                )}
                
                <Button onClick={saveCrmConfig} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Conversas Recentes</h3>
            <Button variant="outline" onClick={fetchConversations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
          
          {conversations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma conversa ainda
                </h3>
                <p className="text-gray-600">
                  As conversas aparecerão aqui após configurar as integrações
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{conversation.contact_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {conversation.platform}
                          </Badge>
                          <Badge className={`text-xs ${
                            conversation.status === 'open' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {conversation.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {conversation.contact_phone}
                        </p>
                        <p className="text-gray-800 text-sm line-clamp-2">
                          {conversation.last_message}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(conversation.last_message_at).toLocaleDateString()}</div>
                        <div className="text-xs mt-1">
                          {conversation.messages_count} mensagens
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 