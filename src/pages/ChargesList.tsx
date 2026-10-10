import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Layers,
  Info,
  ShieldAlert,
  ArrowRightLeft,
  ArrowDownLeft,
  Receipt,
  Eye,
} from 'lucide-react'
import { chargesService, ChargeRecord } from '@/services/charges'
import { StatusBadge, ChargeStatus } from '@/components/StatusBadge'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { ShareChargeModal } from '@/components/ShareChargeModal'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const ChargesList: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtro de Tipo unificado: Todas / Cobranças / Saques
  const [movementType, setMovementType] = useState<'all' | 'charges' | 'withdrawals'>('all')

  // Filtro por Status
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'-created' | '+created'>('-created')
  const [shareCharge, setShareCharge] = useState<ChargeRecord | null>(null)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [viewEnvironment, setViewEnvironment] = useState<'production' | 'homologation'>(
    'production',
  )

  const loadCharges = useCallback(async () => {
    setLoading(true)
    try {
      const conditions: string[] = []

      if (statusFilter && statusFilter !== 'all') {
        conditions.push(`status = '${statusFilter}'`)
      }

      if (search.trim()) {
        const sanitized = search.trim().replace(/['"\\]/g, '')
        conditions.push(
          `(customer_name ~ '${sanitized}' || description ~ '${sanitized}' || eulen_deposit_id ~ '${sanitized}' || blockchain_tx_id ~ '${sanitized}')`,
        )
      }

      const res = await chargesService.list({
        page: 1,
        perPage: 50,
        filter: conditions.join(' && '),
        sort: sortOrder,
        includeSimulated: viewEnvironment === 'homologation' && isAdmin,
      })

      setCharges(res.items)
    } catch {
      setCharges([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, sortOrder, viewEnvironment, isAdmin])

  useEffect(() => {
    loadCharges()
  }, [loadCharges])

  useRealtime<ChargeRecord>('charges', () => {
    loadCharges()
  })

  // Se o filtro selecionado for "Saques", os saques só existirão em produção com a integração liberada
  const isWithdrawalsTab = movementType === 'withdrawals'
  const displayedCharges = isWithdrawalsTab ? [] : charges

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Aviso oficial de integração pendente */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-4 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-[#663C00]">
              Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a
              provedora de pagamentos.
            </p>
            <p className="text-xs text-[#8F5900] mt-1">
              Histórico unificado de movimentações: cobranças Pix recebidas em DePix e futuros
              saques para contas bancárias.
            </p>
          </div>
        </div>
      </div>

      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Histórico de Movimentações
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            {viewEnvironment === 'homologation'
              ? 'Ambiente restrito de homologação para testes de administradores'
              : 'Lista unificada de cobranças e saques da sua conta de comerciante ROM'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor restrito a administradores para alternar ambiente de homologação */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 p-1 bg-[#F1EFEA] border border-[#D6D0C5] rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewEnvironment('production')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  viewEnvironment === 'production'
                    ? 'bg-[#141413] text-[#FAF8F5]'
                    : 'text-[#57564F] hover:text-[#141413]'
                }`}
              >
                Produção
              </button>
              <button
                type="button"
                onClick={() => setViewEnvironment('homologation')}
                className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                  viewEnvironment === 'homologation'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                Homologação
              </button>
            </div>
          )}

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

      {/* Seletor de Tipo Unificado: Todas / Cobranças / Saques */}
      <div className="flex items-center gap-2 border-b border-[#E6E4DD] pb-3">
        <button
          onClick={() => setMovementType('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            movementType === 'all'
              ? 'bg-[#141413] text-[#FAF8F5]'
              : 'bg-[#FAF8F5] text-[#73726C] hover:text-[#141413] border border-[#D6D0C5]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Todas as Movimentações
        </button>

        <button
          onClick={() => setMovementType('charges')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            movementType === 'charges'
              ? 'bg-[#C5A059] text-[#141413]'
              : 'bg-[#FAF8F5] text-[#73726C] hover:text-[#141413] border border-[#D6D0C5]'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          Cobranças
        </button>

        <button
          onClick={() => setMovementType('withdrawals')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            movementType === 'withdrawals'
              ? 'bg-[#C5A059] text-[#141413]'
              : 'bg-[#FAF8F5] text-[#73726C] hover:text-[#141413] border border-[#D6D0C5]'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Saques
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      {!isWithdrawalsTab && (
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-4 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Campo de Busca */}
            <div className="relative sm:col-span-6 md:col-span-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C8A7B]" />
              <Input
                type="text"
                placeholder="Buscar por cliente, descrição ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-[#FAF8F5] border-[#D6D0C5] text-[#141413] placeholder:text-[#8C8A7B]"
              />
            </div>

            {/* Filtro por Status */}
            <div className="sm:col-span-4 md:col-span-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#FAF8F5] border-[#D6D0C5] text-[#141413]">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#8C8A7B]" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                  <SelectItem value="under_review">Em Análise</SelectItem>
                  <SelectItem value="approved">Pix Confirmado</SelectItem>
                  <SelectItem value="depix_sent">DePix Enviado</SelectItem>
                  <SelectItem value="delayed">Atrasada</SelectItem>
                  <SelectItem value="refunded">Estornada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação e Refresh */}
            <div className="sm:col-span-2 md:col-span-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder((prev) => (prev === '-created' ? '+created' : '-created'))
                }
                title={
                  sortOrder === '-created' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'
                }
                className="border-[#D6D0C5] bg-[#FAF8F5] hover:bg-[#F1EFEA] text-[#141413]"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={loadCharges}
                disabled={loading}
                title="Atualizar lista"
                className="border-[#D6D0C5] bg-[#FAF8F5] hover:bg-[#F1EFEA] text-[#141413]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela / Lista Unificada */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        {isWithdrawalsTab ? (
          /* Estado Vazio Honesto para o filtro "Saques" */
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
              <ArrowRightLeft className="w-7 h-7 text-[#C5A059]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#141413]">
                Nenhum saque registrado
              </h3>
              <p className="text-xs text-[#73726C] max-w-md mx-auto mt-1">
                Os saques só existirão em produção. Quando a integração de pagamentos for liberada,
                todas as suas solicitações de saque de DePix para Pix aparecerão listadas aqui com
                status em tempo real.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs border-[#D6D0C5]">
              <Link to="/saques">Ir para a página de Saques</Link>
            </Button>
          </div>
        ) : loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A059] mb-2" />
            <p className="text-sm text-[#73726C]">Carregando movimentações...</p>
          </div>
        ) : displayedCharges.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#141413]">
                Nenhuma movimentação encontrada
              </h3>
              <p className="text-sm text-[#73726C] max-w-md mx-auto mt-1">
                {search || statusFilter !== 'all'
                  ? 'Nenhum resultado com os filtros selecionados.'
                  : 'As cobranças geradas para seus clientes serão exibidas aqui.'}
              </p>
            </div>
            {!search && statusFilter === 'all' && (
              <Button
                asChild
                className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs"
              >
                <Link to="/cobrancas/nova">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Gerar Cobrança
                </Link>
              </Button>
            )}
          </div>
        ) : (
          /* Tabela Unificada com Colunas: Data, Tipo, Descrição/Cliente, Valor, Status */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E4DD] bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#73726C]">
                  <th className="py-3.5 px-4 sm:px-6">Data</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Descrição / Cliente</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DD] text-xs">
                {displayedCharges.map((charge) => {
                  const formattedDate = formatDateBr(charge.created)
                  return (
                    <tr
                      key={charge.id}
                      onClick={() => navigate(`/cobrancas/${charge.id}`)}
                      className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    >
                      {/* Data */}
                      <td className="py-4 px-4 sm:px-6 text-[#73726C] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-[#141413]">
                          <Clock className="w-3.5 h-3.5 text-[#8C8A7B]" />
                          {formattedDate}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#C5A059]/15 text-[#8F6A1A]">
                          <ArrowDownLeft className="w-3 h-3" />
                          Cobrança
                        </span>
                      </td>

                      {/* Descrição / Cliente */}
                      <td className="py-4 px-4 min-w-[180px] max-w-[280px]">
                        <div className="font-semibold text-[#141413] truncate">
                          {charge.customer_name || 'Cliente'}
                        </div>
                        {charge.description && (
                          <div className="text-[11px] text-[#73726C] truncate mt-0.5">
                            {charge.description}
                          </div>
                        )}
                        {charge.liquid_address && (
                          <div className="font-mono text-[10px] text-[#8C8A7B] truncate mt-0.5">
                            Liquid: {charge.liquid_address.slice(0, 10)}...
                          </div>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="font-semibold text-sm text-[#141413]">
                          {formatCurrency(charge.amount_cents)}
                        </div>
                        <div className="text-[10px] text-[#73726C]">DePix Liquid</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={charge.status as ChargeStatus} />
                        {charge.is_simulated && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-300">
                            Homologação
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/cobrancas/${charge.id}`)
                          }}
                          className="text-xs text-[#57564F] hover:text-[#141413]"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

export default ChargesList
