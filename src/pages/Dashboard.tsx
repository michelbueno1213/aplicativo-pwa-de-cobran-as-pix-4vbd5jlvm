import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Clock,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react'
import { chargesService, ChargeRecord } from '@/services/charges'
import { StatusBadge, ChargeStatus } from '@/components/StatusBadge'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { ShareChargeModal } from '@/components/ShareChargeModal'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [shareCharge, setShareCharge] = useState<ChargeRecord | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar apenas registros de produção não simulados
      const res = await chargesService.list({
        page: 1,
        perPage: 10,
        sort: '-created',
        includeSimulated: false,
      })
      setCharges(res.items)
    } catch {
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime<ChargeRecord>('charges', () => {
    loadData()
  })

  // Cálculos estritamente de valores liquidados em carteiras externas (ROM não custodia fundos)
  const paidCharges = charges.filter(
    (c) => c.status === 'depix_sent' || c.status === 'approved' || c.status === 'paid',
  )
  const pendingCharges = charges.filter(
    (c) => c.status === 'pending' || c.status === 'under_review',
  )

  const totalSettledCents = paidCharges.reduce(
    (acc, curr) => acc + (curr.net_depix_amount_cents || curr.amount_cents),
    0,
  )
  const pendingVolumeCents = pendingCharges.reduce((acc, curr) => acc + curr.amount_cents, 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Mensagem Oficial de Integração Pendente */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-4 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-[#663C00]">
              Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a
              provedora de pagamentos.
            </p>
            <p className="text-xs text-[#8F5900] mt-1">
              Plataforma não custodial: cada comerciante recebe DePix diretamente em sua carteira
              Liquid.
            </p>
          </div>
        </div>
      </div>

      {/* Boas-vindas e Ação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Painel do Comerciante
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            Olá,{' '}
            <strong className="text-[#141413]">{user?.name || user?.email || 'Comerciante'}</strong>
            . Acompanhe suas cobranças e liquidações Liquid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold shadow-xs"
          >
            <Link to="/cobrancas/nova">
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Cobrança
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas: Valores Liquidados e Operações (Nunca Saldo Custodiado) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Valores Liquidados na Carteira */}
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73726C] uppercase tracking-wider">
              Valores Liquidados
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#141413]">
              {charges.some((c) => c.status === 'depix_sent')
                ? formatCurrency(totalSettledCents)
                : 'R$ 0,00'}
            </div>
            <p className="text-xs text-[#73726C] mt-1">
              {charges.some((c) => c.status === 'depix_sent')
                ? 'Entregues em DePix nas carteiras Liquid cadastradas.'
                : 'Os valores aparecem aqui após a liquidação real das cobranças.'}
            </p>
          </div>
          <div className="pt-2 border-t border-[#E6E4DD] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#2E7D32]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Valores creditados diretamente na sua carteira Liquid</span>
            </div>
            <Link
              to="/valores-liquidados"
              className="text-[#C5A059] font-medium hover:underline flex items-center gap-0.5"
            >
              Ver detalhes
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 2: Em Processamento / Aguardando Pix */}
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73726C] uppercase tracking-wider">
              Aguardando Pix
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-[#141413]">
              {formatCurrency(pendingVolumeCents)}
            </div>
            <p className="text-xs text-[#73726C] mt-1">
              {pendingCharges.length} cobrança(s) pendente(s) de pagamento
            </p>
          </div>
          <div className="pt-2 border-t border-[#E6E4DD] flex items-center gap-1.5 text-[11px] text-[#B26A00]">
            <Layers className="w-3.5 h-3.5" />
            <span>Conversão 1 BRL = 1 DePix</span>
          </div>
        </div>

        {/* Card 3: Carteiras e Acesso Rápido */}
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#73726C] uppercase tracking-wider">
              Minha Carteira Liquid
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#141413]">Recebimento Direto</div>
            <p className="text-xs text-[#73726C] mt-1">
              Gerencie seus endereços para recebimento automático dos tokens DePix.
            </p>
          </div>
          <div className="pt-2 border-t border-[#E6E4DD]">
            <Link
              to="/carteiras"
              className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1"
            >
              Gerenciar Carteiras Liquid
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Seção de Cobranças Recentes */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#141413]">Cobranças Recentes</h3>
            <p className="text-xs text-[#73726C]">
              Operações em produção geradas para seus clientes
            </p>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-[#57564F] hover:text-[#141413]"
          >
            <Link to="/cobrancas">
              Ver todas
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#C5A059] mb-2" />
            <p className="text-xs text-[#73726C]">Carregando...</p>
          </div>
        ) : charges.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-[#73726C]">Nenhuma cobrança gerada ainda.</p>
            <Button
              asChild
              size="sm"
              className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] text-xs font-semibold"
            >
              <Link to="/cobrancas/nova">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Criar Primeira Cobrança
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {charges.slice(0, 5).map((charge) => (
              <div
                key={charge.id}
                onClick={() => navigate(`/cobrancas/${charge.id}`)}
                className="p-4 hover:bg-[#FAF8F5] transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#141413] truncate">
                      {charge.customer_name || 'Cliente'}
                    </span>
                    <StatusBadge status={charge.status as ChargeStatus} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#73726C]">
                    <span>{formatDateBr(charge.created)}</span>
                    {charge.liquid_address && (
                      <span className="font-mono text-[11px] text-[#57564F] truncate max-w-[150px]">
                        • Liquid: {charge.liquid_address.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm text-[#141413]">
                    {formatCurrency(charge.amount_cents)}
                  </div>
                  <div className="text-[11px] text-[#73726C]">Recebe em DePix</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shareCharge && (
        <ShareChargeModal
          open={isShareOpen}
          onOpenChange={(open) => {
            setIsShareOpen(open)
            if (!open) setShareCharge(null)
          }}
          charge={shareCharge}
        />
      )}
    </div>
  )
}

export default Dashboard
