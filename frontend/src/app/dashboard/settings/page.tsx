'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Server, Bell, Shield, Info } from 'lucide-react'
import { toast } from 'sonner'

// Componente Switch simples
function Switch({ 
  id, 
  checked, 
  onCheckedChange 
}: { 
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void 
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${checked ? 'bg-green-600' : 'bg-gray-200'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Configurações básicas do sistema
    company_name: 'AL Studio',
    support_email: 'suporte@alstudio.com',
    webhook_url: '',
    
    // Notificações
    email_notifications: true,
    webhook_notifications: false,
    
    // Backup e segurança
    auto_backup: true,
    retention_days: 30,
    
    // Sistema
    debug_mode: false,
    log_level: 'info'
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      // Simular salvamento (implementar com backend depois)
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações básicas da plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Tudo'}
        </Button>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Configurações gerais da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                placeholder="AL Studio"
              />
            </div>
            <div>
              <Label htmlFor="support_email">Email de Suporte</Label>
              <Input
                id="support_email"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({...settings, support_email: e.target.value})}
                placeholder="suporte@alstudio.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks e APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-green-600" />
            Webhooks e APIs
          </CardTitle>
          <CardDescription>
            Configurações de integração externa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook_url">URL de Webhook Global</Label>
            <Input
              id="webhook_url"
              value={settings.webhook_url}
              onChange={(e) => setSettings({...settings, webhook_url: e.target.value})}
              placeholder="https://seu-sistema.com/webhook"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL para receber notificações de eventos importantes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-orange-600" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como você quer receber alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Notificações por Email</Label>
              <p className="text-sm text-gray-500">Receber alertas importantes por email</p>
            </div>
            <Switch
              id="email_notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
            />
          </div>
          
          <div className="border-t border-gray-200 my-4"></div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="webhook_notifications">Notificações via Webhook</Label>
              <p className="text-sm text-gray-500">Enviar eventos para webhook configurado</p>
            </div>
            <Switch
              id="webhook_notifications"
              checked={settings.webhook_notifications}
              onCheckedChange={(checked) => setSettings({...settings, webhook_notifications: checked})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup e Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Backup e Segurança
          </CardTitle>
          <CardDescription>
            Configurações de segurança e backup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_backup">Backup Automático</Label>
              <p className="text-sm text-gray-500">Fazer backup automático dos dados</p>
            </div>
            <Switch
              id="auto_backup"
              checked={settings.auto_backup}
              onCheckedChange={(checked) => setSettings({...settings, auto_backup: checked})}
            />
          </div>
          
          <div>
            <Label htmlFor="retention_days">Retenção de Dados (dias)</Label>
            <Input
              id="retention_days"
              type="number"
              value={settings.retention_days}
              onChange={(e) => setSettings({...settings, retention_days: parseInt(e.target.value)})}
              placeholder="30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Por quantos dias manter conversas antigas
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
          <CardDescription>
            Informações sobre o funcionamento da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="text-sm font-medium">Sistema</div>
              <div className="text-xs text-gray-500">Online</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">🔗</div>
              <div className="text-sm font-medium">Integrações</div>
              <div className="text-xs text-gray-500">Funcionando</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">📊</div>
              <div className="text-sm font-medium">Database</div>
              <div className="text-xs text-gray-500">Conectado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 