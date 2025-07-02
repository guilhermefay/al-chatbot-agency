'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testConnection = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1)
      setResult(JSON.stringify({ data, error }, null, 2))
    } catch (err) {
      setResult(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'guilhermeefay@gmail.com',
        password: 'Orygen@2023'
      })
      setResult(JSON.stringify({ data, error }, null, 2))
    } catch (err) {
      setResult(JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Supabase</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>

        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded ml-4"
        >
          {loading ? 'Testando...' : 'Testar Login'}
        </button>
      </div>

      <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
        {result || 'Clique em um botão para testar...'}
      </pre>
    </div>
  )
} 