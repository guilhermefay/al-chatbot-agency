'use client';

import { useState, useEffect } from 'react';
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentConversations } from '@/components/dashboard/recent-conversations'
import { DifyStats } from '@/components/dashboard/dify-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Users, 
  Bot, 
  MessageSquare, 
  Settings,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
  dify_api_key: string;
  whatsapp_sessions?: any[];
  conversations_count?: number;
}

export default function DashboardPage() {
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchTopCompanies();
  }, []);

  const fetchTopCompanies = async () => {
    try {
      // Buscar top 6 empresas por atividade
      const { data, error, count } = await supabase
        .from('companies')
        .select(`
          *,
          whatsapp_sessions(*),
          conversations(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      const processedData = (data || []).map((company: any) => ({
        ...company,
        conversations_count: company.conversations?.length || 0
      }));

      setTopCompanies(processedData);
      setTotalCompanies(count || 0);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Multi-Tenant</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus chatbots e clientes em um só lugar
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => window.location.href = '/dashboard/companies'}>
            <Users className="h-4 w-4 mr-2" />
            Ver Todos Clientes ({totalCompanies})
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/companies'}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cliente
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <DashboardStats />

      {/* Clientes Recentes */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Clientes Ativos</h2>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/dashboard/companies'}
          >
            Ver Todos
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topCompanies.map((company) => (
            <Card 
              key={company.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/dashboard/companies/${company.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {company.email}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={`${
                      company.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {company.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Status das Integrações */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Dify IA:</span>
                  {company.dify_api_key ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ativo
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Pendente
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">WhatsApp:</span>
                  {company.whatsapp_sessions && company.whatsapp_sessions.length > 0 ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Conectado
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-500">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Pendente
                    </div>
                  )}
                </div>

                {/* Estatísticas */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {company.conversations_count || 0}
                      </div>
                      <div className="text-xs text-gray-600">Conversas</div>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-blue-100 text-blue-800">
                        {company.plan}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Botão de ação */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/dashboard/companies/${company.id}`;
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {topCompanies.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum cliente ainda
              </h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando seu primeiro cliente para criar um chatbot
              </p>
              <Button onClick={() => window.location.href = '/dashboard/companies'}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estatísticas Específicas do Dify */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Integração Dify AI</h2>
        <DifyStats />
      </div>

      {/* Conversas Recentes */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Atividade Recente</h2>
        <RecentConversations />
      </div>
    </div>
  )
}