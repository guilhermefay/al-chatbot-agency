'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, MessageCircle, Settings, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/types/database'

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa cadastrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece adicionando sua primeira empresa.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <Card key={company.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{company.name}</CardTitle>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  company.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : company.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {company.status === 'active' ? 'Ativo' : company.status === 'inactive' ? 'Inativo' : 'Suspenso'}
              </span>
            </div>
            <CardDescription>{company.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Building2 className="mr-2 h-4 w-4" />
                Plano: {company.plan}
              </div>
              {company.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {company.phone}
                </div>
              )}
            </div>
            <div className="mt-4 flex space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Configurar
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}