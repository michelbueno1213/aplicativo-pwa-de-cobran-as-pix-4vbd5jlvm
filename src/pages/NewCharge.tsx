import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { chargesService } from '@/services/charges'
import { customersService, type CustomerRecord } from '@/services/customers'
import { validatePixKey } from '@/lib/formatters'
import {
  ArrowLeft,
  QrCode,
  AlertTriangle,
  User,
  DollarSign,
  KeyRound,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const NewCharge: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [customerName, setCustomerName] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [pixKey, setPixKey] = useState(user?.pix_key || '')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'simulated' | 'real'>('simulated')

  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Carregar lista de clientes para sugestão
  useEffect(() => {
    customersService
      .getAll()
      .then(setCustomers)
      .catch(() => {})
  }, [])

  // Se o usuário tiver chave padrão salva e o campo estiver vazio, preenche
  useEffect(() => {
    if (!pixKey && user?.pix_key) {
      setPixKey(user.pix_key)
    }
  }, [user?.pix_key])

  // Formatação de valor em R$ enquanto digita
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (!value) {
      setAmountRaw('')
      return
    }
    const cents = parseInt(value, 10)
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setAmountRaw(formatted)
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }))
  }

  const handleSelectCustomer = (cust: CustomerRecord) => {
    setCustomerName(cust.name)
    if (cust.pix_key) setPixKey(cust.pix_key)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}

    if (!customerName.trim()) {
      newErrors.customerName = 'Informe o nome do cliente'
    }

    const cleanAmount = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0
    if (cleanAmount <= 0) {
      newErrors.amount = 'O valor mínimo é R$ 0,01'
    }

    const effectivePixKey = pixKey.trim() || user?.pix_key || ''
    if (!effectivePixKey) {
      newErrors.pixKey = 'Informe uma chave Pix válida ou cadastre uma chave padrão'
    } else {
      const pixCheck = validatePixKey(effectivePixKey)
      if (!pixCheck.valid) {
        newErrors.pixKey =
          'Formato de chave Pix inválido (e-mail, CPF, CNPJ, telefone ou aleatória)'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const created = await chargesService.create({
        customer_name: customerName.trim(),
        amount_cents: cleanAmount,
        pix_key: effectivePixKey,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
      })

      navigate(`/cobrancas/${created.id}`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ general: err.message || 'Erro ao gerar cobrança' })
      } else {
        setErrors({ general: 'Falha ao comunicar com o servidor' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Botão Voltar */}
      <div>
        <Link
          to="/cobrancas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Cobranças
        </Link>
      </div>

      {/* Cartão do Formulário */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-sm">
        <div className="pb-5 mb-6 border-b border-[#E6E1D8]">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1916]">
            Nova Cobrança Pix
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6760] mt-1">
            Preencha os dados do cliente e o valor para emitir o link Pix imediato
          </p>
        </div>

        {errors.general && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#B3261E] text-xs font-medium">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome do Cliente */}
          <div className="space-y-1.5">
            <Label
              htmlFor="customerName"
              className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]"
            >
              Nome do Cliente *
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                <User className="h-4 w-4" />
              </div>
              <Input
                id="customerName"
                type="text"
                placeholder="Ex: João Silva ou Empresa LTDA"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value)
                  if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }))
                }}
                className={`pl-10 h-12 bg-[#FAF8F3] border ${
                  errors.customerName ? 'border-[#B3261E]' : 'border-[#D6D0C5]'
                } text-[#1A1916] rounded-xl`}
              />
            </div>
            {errors.customerName && (
              <p className="text-xs text-[#B3261E] mt-1">{errors.customerName}</p>
            )}

            {/* Sugestões de clientes existentes */}
            {customers.length > 0 && !customerName && (
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#6B6760]">Clientes salvos:</span>
                {customers.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1EFEA] hover:bg-[#E6E1D8] text-[#1A1916] transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Valor (R$) */}
          <div className="space-y-1.5">
            <Label
              htmlFor="amount"
              className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]"
            >
              Valor da Cobrança (R$) *
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-serif font-bold text-base text-[#8C6A3F]">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountRaw}
                onChange={handleAmountChange}
                className={`pl-12 h-12 bg-[#FAF8F3] font-serif text-lg font-bold border ${
                  errors.amount ? 'border-[#B3261E]' : 'border-[#D6D0C5]'
                } text-[#1A1916] rounded-xl`}
              />
            </div>
            {errors.amount && <p className="text-xs text-[#B3261E] mt-1">{errors.amount}</p>}
          </div>

          {/* Chave Pix */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="pixKey"
                className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]"
              >
                Chave Pix de Recebimento *
              </Label>
              {user?.pix_key && (
                <button
                  type="button"
                  onClick={() => setPixKey(user.pix_key || '')}
                  className="text-xs text-[#C9A227] hover:underline font-medium"
                >
                  Usar chave padrão
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                <KeyRound className="h-4 w-4" />
              </div>
              <Input
                id="pixKey"
                type="text"
                placeholder="E-mail, CPF, celular ou chave aleatória"
                value={pixKey}
                onChange={(e) => {
                  setPixKey(e.target.value)
                  if (errors.pixKey) setErrors((prev) => ({ ...prev, pixKey: '' }))
                }}
                className={`pl-10 h-12 bg-[#FAF8F3] border ${
                  errors.pixKey ? 'border-[#B3261E]' : 'border-[#D6D0C5]'
                } text-[#1A1916] rounded-xl`}
              />
            </div>
            {!pixKey && user?.pix_key && (
              <p className="text-[11px] text-[#8C6A3F]">
                Será usada a chave padrão do seu cadastro ({user.pix_key})
              </p>
            )}
            {errors.pixKey && <p className="text-xs text-[#B3261E] mt-1">{errors.pixKey}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label
              htmlFor="description"
              className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]"
            >
              Descrição (Opcional)
            </Label>
            <div className="relative">
              <div className="absolute top-3.5 left-3.5 pointer-events-none text-[#8C6A3F]">
                <FileText className="h-4 w-4" />
              </div>
              <textarea
                id="description"
                rows={2}
                placeholder="Ex: Consultoria técnica / Parcela 1 de 3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F3] border border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
              />
            </div>
          </div>

          {/* Modo de Cobrança */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
              Modo de Cobrança
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-[#C9A227] bg-[#FFF3E0]/40 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="simulated"
                  checked={paymentMethod === 'simulated'}
                  onChange={() => setPaymentMethod('simulated')}
                  className="text-[#C9A227] focus:ring-[#C9A227]"
                />
                <div>
                  <span className="text-xs font-bold text-[#1A1916] block">Simulado (padrão)</span>
                  <span className="text-[10px] text-[#8C6A3F]">Fluxo de teste completo</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-[#D6D0C5] bg-[#F1EFEA] opacity-60 cursor-not-allowed">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="real"
                  disabled
                  className="text-gray-400"
                />
                <div>
                  <span className="text-xs font-bold text-[#6B6760] block">Real (provedora)</span>
                  <span className="text-[10px] text-[#8C6A3F]">Aguardando conexão</span>
                </div>
              </label>
            </div>
          </div>

          {/* Botão Submeter */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-sm tracking-wide rounded-xl shadow-md border-0"
            >
              {loading ? 'Gerando link...' : 'Gerar Cobrança'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCharge
