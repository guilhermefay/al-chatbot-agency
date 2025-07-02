'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Building, 
  MessageSquare, 
  FileText, 
  Settings,
  Bot,
  Database
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard Multi-Tenant',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral dos clientes'
  },
  {
    name: 'Clientes & Chatbots',
    href: '/dashboard/companies',
    icon: Building,
    description: 'Gerenciar todos os clientes'
  },
  {
    name: 'Conversas Globais',
    href: '/dashboard/conversations',
    icon: MessageSquare,
    description: 'Todas as conversas'
  },
  {
    name: 'Gestão Dify',
    href: '/dashboard/dify',
    icon: Bot,
    description: 'Conversas, Datasets e IA'
  },
  {
    name: 'Integrações Master',
    href: '/dashboard/integrations',
    icon: Settings,
    description: 'APIs e webhooks'
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold">AL Chatbot</h1>
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <div className="flex-1">
                    {item.name}
                    {item.description && (
                      <div className="text-xs opacity-70">{item.description}</div>
                    )}
                  </div>
                  {item.name === 'Gestão Dify' && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      ✅
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  )
}