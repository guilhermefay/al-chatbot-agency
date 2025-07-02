'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Database, Bot, TrendingUp, Users, FileText, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';

interface DifyStats {
  conversations: {
    total: number;
    today: number;
    with_dify: number;
  };
  datasets: {
    total: number;
    documents: number;
  };
  messages: {
    total: number;
    today: number;
    feedback_positive: number;
    feedback_negative: number;
  };
  integration_health: 'healthy' | 'warning' | 'error';
}

export function DifyStats() {
  const [stats, setStats] = useState<DifyStats | null>(null);
  const [loading, setLoading] = useState(true);

  // TODO: Pegar company_id do contexto/auth
  const COMPANY_ID = 'your-company-id';
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const loadStats = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas de conversas
      const conversationsResponse = await fetch(`${API_BASE}/conversations?company_id=${COMPANY_ID}&limit=1000`);
      const conversationsData = await conversationsResponse.json();
      
      // Buscar estatísticas de datasets
      const datasetsResponse = await fetch(`${API_BASE}/documents/datasets?company_id=${COMPANY_ID}&limit=1000`);
      const datasetsData = await datasetsResponse.json();
      
      // Buscar estatísticas de documentos
      const documentsResponse = await fetch(`${API_BASE}/documents/stats?company_id=${COMPANY_ID}`);
      const documentsData = await documentsResponse.json();

      // Processar dados
      const conversations = conversationsData.success ? conversationsData.data : [];
      const datasets = datasetsData.success ? datasetsData.data : [];
      
      const today = new Date().toISOString().split('T')[0];
      const conversationsToday = conversations.filter((conv: any) => 
        conv.created_at.startsWith(today)
      ).length;
      
      const conversationsWithDify = conversations.filter((conv: any) => 
        conv.dify_conversation_id
      ).length;

      const totalDocuments = datasets.reduce((acc: number, dataset: any) => 
        acc + (dataset.local_documents?.length || 0), 0
      );

      // Simular estatísticas de mensagens (em um cenário real, você faria uma chamada API específica)
      const messagesStats = {
        total: conversations.reduce((acc: number, conv: any) => acc + conv.message_count, 0),
        today: Math.floor(conversationsToday * 3.5), // Estimativa
        feedback_positive: Math.floor(conversations.length * 0.7),
        feedback_negative: Math.floor(conversations.length * 0.1)
      };

      setStats({
        conversations: {
          total: conversations.length,
          today: conversationsToday,
          with_dify: conversationsWithDify
        },
        datasets: {
          total: datasets.length,
          documents: totalDocuments
        },
        messages: messagesStats,
        integration_health: conversationsWithDify > 0 ? 'healthy' : 'warning'
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas do Dify:', error);
      setStats({
        conversations: { total: 0, today: 0, with_dify: 0 },
        datasets: { total: 0, documents: 0 },
        messages: { total: 0, today: 0, feedback_positive: 0, feedback_negative: 0 },
        integration_health: 'error'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const integrationColor = {
    healthy: 'text-green-600 border-green-200 bg-green-50',
    warning: 'text-yellow-600 border-yellow-200 bg-yellow-50',
    error: 'text-red-600 border-red-200 bg-red-50'
  };

  const integrationText = {
    healthy: '✅ Integração Ativa',
    warning: '⚠️ Parcialmente Integrado',
    error: '❌ Sem Integração'
  };

  return (
    <div className="space-y-6">
      {/* Header com Status da Integração */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Dify AI Platform
              </CardTitle>
              <CardDescription>
                Gestão de conversas inteligentes e bases de conhecimento
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={integrationColor[stats.integration_health]}
              >
                {integrationText[stats.integration_health]}
              </Badge>
              <Link href="/dashboard/dify">
                <Button size="sm">Gerenciar</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Dify</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.with_dify}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.conversations.total} total ({Math.round((stats.conversations.with_dify / Math.max(stats.conversations.total, 1)) * 100)}%)
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                +{stats.conversations.today} hoje
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Mensagens */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens IA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.messages.today} hoje
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">{stats.messages.feedback_positive}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsDown className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">{stats.messages.feedback_negative}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bases de Conhecimento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bases de Conhecimento</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.datasets.total}</div>
            <p className="text-xs text-muted-foreground">
              datasets ativos
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {stats.datasets.documents} documentos
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Qualidade da IA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade IA</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.messages.feedback_positive / Math.max(stats.messages.feedback_positive + stats.messages.feedback_negative, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              feedback positivo
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="outline" 
                className={stats.messages.feedback_positive > stats.messages.feedback_negative 
                  ? 'text-green-600 border-green-200' 
                  : 'text-yellow-600 border-yellow-200'
                }
              >
                {stats.messages.feedback_positive > stats.messages.feedback_negative ? '🎯 Excelente' : '⚡ Melhorando'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas - Dify</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/dify?tab=conversations">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver Conversas
              </Button>
            </Link>
            <Link href="/dashboard/dify?tab=datasets">
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Gerenciar Datasets
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start" onClick={loadStats}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Atualizar Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 