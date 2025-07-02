'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Plus, MessageSquare, Phone, Settings, Bot, Headphones } from 'lucide-react';
import { AddCompanyModal } from './add-company-modal';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  features: any;
  dify_api_key: string;
  created_at: string;
  whatsapp_sessions?: any[];
  conversations_count?: number;
  messages_count?: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // Buscar empresas com sessões WhatsApp e contadores
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          whatsapp_sessions(*),
          conversations(count),
          messages(count)
        `);

      if (companiesError) throw companiesError;

      // Processar dados para adicionar contadores
      const processedData = (companiesData || []).map((company: any) => ({
        ...company,
        conversations_count: company.conversations?.length || 0,
        messages_count: company.messages?.length || 0
      }));

      setCompanies(processedData);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Empresas & Chatbots</h1>
          <p className="text-gray-600 mt-2">
            Cada empresa = 1 chatbot independente com configurações separadas
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Bot className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{companies.length}</div>
            <div className="text-sm text-gray-600">Chatbots Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + (c.conversations_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Conversas Totais</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">
              {companies.filter(c => c.whatsapp_sessions && c.whatsapp_sessions.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">WhatsApp Conectados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Headphones className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold">
              {companies.filter(c => c.features?.voice).length}
            </div>
            <div className="text-sm text-gray-600">Com Áudio Habilitado</div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {company.email}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge className={getStatusColor(company.status)}>
                    {company.status}
                  </Badge>
                  <Badge className={getPlanColor(company.plan)}>
                    {company.plan}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Configurações do Chatbot */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center">
                  <Bot className="h-4 w-4 mr-2" />
                  Configuração do Chatbot
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dify App:</span>
                    <span className="font-mono text-xs">
                      {company.dify_api_key ? '✅ Configurado' : '❌ Pendente'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">WhatsApp:</span>
                    <span className="text-xs">
                      {company.whatsapp_sessions && company.whatsapp_sessions.length > 0 ? 
                        `✅ ${company.whatsapp_sessions[0].evolution_instance}` : 
                        '❌ Pendente'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Features Habilitadas */}
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Funcionalidades</h4>
                <div className="flex flex-wrap gap-1">
                  {company.features?.whatsapp && (
                    <Badge variant="outline" className="text-xs">WhatsApp</Badge>
                  )}
                  {company.features?.voice && (
                    <Badge variant="outline" className="text-xs">Áudio</Badge>
                  )}
                  {company.features?.calendar && (
                    <Badge variant="outline" className="text-xs">Agenda</Badge>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Conversas</div>
                    <div className="font-semibold">{company.conversations_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Mensagens</div>
                    <div className="font-semibold">{company.messages_count || 0}</div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.location.href = `/dashboard/companies/${company.id}`}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.location.href = `/dashboard/companies/${company.id}?tab=conversations`}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Conversas
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🤖 Sistema Multi-Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Isolamento Completo:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Cada empresa = 1 chatbot independente</li>
                <li>• Própria chave API do Dify</li>
                <li>• Própria instância WhatsApp</li>
                <li>• Conversas totalmente separadas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Funcionalidades por Cliente:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Configurações específicas de áudio</li>
                <li>• Planos e recursos diferenciados</li>
                <li>• Métricas individuais</li>
                <li>• Billing separado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar nova empresa */}
      <AddCompanyModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          fetchCompanies(); // Recarregar lista de empresas
          setShowAddModal(false);
        }}
      />
    </div>
  );
}