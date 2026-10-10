import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  Clock,
  Layers,
  Check,
} from 'lucide-react'
import { chargesService, ChargeRecord } from '@/services/charges'
import { StatusBadge, ChargeStatus } from '@/components/StatusBadge'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const HomologationPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [creating, setCreating] = useState(false)

  // Formulário rápido de criação de teste
  const [customerName, setCustomerName] = useState('')
  const [amountInput, setAmountInput] = useState('100,00')
  const [description, setDescription] = useState('Cobrança de Teste Homologação')

  useEffect(() => {
    if (!isAdmin) {
      navigate('/inicio', { replace: true })
      return
    }
    loadSimulatedCharges()
  }, [isAdmin, navigate])

  const loadSimulatedCharges = async () => {
    setLoading(true)
    try {
      const res = await chargesService.list({
        page: 1,
        perPage: 50,
        sort: '-created',
        includeSimulated: true,
      })
      setCharges(res.items)
    } catch {
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    setCreating(true)
    try {
      const cleanDigits = amountInput.replace(/\D/g, '')
      const cents = parseInt(cleanDigits, 10) || 10000

      await chargesService.createSimulatedForAdmin({
        customer_name: customerName.trim() || 'Cliente de Homologação',
        amount_cents: cents,
        liquid_address: 'ex1q8q7g9n34zkm2lpx7vr20m8w9r5j7kl4v6s2dpw',
        description: description.trim(),
        payment_method: 'simulated',
        is_simulated: true,
      })

      setCustomerName('')
      await loadSimulatedCharges()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleSimulatePayment = async (chargeId: string) => {
    try {
      await chargesService.markAsPaidSimulated(chargeId)
      await loadSimulatedCharges()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSimulateCancel = async (chargeId: string) => {
    try {
      await chargesService.cancelSimulated(chargeId)
      await loadSimulatedCharges()
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearAllSimulated = async () => {
    if (!confirm('Deseja excluir todos os registros de teste da homologação?')) return
    setCleaning(true)
    try {
      for (const c of charges) {
        await chargesService.deleteSimulated(c.id)
      }
      await loadSimulatedCharges()
    } catch (err) {
      console.error(err)
    } finally {
      setCleaning(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Banner de Homologação */}
      <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-900 shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-amber-950">
            Ambiente Exclusivo de Homologação (Acesso Restrito a Administradores)
          </p>
          <p className="mt-1">
            Cobranças criadas aqui possuem a flag{' '}
            <code className="bg-amber-200 px-1 py-0.5 rounded font-mono">is_simulated = true</code>{' '}
            em namespace isolado. Nenhum registro deste ambiente interfere na produção ou nas
            métricas reais.
          </p>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Painel de Homologação
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            Simulação ponta a ponta dos estados de pagamento e pré-visualização da página pública.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {charges.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllSimulated}
              disabled={cleaning}
              className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {cleaning ? 'Limpando...' : 'Limpar Registros de Teste'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadSimulatedCharges}
            disabled={loading}
            className="border-[#D6D0C5] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Formulário para gerar cobrança de teste */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="font-serif text-base font-bold text-[#141413]">
          Criar Nova Cobrança de Teste
        </h2>

        <form onSubmit={handleCreateTestCharge} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs uppercase font-semibold text-[#141413]">
              Nome do Pagador
            </Label>
            <Input
              type="text"
              placeholder="Ex: João da Silva (Teste)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-xs h-10"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs uppercase font-semibold text-[#141413]">Valor em R$</Label>
            <Input
              type="text"
              placeholder="100,00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="bg-[#FAF8F5] border-[#D6D0C5] text-xs h-10 font-mono"
            />
          </div>

          <div className="space-y-1 sm:col-span-1 flex items-end">
            <Button
              type="submit"
              disabled={creating}
              className="w-full bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs h-10 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {creating ? 'Criando...' : 'Gerar Cobrança de Teste'}
            </Button>
          </div>
        </form>
      </div>

      {/* Tabela de Cobranças de Homologação */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#141413]">
            Registros de Homologação ({charges.length})
          </h3>
          <span className="text-xs text-[#73726C]">Controle manual de estados ativo</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#73726C]">Carregando testes...</div>
        ) : charges.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#73726C]">
            Nenhum registro de homologação no momento.
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {charges.map((charge) => (
              <div
                key={charge.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#141413]">
                      {charge.customer_name || 'Cliente Teste'}
                    </span>
                    <StatusBadge status={charge.status as ChargeStatus} />
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
                      is_simulated = true
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#73726C]">
                    <span>{formatDateBr(charge.created)}</span>
                    <span className="font-semibold text-[#141413]">
                      {formatCurrency(charge.amount_cents)}
                    </span>
                    <span className="font-mono text-[11px] text-[#8C8A7B]">ID: {charge.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Botão Ver página pública exigido */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-[#D6D0C5] text-xs font-semibold text-[#141413] bg-[#FFFFFF] hover:bg-[#FAF8F5]"
                  >
                    <Link to={`/pagar/${charge.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1 text-[#C5A059]" />
                      Ver página pública
                    </Link>
                  </Button>

                  {/* Ações manuais de simulação para admin */}
                  {charge.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSimulatePayment(charge.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Simular DePix Enviado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSimulateCancel(charge.id)}
                        className="border-red-300 text-red-700 text-xs"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      chargesService.deleteSimulated(charge.id).then(loadSimulatedCharges)
                    }
                    className="text-red-600 hover:bg-red-50 text-xs"
                    title="Excluir este teste"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomologationPage
