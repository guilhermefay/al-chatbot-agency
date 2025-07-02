'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, User, CheckCircle, Bot, Key } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCompanyModal({ isOpen, onClose, onSuccess }: AddCompanyModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dados da empresa
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    dify_api_key: ''
  });

  const supabase = createClient();

  const handleNext = () => {
    if (step === 1) {
      if (!companyData.name || !companyData.email) {
        alert('Preencha nome e email da empresa');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validar Dify API Key
      if (!companyData.dify_api_key) {
        alert('API Key do Dify é obrigatória');
        setLoading(false);
        return;
      }

      // Criar empresa no Supabase
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone,
          status: 'active',
          dify_api_key: companyData.dify_api_key,
          features: {
            whatsapp: true,
            voice: false,
            dify: true
          }
        }])
        .select()
        .single();

      if (error) throw error;
      
      setStep(3);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar empresa: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCompanyData({
      name: '',
      email: '',
      phone: '',
      dify_api_key: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold">Novo Cliente + Chatbot Dify</h2>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <span className="text-sm font-medium">Dados</span>
              </div>
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Dify API</span>
              </div>
              <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Pronto</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                    placeholder="Ex: Guilherme Fay Consultoria"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                    placeholder="Ex: contato@empresa.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone WhatsApp (Opcional)</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
                    placeholder="Ex: 34991533667"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Será conectado depois na aba Integrações
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configurar Dify API
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Cole sua API Key do Dify para integrar o chatbot
                  </p>
                </div>

                <div>
                  <Label htmlFor="dify_api_key">Dify API Key *</Label>
                  <Input
                    id="dify_api_key"
                    value={companyData.dify_api_key}
                    onChange={(e) => setCompanyData({...companyData, dify_api_key: e.target.value})}
                    placeholder="app-xxxxxxxxxxxxxxxxxxxxxx"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Exemplo: app-oDEcLLCXulN9PZccPXEDJD4q
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Como obter a API Key:</h4>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                    <li>Acesse <strong>dify.ai</strong></li>
                    <li>Vá em <strong>API de Serviço</strong></li>
                    <li>Copie a chave que começa com "app-"</li>
                  </ol>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🎉 Chatbot Criado!
                </h3>
                <p className="text-gray-600 mb-4">
                  <strong>{companyData.name}</strong> foi configurado com sucesso
                </p>
                <p className="text-sm text-gray-500">
                  ✅ Dify integrado<br/>
                  ✅ Cliente adicionado<br/>
                  🔄 WhatsApp pendente (próximo passo)
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            {step > 1 && step < 3 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            
            {step < 2 && (
              <Button onClick={handleNext} className="ml-auto">
                Próximo
              </Button>
            )}
            
            {step === 2 && (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="ml-auto"
              >
                {loading ? 'Criando...' : '🚀 Criar Chatbot'}
              </Button>
            )}
            
            {step === 3 && (
              <Button onClick={handleClose} className="ml-auto">
                Finalizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 