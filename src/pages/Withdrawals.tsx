import React, { useState } from 'react'
import {
  ArrowRightLeft,
  Info,
  Lock,
  Wallet,
  ShieldCheck,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'

export const WithdrawalsPage: React.FC = () => {
  const [rawAmount, setRawAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('cpf')
  const [pixKey, setPixKey] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [gateNotice, setGateNotice] = useState<string | null>(null)

  const handleAmountChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '')
    if (!digitsOnly) {
      setRawAmount('')
      return
    }
    const cents = parseInt(digitsOnly, 10)
    setRawAmount(formatCurrency(cents))
  }

  const handleAttemptWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    setGateNotice(
      'Em breve: saques DePix para Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
    )
  }

  const getPixKeyPlaceholder = () => {
    switch (pixKeyType) {
      case 'cpf':
        return '000.000.000-00'
      case 'cnpj':
        return '00.000.000/0000-00'
      case 'email':
        return 'seu-email@exemplo.com'
      case 'phone':
        return '(11) 99999-9999'
      case 'random':
        return 'Chave aleatória EVP (ex: 123e4567-e89b...)'
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Banner Oficial de Integração Pendente */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-4 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-[#663C00]">
              Em breve: saques DePix para Pix. Estamos finalizando nossa integração com a provedora
              de pagamentos.
            </p>
            <p className="text-xs text-[#8F5900] mt-1">
              Você envia DePix da sua carteira Liquid para o endereço do saque e o valor equivalente
              cai na chave Pix informada.
            </p>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Saques DePix → Pix
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            Converta e envie seus DePix da rede Liquid diretamente para qualquer conta bancária via
            Pix nacional.
          </p>
        </div>
      </div>

      {gateNotice && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-medium">{gateNotice}</span>
          </div>
          <button
            onClick={() => setGateNotice(null)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* Formulário de Saque */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#E6E4DD] pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#C5A059] border border-[#D6D0C5] flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#141413]">
                Solicitar Saque DePix → Pix
              </h2>
              <p className="text-xs text-[#73726C]">
                Liquidação rápida na sua conta bancária sem custódia intermediária.
              </p>
            </div>
          </div>
        </div>

        {/* Texto explicativo obrigatório do modelo não custodial */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E4DD] text-xs text-[#57564F] space-y-1.5">
          <div className="font-semibold text-[#141413] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            Como funciona a operação:
          </div>
          <p className="leading-relaxed">
            Você envia DePix da sua carteira Liquid para o endereço do saque e o valor equivalente
            cai na chave Pix informada.
          </p>
          <p className="text-[11px] text-[#8C8A7B]">
            Conversão direta na paridade 1 DePix = 1 BRL (subtraídas apenas as taxas oficiais da
            rede e provedora).
          </p>
        </div>

        <form onSubmit={handleAttemptWithdraw} className="space-y-5">
          {/* Valor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
              Valor a Sacar (R$) *
            </Label>
            <Input
              type="text"
              required
              placeholder="R$ 0,00"
              value={rawAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-base font-mono font-medium text-[#141413] rounded-lg h-12"
            />
            <p className="text-[11px] text-[#73726C]">
              Informe o valor em reais correspondente à quantidade de tokens DePix que serão
              enviados.
            </p>
          </div>

          {/* Tipo e Chave Pix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                Tipo de Chave Pix *
              </Label>
              <Select
                value={pixKeyType}
                onValueChange={(val) =>
                  setPixKeyType(val as 'cpf' | 'cnpj' | 'email' | 'phone' | 'random')
                }
              >
                <SelectTrigger className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] h-11 rounded-lg">
                  <SelectValue placeholder="Tipo de Chave" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                Chave Pix de Destino *
              </Label>
              <Input
                type="text"
                required
                placeholder={getPixKeyPlaceholder()}
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-[#FAF8F5] border-[#D6D0C5] text-xs font-mono text-[#141413] rounded-lg h-11"
              />
            </div>
          </div>

          {/* Nome do Favorecido */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
              Nome do Favorecido (Opcional)
            </Label>
            <Input
              type="text"
              placeholder="Nome completo do titular da conta bancária"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] rounded-lg h-11"
            />
          </div>

          {/* Gate e Botão */}
          <div className="pt-4 border-t border-[#E6E4DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#73726C]">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Em breve: saques DePix para Pix. Estamos finalizando nossa integração.</span>
            </div>

            <Button
              type="submit"
              className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs h-11 px-6 shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Solicitar Saque
            </Button>
          </div>
        </form>
      </div>

      {/* Histórico Recente de Saques / Estado Vazio Elegante */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#141413]">Histórico de Saques</h3>
            <p className="text-xs text-[#73726C]">
              Acompanhe as conversões de DePix para Pix efetuadas em sua conta
            </p>
          </div>
        </div>

        {/* Estado vazio elegante */}
        <div className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
            <ArrowRightLeft className="w-7 h-7 text-[#C5A059]" />
          </div>
          <div>
            <h4 className="font-serif text-base font-bold text-[#141413]">
              Nenhum saque realizado
            </h4>
            <p className="text-xs text-[#73726C] max-w-md mx-auto mt-1">
              Os saques só existirão em produção. Quando a integração for liberada, seus envios de
              DePix para contas bancárias Pix aparecerão detalhados aqui com comprovantes e
              confirmações da rede Liquid.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WithdrawalsPage
