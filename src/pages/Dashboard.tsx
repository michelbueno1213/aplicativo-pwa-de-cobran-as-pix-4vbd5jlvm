import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { chargesService, type ChargeRecord } from '@/services/charges'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { ShareChargeModal } from '@/components/ShareChargeModal'
import useRealtime from '@/hooks/use-realtime'
import {
  Radio,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Share2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChargeForShare, setSelectedChargeForShare] = useState<ChargeRecord | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const records = await chargesService.getAllForKpis()
      setCharges(records)
    } catch {
      // Ignora erro inicial
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('charges', () => {
    loadData()
  })

  // KPIs calculados
  const paidCharges = charges.filter((c) => c.status === 'paid')
  const pendingCharges = charges.filter((c) => c.status === 'pending')

  const totalCollectedCents = paidCharges.reduce((sum, c) => sum + (c.amount_cents || 0), 0)
  const pendingCount = pendingCharges.length
  const totalCount = charges.length
  const conversionRate = totalCount > 0 ? Math.round((paidCharges.length / totalCount) * 100) : 0
  const expectedPendingCents = pendingCharges.reduce((sum, c) => sum + (c.amount_cents || 0), 0)

  // Gráfico de últimos 7 dias
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateKey = d.toISOString().split('T')[0]
    const dayLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
      .format(d)
      .toUpperCase()
      .replace('.', '')

    const dayCharges = charges.filter((c) => (c.created || '').startsWith(dateKey))
    const paidDayCents = dayCharges
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount_cents || 0), 0)
    const pendingDayCents = dayCharges
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount_cents || 0), 0)

    return {
      dateKey,
      dayLabel,
      paidCents: paidDayCents,
      pendingCents: pendingDayCents,
      totalCents: paidDayCents + pendingDayCents,
    }
  })

  const maxChartValue = Math.max(...last7Days.map((d) => d.totalCents), 10000)

  // 5 últimas cobranças
  const recentCharges = charges.slice(0, 5)

  // Data formatada de hoje: "Domingo, 12 de janeiro"
  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  const capitalizedToday = formattedToday.charAt(0).toUpperCase() + formattedToday.slice(1)

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Topo: Saudação e Data */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D6D0C5]/60">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
            Bem-vindo(a), {user?.name ? user.name.split(' ')[0] : 'Parceiro'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6760] font-sans mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#8C6A3F]" />
            {capitalizedToday}
          </p>
        </div>

        <Link to="/cobrancas/nova">
          <Button className="h-11 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 border-0 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Cobrança
          </Button>
        </Link>
      </div>

      {/* Banner de Modo Simulado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1C1A17] via-[#121110] to-[#181614] border border-[#C9A227]/30 p-5 sm:p-6 text-[#F6F4EF] shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#B26A00]/20 border border-[#B26A00]/40 text-[#F5D77F] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Radio className="w-5 h-5 text-[#C9A227] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-base sm:text-lg font-bold text-[#F6F4EF]">
                  Você está no modo simulado
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B26A00]/30 text-[#F5D77F] border border-[#B26A00]/40 font-semibold">
                  Ativo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#D6D0C5] mt-1 leading-relaxed">
                As cobranças geradas aqui não processam pagamentos reais. Conecte sua chave Pix para
                ativar o modo real assim que a parceria for aprovada.
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/configuracoes')}
            className="h-10 px-4 bg-[#C9A227]/15 hover:bg-[#C9A227]/25 text-[#F5D77F] border border-[#C9A227]/40 text-xs font-semibold rounded-xl flex-shrink-0 transition-colors"
          >
            Conectar provedora
          </Button>
        </div>
      </div>

      {/* Grade de KPIs (2x2 Mobile / 4 colunas Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* KPI 1: Total cobrado */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6D0C5] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-2 font-medium">
            <span>Total cobrado (simulado)</span>
            <CheckCircle className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="font-serif text-xl sm:text-3xl font-extrabold text-[#1A1916] tracking-tight">
            {formatCurrency(totalCollectedCents)}
          </div>
          <p className="text-[11px] text-[#2E7D32] mt-1 font-medium flex items-center gap-1">
            <span>●</span> {paidCharges.length} cobranças pagas
          </p>
        </div>

        {/* KPI 2: Cobranças pendentes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6D0C5] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-2 font-medium">
            <span>Cobranças pendentes</span>
            <Clock className="w-4 h-4 text-[#B26A00]" />
          </div>
          <div className="font-serif text-xl sm:text-3xl font-extrabold text-[#1A1916] tracking-tight">
            {pendingCount}
          </div>
          <p className="text-[11px] text-[#B26A00] mt-1 font-medium flex items-center gap-1">
            <span>●</span> aguardando pagamento
          </p>
        </div>

        {/* KPI 3: Taxa de conversão */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6D0C5] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-2 font-medium">
            <span>Taxa de conversão</span>
            <TrendingUp className="w-4 h-4 text-[#C9A227]" />
          </div>
          <div className="font-serif text-xl sm:text-3xl font-extrabold text-[#1A1916] tracking-tight">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-[#6B6760] mt-1 font-medium">
            {paidCharges.length} de {totalCount} concluídas
          </p>
        </div>

        {/* KPI 4: Esperado (pendentes) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D6D0C5] shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-xs text-[#6B6760] mb-2 font-medium">
            <span>Esperado (pendentes)</span>
            <AlertCircle className="w-4 h-4 text-[#8C6A3F]" />
          </div>
          <div className="font-serif text-xl sm:text-3xl font-extrabold text-[#1A1916] tracking-tight">
            {formatCurrency(expectedPendingCents)}
          </div>
          <p className="text-[11px] text-[#8C6A3F] mt-1 font-medium">soma dos boletos pendentes</p>
        </div>
      </div>

      {/* Gráfico de Barras dos Últimos 7 Dias */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#D6D0C5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1916]">
              Volume dos Últimos 7 Dias
            </h2>
            <p className="text-xs text-[#6B6760]">
              Distribuição diária entre cobranças pagas e pendentes
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[#2E7D32] font-medium">
              <span className="w-3 h-3 rounded-xs bg-[#2E7D32]" />
              Pagas
            </span>
            <span className="flex items-center gap-1.5 text-[#B26A00] font-medium">
              <span className="w-3 h-3 rounded-xs bg-[#C9A227]" />
              Pendentes
            </span>
          </div>
        </div>

        {/* Barras */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 h-48 items-end pt-6 border-b border-[#E6E1D8]">
          {last7Days.map((item, index) => {
            const paidHeight = maxChartValue > 0 ? (item.paidCents / maxChartValue) * 100 : 0
            const pendingHeight = maxChartValue > 0 ? (item.pendingCents / maxChartValue) * 100 : 0

            return (
              <div
                key={item.dateKey}
                className="flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip ao passar o mouse */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#0B0B0D] text-white text-[10px] p-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                  <span>Pagas: {formatCurrency(item.paidCents)}</span>
                  <span>Pendentes: {formatCurrency(item.pendingCents)}</span>
                  <div className="w-2 h-2 bg-[#0B0B0D] rotate-45 -mb-1 mt-0.5" />
                </div>

                <div className="w-full max-w-[36px] flex flex-col justify-end gap-1 h-full pb-1">
                  {/* Barra Pagas */}
                  <div
                    style={{ height: `${Math.max(paidHeight, 4)}%` }}
                    className="w-full bg-[#2E7D32] rounded-t-sm transition-all duration-500 hover:brightness-110"
                  />
                  {/* Barra Pendentes */}
                  <div
                    style={{ height: `${Math.max(pendingHeight, 4)}%` }}
                    className="w-full bg-[#C9A227] rounded-t-sm transition-all duration-500 hover:brightness-110"
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-[#6B6760] font-medium mt-2">
                  {item.dayLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista das 5 Últimas Cobranças */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1916]">Últimas Cobranças</h2>
            <p className="text-xs text-[#6B6760]">
              Movimentações mais recentes geradas na sua conta
            </p>
          </div>
          <Link
            to="/cobrancas"
            className="text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] flex items-center gap-1 transition-colors"
          >
            Ver todas
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCharges.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#D6D0C5] rounded-xl bg-[#FAF8F3]">
            <p className="text-sm text-[#6B6760]">Nenhuma cobrança gerada ainda.</p>
            <Link to="/cobrancas/nova" className="mt-3 inline-block">
              <Button className="h-9 px-4 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] text-xs font-semibold border-0">
                Criar primeira cobrança
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E1D8]">
            {recentCharges.map((charge) => (
              <div
                key={charge.id}
                className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F3] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate(`/cobrancas/${charge.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {charge.customer_name ? charge.customer_name[0].toUpperCase() : 'C'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1916] truncate">
                      {charge.customer_name}
                    </p>
                    <p className="text-[11px] text-[#6B6760]">{formatDateBr(charge.created)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-serif text-sm sm:text-base font-bold text-[#1A1916]">
                      {formatCurrency(charge.amount_cents)}
                    </p>
                    <StatusBadge status={charge.status} />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedChargeForShare(charge)
                      setShareModalOpen(true)
                    }}
                    className="p-2 text-[#8C6A3F] hover:text-[#C9A227] hover:bg-white rounded-lg transition-colors"
                    title="Compartilhar"
                    aria-label="Compartilhar cobrança"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Compartilhamento */}
      <ShareChargeModal
        charge={selectedChargeForShare}
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
      />
    </div>
  )
}

export default Dashboard
