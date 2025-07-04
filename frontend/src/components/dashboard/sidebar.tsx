'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Settings, 
  MessageSquare, 
  Cog
} from 'lucide-react'

// Sidebar limpo com 3 abas essenciais
const navigation = [
  {
    name: 'Clientes',
    href: '/dashboard/companies',
    icon: Users,
    description: 'Gerenciar clientes e chatbots'
  },
  {
    name: 'Conversas',
    href: '/dashboard/conversations',
    icon: MessageSquare,
    description: 'Histórico de chats'
  },
  {
    name: 'Configurações',
    href: '/dashboard/settings',
    icon: Cog,
    description: 'Settings do sistema'
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-green-600">AL Studio</h1>
        <span className="ml-2 text-sm text-gray-500">Hub</span>
      </div>
      <nav className="flex-1 px-4 py-6">
        <div className="mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Gerenciamento
          </h2>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/dashboard/companies' && pathname.startsWith('/dashboard/companies'));
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-green-50 text-green-700 border-l-2 border-green-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-green-600" : "text-gray-400")} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="px-3 py-2">
            <div className="text-xs text-gray-500">
              <div className="font-medium">Hub de Integrações</div>
              <div>Conecte WhatsApp, IA e CRM</div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}