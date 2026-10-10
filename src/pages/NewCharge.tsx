import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { chargesService } from '@/services/charges'
import { liquidWalletsService, LiquidWalletRecord } from '@/services/liquidWallets'
import { customersService, CustomerRecord } from '@/services/customers'
import { validateLiquidAddress, formatCurrency } from '@/lib/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

export const NewCharge: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  // Estado do formulário
  const [amountStr, setAmountStr] = useState('')
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [customLiquidAddress, setCustomLiquidAddress] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [description, setDescription] = useState('')

  // Listas auxiliares
  const [wallets, setWallets] = useState<LiquidWalletRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loadingInitial, setLoadingInitial] = useState(true)

  // Submissão
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status da integração no backend
  const [integrationReady, setIntegrationReady] = useState(false)
  const [integrationMessage, setIntegrationMessage] = useState(
    'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
  )

  // Modo de homologação (exclusivo para admins testarem sem afetar produção)
  const [isHomologationMode, setIsHomologationMode] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [walletsRes, customersRes, statusRes] = await Promise.all([
          liquidWalletsService.list(),
          customersService.list({ page: 1, perPage: 100 }),
          chargesService.checkIntegrationStatus(),
        ])

        setWallets(walletsRes)
        setCustomers(customersRes.items)
        setIntegrationReady(statusRes.ready)
        if (statusRes.message) {
          setIntegrationMessage(statusRes.message)
        }

        // Selecionar carteira padrão se houver
        const defaultWallet = walletsRes.find((w) => w.is_default) || walletsRes[0]
        if (defaultWallet) {
          setSelectedWalletId(defaultWallet.id)
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [])

  // Atualizar nome do cliente quando selecionado da lista
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id)
    if (id === 'new') {
      setCustomerName('')
    } else {
      const selected = customers.find((c) => c.id === id)
      if (selected) {
        setCustomerName(selected.name)
      }
    }
  }

  // Obter o endereço Liquid efetivo
  const effectiveLiquidAddress =
    selectedWalletId === 'custom'
      ? customLiquidAddress.trim()
      : wallets.find((w) => w.id === selectedWalletId)?.address || ''

  // Formatação de valor em centavos
  const getAmountCents = () => {
    const clean = amountStr.replace(/\D/g, '')
    return parseInt(clean || '0', 10)
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    if (!rawValue) {
      setAmountStr('')
      return
    }
    const val = parseInt(rawValue, 10) / 100
    setAmountStr(
      val.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amountCents = getAmountCents()
    if (amountCents < 100) {
      setError('O valor mínimo para cobrança é de R$ 1,00.')
      return
    }

    if (!effectiveLiquidAddress) {
      setError('Selecione ou informe uma carteira Liquid de recebimento válida.')
      return
    }

    if (!validateLiquidAddress(effectiveLiquidAddress)) {
      setError('O endereço da carteira Liquid informado é inválido.')
      return
    }

    if (!customerName.trim()) {
      setError('Informe o nome do cliente pagador.')
      return
    }

    setSubmitting(true)

    try {
      // Se for admin em ambiente privado de homologação
      if (isAdmin && isHomologationMode) {
        const created = await chargesService.createSimulatedForAdmin({
          amount_cents: amountCents,
          liquid_address: effectiveLiquidAddress,
          liquid_wallet_id: selectedWalletId !== 'custom' ? selectedWalletId : undefined,
          customer_name: customerName.trim(),
          description: description.trim() || undefined,
        })
        navigate(`/cobrancas/${created.id}`)
        return
      }

      // Fluxo de Produção:
      // Se as credenciais reais da Eulen não estiverem ativas, a chamada lança a mensagem oficial exigida
      const created = await chargesService.create({
        amount_cents: amountCents,
        liquid_address: effectiveLiquidAddress,
        liquid_wallet_id: selectedWalletId !== 'custom' ? selectedWalletId : undefined,
        customer_name: customerName.trim(),
        description: description.trim() || undefined,
      })

      navigate(`/cobrancas/${created.id}`)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(
        e.message ||
          'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        onClick={() => navigate('/cobrancas')}
        className="text-[#57564F] hover:text-[#141413] -ml-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Voltar para Cobranças
      </Button>

      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
          Nova Cobrança Pix
        </h1>
        <p className="text-sm text-[#73726C] mt-1">
          O pagador realiza o Pix e você recebe DePix diretamente na sua carteira Liquid.
        </p>
      </div>

      {/* Banner oficial: aviso enquanto a integração está em fase final */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-5 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3.5">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-[#663C00]">
              Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a
              provedora de pagamentos.
            </h4>
            <p className="text-xs text-[#8F5900] leading-relaxed">
              O ROM é uma plataforma não custodial. A emissão de QR Codes Pix de produção é ativada
              de forma segura assim que o processo regulatório e a conexão de credenciais com a
              provedora Eulen forem concluídos.
            </p>
          </div>
        </div>
      </div>

      {/* Painel de Homologação exclusivo para Administradores */}
      {isAdmin && (
        <div className="p-4 rounded-xl border border-[#C5A059]/40 bg-[#FAF8F5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#C5A059]" />
            <div>
              <p className="text-xs font-semibold text-[#141413]">
                Ambiente de Testes / Homologação
              </p>
              <p className="text-[11px] text-[#73726C]">
                Acesso restrito ao administrador para validar a experiência de checkout.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsHomologationMode(!isHomologationMode)}
            className={`text-xs ${
              isHomologationMode
                ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                : 'border-[#D6D0C5] text-[#57564F]'
            }`}
          >
            {isHomologationMode ? 'Homologação Ativa' : 'Ativar Homologação'}
          </Button>
        </div>
      )}

      {/* Formulário de Cobrança */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 shadow-xs space-y-6">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-[#141413]">
              Valor da Cobrança (R$) *
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#8C8A7B]">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountStr}
                onChange={handleAmountChange}
                className="pl-12 text-2xl font-bold tracking-tight text-[#141413] h-14 bg-[#FAF8F5] border-[#D6D0C5] focus:border-[#C5A059]"
                required
              />
            </div>
            <p className="text-xs text-[#73726C]">
              O valor pago em reais será convertido 1:1 e entregue em DePix na rede Liquid.
            </p>
          </div>

          {/* Seleção de Carteira Liquid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-[#141413]">
                Carteira Liquid de Recebimento *
              </Label>
              <span className="text-xs text-[#C5A059] font-medium">Não custodial</span>
            </div>

            {loadingInitial ? (
              <div className="h-10 bg-[#FAF8F5] rounded-md animate-pulse border border-[#D6D0C5]" />
            ) : wallets.length > 0 ? (
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger className="bg-[#FAF8F5] border-[#D6D0C5] text-[#141413]">
                  <SelectValue placeholder="Selecione sua carteira Liquid" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.label} ({wallet.address.slice(0, 10)}...{wallet.address.slice(-6)})
                      {wallet.is_default && ' • Padrão'}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Informar outro endereço Liquid</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-[#8C8A7B]">
                Nenhuma carteira salva ainda. Digite o endereço Liquid abaixo:
              </p>
            )}

            {(selectedWalletId === 'custom' || wallets.length === 0) && (
              <div className="pt-2">
                <Input
                  type="text"
                  placeholder="ex: ex1q... ou lq1q... (endereço nativo Liquid)"
                  value={customLiquidAddress}
                  onChange={(e) => setCustomLiquidAddress(e.target.value)}
                  className="font-mono text-xs bg-[#FAF8F5] border-[#D6D0C5] text-[#141413] focus:border-[#C5A059]"
                  required
                />
                <p className="text-[11px] text-[#73726C] mt-1">
                  Certifique-se de que a carteira é compatível com DePix (Marina, Blockstream Green
                  ou SideSwap).
                </p>
              </div>
            )}
          </div>

          {/* Seleção / Cadastro do Cliente */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-[#141413]">Cliente / Pagador *</Label>
            {customers.length > 0 && (
              <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                <SelectTrigger className="bg-[#FAF8F5] border-[#D6D0C5] text-[#141413] mb-2">
                  <SelectValue placeholder="Selecionar cliente cadastrado (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Novo cliente</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.email ? `(${c.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              type="text"
              placeholder="Nome completo do cliente pagador"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-[#141413] focus:border-[#C5A059]"
              required
            />
          </div>

          {/* Descrição / Referência */}
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-sm font-semibold text-[#141413]">
              Descrição do Pagamento (Opcional)
            </Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="Ex: Pedido #1234, Prestação de Serviços, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-[#141413] focus:border-[#C5A059]"
            />
          </div>

          {/* Mensagem de Erro ou Bloqueio */}
          {error && (
            <Alert variant="destructive" className="border-red-300 bg-red-50 text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botão de Criação */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-base shadow-xs"
            >
              {submitting
                ? 'Processando solicitação...'
                : isHomologationMode && isAdmin
                  ? 'Gerar Cobrança de Teste (Homologação)'
                  : 'Gerar Cobrança Pix'}
            </Button>
            {!integrationReady && !isHomologationMode && (
              <p className="text-center text-xs text-[#73726C] mt-2 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8C8A7B]" />
                Emissão de links reais temporariamente bloqueada até validação da provedora.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default NewCharge
