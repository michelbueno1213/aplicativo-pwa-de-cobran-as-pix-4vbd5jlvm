import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chargesService, type ChargeRecord } from '@/services/charges'
import { customersService, type CustomerRecord } from '@/services/customers'
import { liquidWalletsService, type LiquidWalletRecord } from '@/services/liquidWallets'
import { formatCurrency, formatDateBr, maskAddress, validateLiquidAddress } from '@/lib/formatters'
import { PixQrCode } from '@/components/PixQrCode'
import { StatusBadge } from '@/components/StatusBadge'
import {
  ArrowLeft,
  QrCode,
  AlertTriangle,
  User,
  DollarSign,
  FileText,
  Wallet,
  Plus,
  Info,
  ShieldCheck,
  Sparkles,
  Check,
  Copy,
  Clock,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Exemplo de endereço demonstrativo Liquid/DePix caso o usuário queira preencher rápido no teste
const SAMPLE_LIQUID_ADDRESS =
  'ex1q9h6v3s8m5j2f0k4n7p1w9y8x6c4b2a0z8d7e6g5h4j3k2l1m0n9p8q7r6s5t4u3v2w1x'

export const NewCharge: React.FC = () => {
  const navigate = useNavigate()

  // Campos do formulário
  const [customerName, setCustomerName] = useState('')
  const [amountRaw, setAmountRaw] = useState('')
  const [description, setDescription] = useState('')

  // Carteiras Liquid
  const [wallets, setWallets] = useState<LiquidWalletRecord[]>([])
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')
  const [isManualAddress, setIsManualAddress] = useState(false)
  const [manualAddress, setManualAddress] = useState('')
  const [newWalletLabel, setNewWalletLabel] = useState('')
  const [saveWalletForFuture, setSaveWalletForFuture] = useState(true)

  // Clientes para sugestão
  const [customers, setCustomers] = useState<CustomerRecord[]>([])

  // Estado da geração / pós-geração
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [createdCharge, setCreatedCharge] = useState<ChargeRecord | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Carregar carteiras e clientes salvos
  useEffect(() => {
    let isMounted = true

    Promise.all([
      liquidWalletsService.list().catch(() => [] as LiquidWalletRecord[]),
      customersService.getAll().catch(() => [] as CustomerRecord[]),
    ]).then(([loadedWallets, loadedCustomers]) => {
      if (!isMounted) return
      setWallets(loadedWallets)
      setCustomers(loadedCustomers)
      setLoadingWallets(false)

      if (loadedWallets.length > 0) {
        // Seleciona a padrão ou a primeira
        const defaultWallet = loadedWallets.find((w) => w.is_default) || loadedWallets[0]
        setSelectedWalletId(defaultWallet.id)
        setIsManualAddress(false)
      } else {
        // Sem carteira cadastrada, abre direto o campo de novo endereço
        setIsManualAddress(true)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

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
  }

  // Cálculos do resumo pré-confirmação (fictícios claramente identificados)
  const amountCents = parseInt(amountRaw.replace(/\D/g, ''), 10) || 0
  // Estimativa de taxas fictícias: Provedora (ex: 0,99% mín R$ 0,50) e ROM (0,50%)
  const estimatedProviderFeeCents =
    amountCents > 0 ? Math.max(50, Math.round(amountCents * 0.0099)) : 0
  const estimatedRomFeeCents = amountCents > 0 ? Math.round(amountCents * 0.005) : 0
  const totalEstimatedFees = estimatedProviderFeeCents + estimatedRomFeeCents
  const estimatedNetDepixCents = Math.max(0, amountCents - totalEstimatedFees)

  // Endereço Liquid efetivo
  const effectiveLiquidAddress = isManualAddress
    ? manualAddress.trim()
    : wallets.find((w) => w.id === selectedWalletId)?.address || ''

  const handleUseSampleAddress = () => {
    setIsManualAddress(true)
    setManualAddress(SAMPLE_LIQUID_ADDRESS)
    if (errors.liquidAddress) {
      setErrors((prev) => ({ ...prev, liquidAddress: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}

    // Validação do valor (obrigatório)
    if (amountCents <= 0) {
      newErrors.amount = 'Informe um valor válido (mínimo R$ 0,01)'
    }

    // Validação da carteira Liquid (obrigatória)
    if (!effectiveLiquidAddress) {
      newErrors.liquidAddress =
        'Selecione uma carteira ou informe um novo endereço Liquid compatível com DePix'
    } else {
      const addrCheck = validateLiquidAddress(effectiveLiquidAddress)
      if (!addrCheck.valid) {
        newErrors.liquidAddress = addrCheck.reason || 'Endereço Liquid inválido'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      let finalWalletId = isManualAddress ? undefined : selectedWalletId

      // Se for endereço manual e o usuário optou por salvar
      if (isManualAddress && saveWalletForFuture && manualAddress.trim()) {
        try {
          const label =
            newWalletLabel.trim() ||
            `Carteira Liquid ${wallets.length + 1} (${maskAddress(manualAddress.trim())})`
          const savedWallet = await liquidWalletsService.create({
            label,
            address: manualAddress.trim(),
            is_default: wallets.length === 0,
          })
          setWallets((prev) => [savedWallet, ...prev])
          finalWalletId = savedWallet.id
        } catch {
          // Continua mesmo se não conseguir salvar a carteira
        }
      }

      // Cria a cobrança no ROM
      const created = await chargesService.create({
        customer_name: customerName.trim() || undefined,
        amount_cents: amountCents,
        liquid_address: effectiveLiquidAddress,
        liquid_wallet_id: finalWalletId,
        description: description.trim() || undefined,
        payment_method: 'simulated',
        provider_fee_cents: estimatedProviderFeeCents,
        rom_fee_cents: estimatedRomFeeCents,
        net_depix_amount_cents: estimatedNetDepixCents,
      })

      // Exibe a tela de resultado / detalhes pós-geração
      setCreatedCharge(created)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrors({ general: err.message || 'Erro ao gerar cobrança' })
      } else {
        setErrors({ general: 'Falha na comunicação com o servidor' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPixCode = () => {
    if (!createdCharge?.pix_copia_cola) return
    navigator.clipboard.writeText(createdCharge.pix_copia_cola)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  const handleCopyPaymentLink = () => {
    if (!createdCharge?.payment_link) return
    navigator.clipboard.writeText(createdCharge.payment_link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // =========================================================================
  // TELA PÓS-GERAÇÃO: QR Code Pix, Copia e Cola, valor, status e validade
  // =========================================================================
  if (createdCharge) {
    const copiaColaText =
      createdCharge.pix_copia_cola ||
      `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${createdCharge.id}520400005303986540${(
        createdCharge.amount_cents / 100
      ).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
        {/* Navegação topo */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCreatedCharge(null)
              setAmountRaw('')
              setDescription('')
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Criar outra cobrança
          </button>

          <Link
            to="/cobrancas"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
          >
            Ver todas as cobranças
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {/* Cartão de Sucesso da Cobrança Gerada */}
        <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header da Cobrança */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E6E1D8]">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A227]/15 border border-[#C9A227]/30 text-[#8C6A3F] text-[11px] font-semibold mb-2">
                <Sparkles className="w-3 h-3 text-[#C9A227]" />
                Cobrança Pix Gerada com Sucesso
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1916]">
                {createdCharge.customer_name
                  ? `Cobrança de ${createdCharge.customer_name}`
                  : 'Cobrança Pix Sem Identificação'}
              </h1>
              <p className="text-xs text-[#6B6760] mt-1">
                Apresente o QR Code ao pagador ou compartilhe o código Pix Copia e Cola
              </p>
            </div>
            <StatusBadge status={createdCharge.status} className="self-start sm:self-center" />
          </div>

          {/* Destaque de Valor, Status e Validade */}
          <div className="bg-[#FAF8F3] rounded-2xl border border-[#E6E1D8] p-5 text-center space-y-2">
            <span className="text-[11px] font-semibold text-[#8C6A3F] uppercase tracking-wider block">
              Valor da Cobrança Pix
            </span>
            <div className="font-serif text-3xl sm:text-4xl font-extrabold text-[#1A1916] tracking-tight">
              {formatCurrency(createdCharge.amount_cents)}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-[#6B6760] flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#8C6A3F]" />
                Válido até:
              </span>
              <strong className="text-[#1A1916] font-semibold">
                {formatDateBr(createdCharge.expires_at)}
              </strong>
              <span className="text-[#C9A227]">•</span>
              <span className="text-[#8C6A3F] font-medium">Prazo padrão de 24h</span>
            </div>

            <div className="pt-2 text-[11px] text-[#8C6A3F] border-t border-[#E6E1D8]/60 mt-3 flex items-center justify-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
              <span>
                Liquidação em DePix na carteira:{' '}
                <strong className="font-mono text-[#1A1916]">
                  {maskAddress(createdCharge.liquid_address)}
                </strong>
              </span>
            </div>
          </div>

          {/* QR Code Pix e Alerta de Modo Simulado */}
          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            <PixQrCode
              value={copiaColaText}
              size={220}
              isSimulated={createdCharge.payment_method === 'simulated'}
            />

            {/* Banner de Modo Simulado — Requisito 8: QR Code não contém dados reais */}
            <div className="max-w-md w-full p-3.5 rounded-xl bg-[#FFF3E0] border border-[#C9A227]/40 text-center">
              <p className="text-xs font-semibold text-[#8C6A3F] flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
                Modo Simulado Ativo
              </p>
              <p className="text-[11px] text-[#6B6760] mt-1 leading-relaxed">
                Este QR Code e o código Pix abaixo são <strong>estritamente fictícios</strong> para
                testes e validação de fluxo. Nenhum valor monetário real será debitado ou
                transferido.
              </p>
            </div>
          </div>

          {/* Código Pix Copia e Cola */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Código Pix Copia e Cola (Simulado)
              </Label>
              <span className="text-[10px] text-[#8C6A3F]">Payload seguro da provedora</span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                rows={3}
                value={copiaColaText}
                className="w-full p-3 bg-[#FAF8F3] border border-[#D6D0C5] rounded-xl text-xs font-mono text-[#1A1916] select-all focus:outline-none focus:ring-1 focus:ring-[#C9A227] leading-relaxed break-all resize-none"
              />
            </div>

            <Button
              type="button"
              onClick={handleCopyPixCode}
              className={`w-full h-11 text-xs font-semibold rounded-xl transition-all border-0 shadow-sm flex items-center justify-center gap-2 ${
                copiedCode
                  ? 'bg-[#2E7D32] hover:bg-[#2E7D32] text-white'
                  : 'bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] hover:from-[#F5D77F] hover:to-[#C9A227]'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  Código Pix Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Código Pix Copia e Cola
                </>
              )}
            </Button>
          </div>

          {/* Link de Pagamento Web (Opcional) */}
          {createdCharge.payment_link && (
            <div className="space-y-2 pt-2 border-t border-[#E6E1D8]">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Link de Pagamento Web (Simulado)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdCharge.payment_link}
                  className="flex-1 px-3.5 py-2.5 bg-[#FAF8F3] border border-[#D6D0C5] rounded-xl text-xs font-mono text-[#1A1916] select-all focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyPaymentLink}
                  className="h-10 px-4 text-xs border-[#D6D0C5] text-[#1A1916] hover:bg-[#FAF8F3]"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-[#2E7D32]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#8C6A3F]" />
                  )}
                  <span className="ml-1">{copiedLink ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Botões de Ação Finais */}
          <div className="pt-4 border-t border-[#E6E1D8] flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={() => navigate(`/cobrancas/${createdCharge.id}`)}
              className="flex-1 h-11 bg-[#1A1916] hover:bg-[#2D2820] text-[#FAF8F3] text-xs font-semibold rounded-xl border border-[#D6D0C5]/40 flex items-center justify-center gap-2"
            >
              Ver Detalhes Completos da Cobrança
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A227]" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreatedCharge(null)
                setAmountRaw('')
                setDescription('')
              }}
              className="h-11 border-[#D6D0C5] text-xs font-medium text-[#6B6760] hover:text-[#1A1916] hover:bg-[#FAF8F3] rounded-xl"
            >
              Nova Cobrança
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // FORMULÁRIO DE NOVA COBRANÇA PIX (COM RESUMO PRÉ-CONFIRMAÇÃO)
  // =========================================================================
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
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
        {/* Cabeçalho da Página */}
        <div className="pb-5 mb-6 border-b border-[#E6E1D8]">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F3] border border-[#D6D0C5] text-[#8C6A3F] text-[11px] font-semibold mb-2">
            <QrCode className="w-3 h-3 text-[#C9A227]" />
            Emissão Pix • Recebimento em DePix (Liquid)
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1916]">
            Nova Cobrança Pix
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6760] mt-1 leading-relaxed">
            Gere uma cobrança Pix com liquidação não custodial diretamente em DePix na sua carteira
            Liquid. O Pix da cobrança será emitido pela API da provedora parceira.
          </p>
        </div>

        {errors.general && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#B3261E] text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CAMPO 1: CARTEIRA LIQUID DE RECEBIMENTO (OBRIGATÓRIO) */}
          <div className="space-y-2 p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D8]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916] flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#8C6A3F]" />
                Carteira Liquid de Recebimento *
              </Label>
              <button
                type="button"
                onClick={handleUseSampleAddress}
                className="text-[11px] text-[#C9A227] hover:underline font-medium"
              >
                Preencher endereço de teste
              </button>
            </div>

            {/* Alternância: Carteira Cadastrada vs Novo Endereço */}
            {wallets.length > 0 && (
              <div className="flex items-center gap-2 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => setIsManualAddress(false)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    !isManualAddress
                      ? 'bg-[#1A1916] text-[#FAF8F3]'
                      : 'bg-white border border-[#D6D0C5] text-[#6B6760] hover:text-[#1A1916]'
                  }`}
                >
                  Carteira cadastrada ({wallets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualAddress(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isManualAddress
                      ? 'bg-[#1A1916] text-[#FAF8F3]'
                      : 'bg-white border border-[#D6D0C5] text-[#6B6760] hover:text-[#1A1916]'
                  }`}
                >
                  Informar novo endereço
                </button>
              </div>
            )}

            {/* Seletor de Carteira Cadastrada */}
            {!isManualAddress && wallets.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#D6D0C5] rounded-xl text-xs text-[#1A1916] font-medium focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label} — {maskAddress(w.address)} {w.is_default ? '(Padrão)' : ''}
                    </option>
                  ))}
                </select>

                <div className="text-[11px] text-[#6B6760] font-mono break-all bg-white p-2.5 rounded-lg border border-[#E6E1D8]">
                  <span className="text-[#8C6A3F] font-sans font-semibold block text-[10px] uppercase">
                    Endereço de destino DePix:
                  </span>
                  {wallets.find((w) => w.id === selectedWalletId)?.address ||
                    effectiveLiquidAddress}
                </div>
              </div>
            ) : (
              /* Informar Novo Endereço Liquid */
              <div className="space-y-3">
                <div>
                  <Input
                    type="text"
                    placeholder="Ex: lq1... ou ex1... (endereço Liquid compatível com DePix)"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value)
                      if (errors.liquidAddress) {
                        setErrors((prev) => ({ ...prev, liquidAddress: '' }))
                      }
                    }}
                    className={`h-11 bg-white font-mono text-xs border ${
                      errors.liquidAddress ? 'border-[#B3261E]' : 'border-[#D6D0C5]'
                    } text-[#1A1916] rounded-xl`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Input
                      type="text"
                      placeholder="Identificação da carteira (ex: Minha Marina / Jade)"
                      value={newWalletLabel}
                      onChange={(e) => setNewWalletLabel(e.target.value)}
                      className="h-9 bg-white text-xs border border-[#D6D0C5] rounded-lg"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[#6B6760] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveWalletForFuture}
                      onChange={(e) => setSaveWalletForFuture(e.target.checked)}
                      className="rounded border-[#D6D0C5] text-[#C9A227] focus:ring-[#C9A227]"
                    />
                    <span>Salvar carteira para próximas cobranças</span>
                  </label>
                </div>
              </div>
            )}

            {errors.liquidAddress && (
              <p className="text-xs text-[#B3261E] mt-1 font-medium">{errors.liquidAddress}</p>
            )}

            <p className="text-[11px] text-[#8C6A3F] leading-tight">
              Os DePix resultantes da quitação do Pix serão enviados de forma não custodial
              diretamente a este endereço Liquid.
            </p>
          </div>

          {/* CAMPO 2: VALOR DA COBRANÇA (OBRIGATÓRIO) */}
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
            {errors.amount && (
              <p className="text-xs text-[#B3261E] mt-1 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* CAMPO 3: NOME DO CLIENTE (OPCIONAL) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="customerName"
                className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]"
              >
                Nome do Cliente (Opcional)
              </Label>
              <span className="text-[11px] text-[#8C6A3F]">Opcional</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                <User className="h-4 w-4" />
              </div>
              <Input
                id="customerName"
                type="text"
                placeholder="Ex: João Silva ou Cliente Avulso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="pl-10 h-12 bg-[#FAF8F3] border border-[#D6D0C5] text-[#1A1916] rounded-xl"
              />
            </div>

            {/* Sugestões de clientes salvos */}
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

          {/* CAMPO 4: DESCRIÇÃO (OPCIONAL) */}
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
                placeholder="Ex: Pagamento de serviços / Venda de produto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F3] border border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
              />
            </div>
          </div>

          {/* NOTA INFORMATIVA: REQUISITO 7 — IDENTIFICAÇÃO CPF/CNPJ DO PAGADOR */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#D6D0C5] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#8C6A3F] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#6B6760] leading-relaxed">
              <strong>Identificação e Titularidade do Pagador:</strong> A identificação por CPF/CNPJ
              do pagador é realizada diretamente no fluxo seguro definido pela instituição parceira
              no momento da leitura do Pix, com verificação de titularidade quando exigida pelas
              normas regulatórias.
            </p>
          </div>

          {/* SELEÇÃO DO MODO (REQUISITO 9: MODO REAL DESABILITADO) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Ambiente de Processamento
              </Label>
              <span className="text-[10px] text-[#B3261E] font-medium">Modo real desabilitado</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border-2 border-[#C9A227] bg-[#FFF3E0]/40 flex items-start gap-2.5">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked
                  readOnly
                  className="mt-0.5 text-[#C9A227] focus:ring-[#C9A227]"
                />
                <div>
                  <span className="text-xs font-bold text-[#1A1916] block">
                    Modo Simulado (Ativo)
                  </span>
                  <span className="text-[11px] text-[#8C6A3F] block leading-tight mt-0.5">
                    Gera QR Code e código fictícios sem movimentação bancária real.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#D6D0C5] bg-[#F1EFEA] opacity-65 cursor-not-allowed flex items-start gap-2.5">
                <input
                  type="radio"
                  name="paymentMethod"
                  disabled
                  className="mt-0.5 text-gray-400"
                />
                <div>
                  <span className="text-xs font-bold text-[#6B6760] block">
                    Modo Real (Desabilitado)
                  </span>
                  <span className="text-[11px] text-[#8C6A3F] block leading-tight mt-0.5">
                    Aguardando integração e autorização da API da provedora parceira.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* REQUISITO 4: RESUMO ANTES DA CONFIRMAÇÃO (TAXAS/COMISSÃO/VALOR LÍQUIDO DEPIX) */}
          <div className="rounded-2xl border-2 border-[#C9A227]/40 bg-[#FAF8F3] p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-2.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C9A227]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1916]">
                  Resumo da Cobrança
                </h2>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A227]/20 text-[#8C6A3F] border border-[#C9A227]/30">
                Estimativa — Modo Simulado
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B6760]">Valor da cobrança Pix:</span>
                <span className="font-serif font-bold text-[#1A1916] text-sm">
                  {amountCents > 0 ? formatCurrency(amountCents) : 'R$ 0,00'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#8C6A3F]">
                <span className="flex items-center gap-1">
                  Taxas estimadas da provedora:
                  <span className="text-[10px] text-[#6B6760]">(fictício ~0,99%)</span>
                </span>
                <span className="font-medium">
                  {amountCents > 0 ? `- ${formatCurrency(estimatedProviderFeeCents)}` : 'R$ 0,00'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#8C6A3F]">
                <span className="flex items-center gap-1">
                  Eventual comissão do ROM:
                  <span className="text-[10px] text-[#6B6760]">(fictício ~0,50%)</span>
                </span>
                <span className="font-medium">
                  {amountCents > 0 ? `- ${formatCurrency(estimatedRomFeeCents)}` : 'R$ 0,00'}
                </span>
              </div>

              <div className="border-t border-[#E6E1D8] pt-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1A1916] block">
                    Valor líquido estimado em DePix:
                  </span>
                  <span className="text-[10px] text-[#8C6A3F]">
                    Recebimento não custodial na rede Liquid
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-lg font-extrabold text-[#1A1916] block">
                    {amountCents > 0
                      ? `${(estimatedNetDepixCents / 100).toFixed(2)} DePix`
                      : '0,00 DePix'}
                  </span>
                  <span className="text-[10px] text-[#2E7D32] font-semibold">
                    1 DePix = R$ 1,00 líquido
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[#8C6A3F] bg-white/70 p-2 rounded-lg border border-[#E6E1D8] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#C9A227] flex-shrink-0" />
              <span>
                Enquanto não houver API integrada, os valores de taxas e comissões são estritamente
                fictícios e servem para demonstração da mecânica de liquidação.
              </span>
            </div>
          </div>

          {/* REQUISITO 5: BOTÃO 'Gerar cobrança Pix' */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-bold text-sm tracking-wide rounded-xl shadow-md border-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-[#0B0B0D] border-t-transparent animate-spin" />
                  Gerando cobrança Pix...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Gerar cobrança Pix
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCharge
