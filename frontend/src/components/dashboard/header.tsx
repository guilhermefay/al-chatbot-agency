'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logout realizado com sucesso')
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-md">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">Painel de Controle</h2>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <User className="h-6 w-6" />
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  )
}