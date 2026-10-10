import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chargesService, type ChargeRecord } from '@/services/charges'
import { formatCurrency, formatDateBr, maskPixKey } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { ShareChargeModal } from '@/components/ShareChargeModal'
import useRealtime from '@/hooks/use-realtime'
import {
  Plus,
  Search,
  Share2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
  ArrowUpDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const ChargesList: React.FC = () => {
  const navigate = useNavigate()

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 10

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'-created' | 'created'>('-created')
  const [loading, setLoading] = useState(true)

  const [selectedChargeForShare, setSelectedChargeForShare] = useState<ChargeRecord | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const loadCharges = async () => {
    setLoading(true)
    try {
      // Montar filtro do PocketBase
      const filters: string[] = []
      if (statusFilter !== 'all') {
        filters.push(`status = "${statusFilter}"`)
      }
      if (search.trim()) {
        filters.push(`customer_name ~ "${search.trim()}"`)
      }

      const filterString = filters.join(' && ')
      const res = await chargesService.list({
        page,
        perPage,
        filter: filterString,
        sort: sortOrder,
      })

      setCharges(res.items)
      setTotalItems(res.totalItems)
    } catch {
      // Ignora erro
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharges()
  }, [page, statusFilter, sortOrder])

  // Recarregar com debounce na busca
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      loadCharges()
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  // Realtime updates
  useRealtime('charges', () => {
    loadCharges()
  })

  const totalPages = Math.ceil(totalItems / perPage) || 1

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D6D0C5]/60">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
            Cobranças Pix
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6760] font-sans mt-0.5">
            Gerencie e acompanhe todos os links de cobrança gerados
          </p>
        </div>

        <Link to="/cobrancas/nova">
          <Button className="h-11 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase rounded-xl shadow-md border-0 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Cobrança
          </Button>
        </Link>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-[#D6D0C5] shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Campo de Busca por Cliente */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6A3F]" />
          <Input
            type="text"
            placeholder="Buscar por nome do cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl placeholder:text-[#6B6760]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Select de Status */}
          <div className="relative flex-1 md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full h-10 px-3 bg-[#FAF8F3] border border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Paga</option>
              <option value="expired">Expirada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Alternar Ordenação */}
          <Button
            variant="outline"
            onClick={() => setSortOrder(sortOrder === '-created' ? 'created' : '-created')}
            className="h-10 px-3 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl flex items-center gap-1.5"
            title="Alternar ordenação por data"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6A3F]" />
            <span className="hidden sm:inline">
              {sortOrder === '-created' ? 'Mais recentes' : 'Mais antigas'}
            </span>
          </Button>
        </div>
      </div>

      {/* Conteúdo: Tabela no Desktop / Cards no Mobile */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#6B6760] text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin mx-auto mb-2" />
            Carregando cobranças...
          </div>
        ) : charges.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Receipt className="w-12 h-12 text-[#D6D0C5] mx-auto mb-3" />
            <p className="text-base font-serif font-bold text-[#1A1916]">
              Nenhuma cobrança encontrada
            </p>
            <p className="text-xs text-[#6B6760] mt-1 max-w-sm mx-auto">
              Ajuste os filtros de busca ou gere uma nova cobrança simulada.
            </p>
            <Link to="/cobrancas/nova" className="mt-4 inline-block">
              <Button className="h-9 px-4 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] text-xs font-semibold border-0">
                Criar Cobrança
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table (≥ 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1EFEA] border-b border-[#E6E1D8] text-[#1A1916] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Cliente</th>
                    <th className="py-3.5 px-4">Valor</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Chave Pix</th>
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D8]">
                  {charges.map((charge) => (
                    <tr
                      key={charge.id}
                      onClick={() => navigate(`/cobrancas/${charge.id}`)}
                      className="hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-semibold text-[#1A1916]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xs flex items-center justify-center">
                            {charge.customer_name ? charge.customer_name[0].toUpperCase() : 'C'}
                          </div>
                          <span>{charge.customer_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-serif text-sm font-bold text-[#1A1916]">
                        {formatCurrency(charge.amount_cents)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={charge.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6B6760]">
                        {maskPixKey(charge.pix_key)}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B6760]">{formatDateBr(charge.created)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedChargeForShare(charge)
                            setShareModalOpen(true)
                          }}
                          className="h-8 px-2 text-[#8C6A3F] hover:text-[#C9A227] hover:bg-white"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (< 768px) */}
            <div className="md:hidden divide-y divide-[#E6E1D8]">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  onClick={() => navigate(`/cobrancas/${charge.id}`)}
                  className="p-4 hover:bg-[#FAF8F3] transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xs flex items-center justify-center">
                        {charge.customer_name ? charge.customer_name[0].toUpperCase() : 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#1A1916]">
                          {charge.customer_name}
                        </p>
                        <p className="text-[11px] text-[#6B6760]">{formatDateBr(charge.created)}</p>
                      </div>
                    </div>
                    <StatusBadge status={charge.status} />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-[#8C6A3F] uppercase tracking-wider block">
                        Chave Pix: {maskPixKey(charge.pix_key)}
                      </span>
                      <span className="font-serif text-lg font-bold text-[#1A1916]">
                        {formatCurrency(charge.amount_cents)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedChargeForShare(charge)
                        setShareModalOpen(true)
                      }}
                      className="h-8 px-3 text-xs border-[#D6D0C5] text-[#8C6A3F] hover:text-[#C9A227]"
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            <div className="p-4 border-t border-[#E6E1D8] bg-[#FAF8F3] flex items-center justify-between text-xs text-[#6B6760]">
              <span>
                Mostrando {charges.length} de {totalItems} cobranças
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 border-[#D6D0C5]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-[#1A1916] px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0 border-[#D6D0C5]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
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

export default ChargesList
