import React, { useState, useEffect } from 'react'
import { customersService, type CustomerRecord } from '@/services/customers'
import { chargesService } from '@/services/charges'
import { formatCurrency, maskPixKey, validatePixKey } from '@/lib/formatters'
import useRealtime from '@/hooks/use-realtime'
import {
  Users,
  Plus,
  Search,
  User,
  Mail,
  Phone,
  KeyRound,
  Edit2,
  Trash2,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [chargesStats, setChargesStats] = useState<
    Record<string, { count: number; totalCents: number }>
  >({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formPixKey, setFormPixKey] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerRecord | null>(null)

  const loadData = async () => {
    try {
      const [custList, chargeList] = await Promise.all([
        customersService.getAll(),
        chargesService.getAllForKpis(),
      ])
      setCustomers(custList)

      // Agregar contagem de cobranças e total gasto por cliente (pelo nome)
      const statsMap: Record<string, { count: number; totalCents: number }> = {}
      chargeList.forEach((c) => {
        const nameKey = (c.customer_name || '').trim().toLowerCase()
        if (!statsMap[nameKey]) statsMap[nameKey] = { count: 0, totalCents: 0 }
        statsMap[nameKey].count += 1
        if (c.status === 'paid') {
          statsMap[nameKey].totalCents += c.amount_cents || 0
        }
      })
      setChargesStats(statsMap)
    } catch {
      // Ignora erro
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('customers', () => {
    loadData()
  })

  useRealtime('charges', () => {
    loadData()
  })

  const openCreateModal = () => {
    setEditingCustomer(null)
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setFormPixKey('')
    setFormErrors({})
    setModalOpen(true)
  }

  const openEditModal = (cust: CustomerRecord) => {
    setEditingCustomer(cust)
    setFormName(cust.name)
    setFormEmail(cust.email || '')
    setFormPhone(cust.phone || '')
    setFormPixKey(cust.pix_key || '')
    setFormErrors({})
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const errs: Record<string, string> = {}
    if (!formName.trim()) errs.name = 'Nome é obrigatório'
    if (formEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      errs.email = 'E-mail inválido'
    }
    if (formPixKey.trim()) {
      const pixCheck = validatePixKey(formPixKey.trim())
      if (!pixCheck.valid) {
        errs.pix_key = 'Chave Pix com formato inválido'
      }
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    setSaving(true)
    try {
      if (editingCustomer) {
        await customersService.update(editingCustomer.id, {
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          pix_key: formPixKey.trim() || undefined,
        })
      } else {
        await customersService.create({
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
          pix_key: formPixKey.trim() || undefined,
        })
      }
      setModalOpen(false)
      loadData()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormErrors({ general: err.message })
      } else {
        setFormErrors({ general: 'Falha ao salvar cliente' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!customerToDelete) return
    setSaving(true)
    try {
      await customersService.delete(customerToDelete.id)
      setDeleteModalOpen(false)
      setCustomerToDelete(null)
      loadData()
    } catch {
      // Ignora erro
    } finally {
      setSaving(false)
    }
  }

  // Filtragem em tempo real
  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#D6D0C5]/60">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6760] font-sans mt-0.5">
            Cadastre clientes recorrentes para agilizar a emissão de cobranças
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="h-11 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-xs tracking-wider uppercase rounded-xl shadow-md border-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Busca em tempo real */}
      <div className="bg-white p-4 rounded-2xl border border-[#D6D0C5] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C6A3F]" />
          <Input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
          />
        </div>
      </div>

      {/* Lista de Clientes: Cards no Mobile / Tabela no Desktop */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#6B6760] text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin mx-auto mb-2" />
            Carregando clientes...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-12 h-12 text-[#D6D0C5] mx-auto mb-3" />
            <p className="text-base font-serif font-bold text-[#1A1916]">
              Nenhum cliente encontrado
            </p>
            <p className="text-xs text-[#6B6760] mt-1 max-w-sm mx-auto">
              Cadastre novos parceiros e compradores para gerar cobranças rápidas.
            </p>
            <Button
              onClick={openCreateModal}
              className="mt-4 h-9 px-4 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] text-xs font-semibold border-0"
            >
              + Novo Cliente
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1EFEA] border-b border-[#E6E1D8] text-[#1A1916] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Cliente</th>
                    <th className="py-3.5 px-4">Contato</th>
                    <th className="py-3.5 px-4">Chave Pix</th>
                    <th className="py-3.5 px-4">Cobranças</th>
                    <th className="py-3.5 px-4">Total Gasto (Pago)</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1D8]">
                  {filteredCustomers.map((cust) => {
                    const stats = chargesStats[cust.name.trim().toLowerCase()] || {
                      count: 0,
                      totalCents: 0,
                    }
                    return (
                      <tr key={cust.id} className="hover:bg-[#FAF8F3] transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#1A1916]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xs flex items-center justify-center">
                              {cust.name ? cust.name[0].toUpperCase() : 'C'}
                            </div>
                            <span>{cust.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B6760]">
                          <div>{cust.email || '—'}</div>
                          {cust.phone && (
                            <div className="text-[11px] text-[#8C6A3F]">{cust.phone}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#6B6760]">
                          {maskPixKey(cust.pix_key)}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#1A1916]">{stats.count}</td>
                        <td className="py-3.5 px-4 font-serif text-sm font-bold text-[#1A1916]">
                          {formatCurrency(stats.totalCents)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(cust)}
                              className="h-8 px-2 text-[#8C6A3F] hover:text-[#C9A227]"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setCustomerToDelete(cust)
                                setDeleteModalOpen(true)
                              }}
                              className="h-8 px-2 text-[#8C6A3F] hover:text-[#B3261E]"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[#E6E1D8]">
              {filteredCustomers.map((cust) => {
                const stats = chargesStats[cust.name.trim().toLowerCase()] || {
                  count: 0,
                  totalCents: 0,
                }
                return (
                  <div key={cust.id} className="p-4 hover:bg-[#FAF8F3] transition-colors space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xs flex items-center justify-center">
                          {cust.name ? cust.name[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#1A1916]">{cust.name}</p>
                          <p className="text-[11px] text-[#6B6760]">{cust.email || 'Sem e-mail'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 text-[#8C6A3F] hover:text-[#C9A227]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(cust)
                            setDeleteModalOpen(true)
                          }}
                          className="p-1.5 text-[#8C6A3F] hover:text-[#B3261E]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E6E1D8]/60 text-[#6B6760]">
                      <div>
                        <span>{stats.count} cobranças</span>
                        {cust.pix_key && (
                          <span className="block text-[10px] text-[#8C6A3F] font-mono">
                            Pix: {maskPixKey(cust.pix_key)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#8C6A3F] uppercase tracking-wider block">
                          Total Pago
                        </span>
                        <span className="font-serif text-sm font-bold text-[#1A1916]">
                          {formatCurrency(stats.totalCents)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Criação / Edição de Cliente */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#1A1916]">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              Informações do comprador para faturamento Pix
            </DialogDescription>
          </DialogHeader>

          {formErrors.general && (
            <div className="p-3 rounded-lg bg-[#B3261E]/15 text-[#B3261E] text-xs font-medium">
              {formErrors.general}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Nome Completo *
              </Label>
              <Input
                type="text"
                placeholder="Ex: João da Silva"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
              {formErrors.name && <p className="text-xs text-[#B3261E]">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                E-mail (opcional)
              </Label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
              {formErrors.email && <p className="text-xs text-[#B3261E]">{formErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Telefone / WhatsApp (opcional)
              </Label>
              <Input
                type="text"
                placeholder="(11) 98765-4321"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Chave Pix Associada (opcional)
              </Label>
              <Input
                type="text"
                placeholder="Chave Pix usual do cliente"
                value={formPixKey}
                onChange={(e) => setFormPixKey(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
              {formErrors.pix_key && <p className="text-xs text-[#B3261E]">{formErrors.pix_key}</p>}
            </div>

            <DialogFooter className="flex gap-2 justify-end pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-[#D6D0C5] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] text-xs font-semibold border-0"
              >
                {saving ? 'Salvando...' : editingCustomer ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#B3261E]">
              Excluir Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              Deseja remover {customerToDelete?.name}? As cobranças já emitidas continuarão salvas
              no histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="border-[#D6D0C5] text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              className="bg-[#B3261E] hover:bg-[#962019] text-white text-xs border-0"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomersList
