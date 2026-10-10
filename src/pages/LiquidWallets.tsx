import React, { useState, useEffect } from 'react'
import {
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { liquidWalletsService, LiquidWalletRecord } from '@/services/liquidWallets'
import { validateLiquidAddress } from '@/lib/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const LiquidWalletsPage: React.FC = () => {
  const [wallets, setWallets] = useState<LiquidWalletRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Formulário nova carteira
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    setLoading(true)
    try {
      const data = await liquidWalletsService.list()
      setWallets(data)
    } catch {
      setWallets([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const cleanAddress = address.trim()
    const valid = validateLiquidAddress(cleanAddress)
    if (!valid) {
      setFormError('Endereço da rede Liquid inválido. Deve começar com "ex1", "lq1" ou "Q".')
      return
    }

    setSaving(true)
    try {
      await liquidWalletsService.create({
        label: label.trim() || 'Minha Carteira Liquid',
        address: cleanAddress,
        is_default: isDefault || wallets.length === 0,
      })

      setLabel('')
      setAddress('')
      setIsDefault(false)
      setFormSuccess('Carteira Liquid cadastrada com sucesso!')
      await loadWallets()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar carteira.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWallet = async (id: string) => {
    if (!confirm('Deseja remover esta carteira Liquid?')) return
    try {
      await liquidWalletsService.delete(id)
      await loadWallets()
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Banner Oficial */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-4 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-[#663C00]">
              Carteiras Liquid para Recebimento em DePix
            </p>
            <p className="text-xs text-[#8F5900] mt-1">
              O ROM é não custodial. Todos os pagamentos Pix dos seus clientes são convertidos 1:1 e
              enviados em DePix diretamente para o endereço cadastrado aqui.
            </p>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
          Carteiras Liquid
        </h1>
        <p className="text-sm text-[#73726C] mt-1">
          Gerencie seus endereços da rede Liquid (Blockstream Green, Marina, Aqua, SideSwap, etc.)
        </p>
      </div>

      {/* Formulário para Adicionar Nova Carteira */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 shadow-xs space-y-4">
        <div className="border-b border-[#E6E4DD] pb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#C5A059]" />
          <h2 className="font-serif text-base font-bold text-[#141413]">
            Adicionar Carteira Liquid
          </h2>
        </div>

        {formSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
        )}

        {formError && (
          <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-semibold text-[#141413]">
                Identificação / Rótulo da Carteira
              </Label>
              <Input
                type="text"
                placeholder="Ex: Aqua Wallet Pessoal, Marina Balcão, SideSwap Caixa"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="bg-[#FAF8F5] border-[#D6D0C5] text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase font-semibold text-[#141413]">
                Endereço Liquid (DePix) *
              </Label>
              <Input
                type="text"
                required
                placeholder="ex1q... ou lq1..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-[#FAF8F5] border-[#D6D0C5] text-xs font-mono h-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-[#73726C] cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-[#D6D0C5] text-[#C5A059] focus:ring-[#C5A059]"
              />
              <span>Definir como carteira padrão para novas cobranças</span>
            </label>

            <Button
              type="submit"
              disabled={saving}
              className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs h-10 px-5 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {saving ? 'Salvando...' : 'Salvar Carteira'}
            </Button>
          </div>
        </form>
      </div>

      {/* Lista de Carteiras */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
          <h3 className="font-serif text-base font-bold text-[#141413]">
            Carteiras Cadastradas ({wallets.length})
          </h3>
          <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Autocustódia
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#73726C]">Carregando carteiras...</div>
        ) : wallets.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-[#73726C]">Nenhuma carteira Liquid cadastrada ainda.</p>
            <p className="text-[11px] text-[#8C8A7B]">
              Cadastre sua primeira carteira acima para receber DePix automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#141413]">{wallet.label}</span>
                    {wallet.is_default && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[#57564F] select-all break-all">
                      {wallet.address}
                    </span>
                    <button
                      onClick={() => copyToClipboard(wallet.address, wallet.id)}
                      className="text-[#8C8A7B] hover:text-[#141413] shrink-0 p-1"
                      title="Copiar endereço"
                    >
                      {copiedKey === wallet.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#57564F] hover:text-[#141413]"
                  >
                    <a
                      href={`https://blockstream.info/liquid/address/${wallet.address}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Explorador
                    </a>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWallet(wallet.id)}
                    className="text-red-600 hover:bg-red-50 text-xs"
                    title="Excluir carteira"
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

export default LiquidWalletsPage
