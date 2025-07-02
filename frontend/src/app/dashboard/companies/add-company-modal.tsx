'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { X, User, CheckCircle } from 'lucide-react';

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
    whatsapp: '',
    plan: 'basic'
  });

  const handleNext = () => {
    if (step === 1) {
      // Validação básica
      if (!companyData.name || !companyData.email || !companyData.whatsapp) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Criar empresa
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...companyData,
          status: 'active'
        })
      });

      if (!response.ok) throw new Error('Erro ao criar empresa');
      
      setStep(3);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCompanyData({
      name: '',
      email: '',
      whatsapp: '',
      plan: 'basic'
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
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold">Adicionar Novo Cliente & Chatbot</h2>
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
                <span className="text-sm font-medium">Integração</span>
              </div>
              <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Concluído</span>
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
                    placeholder="Ex: Guilherme Fay"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                    placeholder="Ex: guilhermefay@hotmail.com"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">Telefone WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={companyData.whatsapp}
                    onChange={(e) => setCompanyData({...companyData, whatsapp: e.target.value})}
                    placeholder="Ex: 34991533667"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configurar APIs
                  </h3>
                  <p className="text-gray-600">
                    Configure as chaves API do Dify e Evolution para {companyData.name}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chatbot Criado!
                </h3>
                <p className="text-gray-600 mb-4">
                  {companyData.name} foi adicionado com sucesso
                </p>
                <p className="text-sm text-gray-500">
                  Configure as APIs na aba <strong>Integrações</strong>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            
            {step === 1 && (
              <Button onClick={handleNext}>
                Próximo
              </Button>
            )}
            
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Chatbot'}
              </Button>
            )}
            
            {step === 3 && (
              <Button onClick={() => { onSuccess(); handleClose(); }}>
                Concluir
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 