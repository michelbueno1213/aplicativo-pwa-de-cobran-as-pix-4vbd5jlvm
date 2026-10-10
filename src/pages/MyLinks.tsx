import React, { useState, useEffect } from 'react'
import {
  Link2,
  QrCode,
  Plus,
  Info,
  Lock,
  Sparkles,
  Layers,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/formatters'
import { paymentLinksService, PaymentLinkRecord } from '@/services/paymentLinks'

export const MyLinksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'product' | 'fixed_qr'>('product')
  const [links, setLinks] = useState<PaymentLinkRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Estados do formulário de Link de Pagamento (produto / serviço)
  const [productTitle, setProductTitle] = useState('')
  const [productRawPrice, setProductRawPrice] = useState('')
  const [productDescription, setProductDescription] = useState('')

  // Estados do formulário de QR Fixo
  const [qrSlug, setQrSlug] = useState('')
  const [qrRawPrice, setQrRawPrice] = useState('')
  const [qrDescription, setQrDescription] = useState('')

  // Alerta de gate
  const [gateNotice, setGateNotice] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    loadLinks()
  }, [])

  const loadLinks = async () => {
    setLoading(true)
    try {
      const data = await paymentLinksService.list()
      setLinks(data)
    } catch {
      setLinks([])
    } finally {
      setLoading(false)
    }
  }

  // Máscara monetária BRL para centavos
  const handlePriceChange = (val: string, setter: (v: string) => void) => {
    const digitsOnly = val.replace(/\D/g, '')
    if (!digitsOnly) {
      setter('')
      return
    }
    const cents = parseInt(digitsOnly, 10)
    setter(formatCurrency(cents))
  }

  const parseCents = (masked: string): number => {
    const digitsOnly = masked.replace(/\D/g, '')
    return digitsOnly ? parseInt(digitsOnly, 10) : 0
  }

  // Gate de criação: bloqueado enquanto a integração não está liberada
  const handleAttemptCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setGateNotice(
      'Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a provedora de pagamentos.',
    )
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const productLinks = links.filter((l) => l.type === 'product_link')
  const fixedQrLinks = links.filter((l) => l.type === 'fixed_qr')

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Banner Oficial de Integração Pendente */}
      <div className="rounded-xl border border-amber-500/30 bg-[#FFFDF5] p-4 text-[#7A4B00] shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-[#663C00]">
              Em breve: geração de cobranças Pix. Estamos finalizando nossa integração com a
              provedora de pagamentos.
            </p>
            <p className="text-xs text-[#8F5900] mt-1">
              Links de produto e QRs reutilizáveis receberão DePix diretamente na sua carteira
              Liquid a cada pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Meus Links de Cobrança
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            Crie links diretos para seus produtos ou QR Codes reutilizáveis para balcão e pontos de
            venda.
          </p>
        </div>
      </div>

      {gateNotice && (
        <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-amber-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-medium">{gateNotice}</span>
          </div>
          <button
            onClick={() => setGateNotice(null)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-3"
          >
            ×
          </button>
        </div>
      )}

      {/* Abas: Links de Pagamento vs. QR Fixo */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'product' | 'fixed_qr')}
        className="space-y-6"
      >
        <TabsList className="bg-[#FAF8F5] border border-[#D6D0C5] p-1 rounded-xl">
          <TabsTrigger
            value="product"
            className="data-[state=active]:bg-[#C5A059] data-[state=active]:text-[#141413] text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Links de Pagamento
          </TabsTrigger>
          <TabsTrigger
            value="fixed_qr"
            className="data-[state=active]:bg-[#C5A059] data-[state=active]:text-[#141413] text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            QR Fixo Reutilizável
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: LINKS DE PAGAMENTO (PRODUTO / SERVIÇO) */}
        <TabsContent value="product" className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#E6E4DD] pb-4">
              <h2 className="font-serif text-lg font-bold text-[#141413]">
                Novo Link de Produto ou Serviço
              </h2>
              <p className="text-xs text-[#73726C]">
                Defina título, preço fixo e descrição para compartilhar nas redes ou enviar a
                clientes.
              </p>
            </div>

            <form onSubmit={handleAttemptCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                    Título do Produto ou Serviço *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Ex: Consultoria 1h, Curso ROM, E-book..."
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                    Preço (R$) *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="R$ 0,00"
                    value={productRawPrice}
                    onChange={(e) => handlePriceChange(e.target.value, setProductRawPrice)}
                    className="bg-[#FAF8F5] border-[#D6D0C5] text-xs font-mono font-medium text-[#141413] rounded-lg"
                  />
                  <p className="text-[11px] text-[#73726C]">
                    Valor fixo em BRL que será convertido 1:1 em DePix para sua carteira Liquid.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                  Descrição (opcional)
                </Label>
                <Textarea
                  placeholder="Instruções de entrega, detalhes do produto ou informações adicionais para o pagador..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] rounded-lg"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E6E4DD]">
                <div className="flex items-center gap-2 text-xs text-[#73726C]">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Criação bloqueada até liberação das credenciais de produção.</span>
                </div>

                <Button
                  type="submit"
                  className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar Link de Pagamento
                </Button>
              </div>
            </form>
          </div>

          {/* Lista / Estado vazio de Links de Produto */}
          <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#141413]">
                  Links de Pagamento Cadastrados
                </h3>
                <p className="text-xs text-[#73726C]">
                  Seus links ativos para envio direto a clientes
                </p>
              </div>
            </div>

            {productLinks.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
                  <Link2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#141413]">
                  Nenhum link de pagamento criado ainda
                </h4>
                <p className="text-xs text-[#73726C] max-w-md mx-auto">
                  A criação será liberada junto com a integração de pagamentos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E4DD]">
                {productLinks.map((link) => (
                  <div
                    key={link.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#141413]">
                          {link.title || 'Link de Pagamento'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          Ativo
                        </span>
                      </div>
                      {link.description && (
                        <p className="text-xs text-[#73726C] mt-1">{link.description}</p>
                      )}
                      <p className="text-xs text-[#C5A059] font-medium mt-1">
                        Preço fixo: {formatCurrency(link.amount_cents || 0)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}/pagar/${link.id}`, link.id)
                        }
                        className="text-xs border-[#D6D0C5]"
                      >
                        {copiedKey === link.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA 2: QR FIXO REUTILIZÁVEL */}
        <TabsContent value="fixed_qr" className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#E6E4DD] pb-4">
              <h2 className="font-serif text-lg font-bold text-[#141413]">
                Novo QR Code Fixo Reutilizável
              </h2>
              <p className="text-xs text-[#73726C]">
                Ideal para balcão, totens ou pagamentos presenciais. O pagador pode pagar um valor
                padrão ou informar o valor livremente na hora do pagamento.
              </p>
            </div>

            <form onSubmit={handleAttemptCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                    Apelido ou Slug do QR *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="Ex: balcao-loja, mesa-04, caixa-01"
                    value={qrSlug}
                    onChange={(e) => setQrSlug(e.target.value)}
                    className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] rounded-lg"
                  />
                  <p className="text-[11px] text-[#73726C]">
                    Identificador de referência para o seu ponto de venda.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                    Valor Padrão (Opcional)
                  </Label>
                  <Input
                    type="text"
                    placeholder="R$ 0,00 (deixe vazio para valor livre)"
                    value={qrRawPrice}
                    onChange={(e) => handlePriceChange(e.target.value, setQrRawPrice)}
                    className="bg-[#FAF8F5] border-[#D6D0C5] text-xs font-mono font-medium text-[#141413] rounded-lg"
                  />
                  <p className="text-[11px] text-[#73726C]">
                    Sem valor padrão, o pagador informa o valor desejado no momento de pagar.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#141413]">
                  Descrição ou Mensagem ao Pagador (opcional)
                </Label>
                <Textarea
                  placeholder="Ex: Pagamento no balcão ROM. Obrigado pela preferência!"
                  value={qrDescription}
                  onChange={(e) => setQrDescription(e.target.value)}
                  rows={3}
                  className="bg-[#FAF8F5] border-[#D6D0C5] text-xs text-[#141413] rounded-lg"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E6E4DD]">
                <div className="flex items-center gap-2 text-xs text-[#73726C]">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Criação bloqueada até liberação das credenciais de produção.</span>
                </div>

                <Button
                  type="submit"
                  className="bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Gerar QR Fixo
                </Button>
              </div>
            </form>
          </div>

          {/* Lista / Estado vazio de QR Fixo */}
          <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#141413]">
                  QR Codes Fixos Cadastrados
                </h3>
                <p className="text-xs text-[#73726C]">
                  QR Codes permanentes para cobrança no seu estabelecimento
                </p>
              </div>
            </div>

            {fixedQrLinks.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#141413]">
                  Nenhum QR Fixo cadastrado ainda
                </h4>
                <p className="text-xs text-[#73726C] max-w-md mx-auto">
                  A criação será liberada junto com a integração de pagamentos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E6E4DD]">
                {fixedQrLinks.map((qr) => (
                  <div
                    key={qr.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#141413]">
                          {qr.slug || qr.title || 'QR Fixo'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                          Reutilizável
                        </span>
                      </div>
                      <p className="text-xs text-[#73726C] mt-1">
                        {qr.amount_cents && qr.amount_cents > 0
                          ? `Valor padrão: ${formatCurrency(qr.amount_cents)}`
                          : 'Valor livre informado pelo pagador'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}/pagar/${qr.id}`, qr.id)
                        }
                        className="text-xs border-[#D6D0C5]"
                      >
                        {copiedKey === qr.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copiar Link
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MyLinksPage
