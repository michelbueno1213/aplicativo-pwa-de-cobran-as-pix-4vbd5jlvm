import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Coins,
  ShieldCheck,
  CheckCircle2,
  Info,
  Layers,
  ArrowUpRight,
  Wallet,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { chargesService, ChargeRecord } from '@/services/charges'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { StatusBadge, ChargeStatus } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'

export const SettledValuesPage: React.FC = () => {
  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar apenas registros de produção não simulados
      const res = await chargesService.list({
        page: 1,
        perPage: 50,
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

  // Cobranças com DePix enviado com sucesso na rede Liquid
  const settledCharges = charges.filter((c) => c.status === 'depix_sent')
  const totalSettledCents = settledCharges.reduce(
    (acc, curr) => acc + (curr.net_depix_amount_cents || curr.amount_cents),
    0,
  )

  const hasRealSettlement = settledCharges.length > 0 && totalSettledCents > 0

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
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
              Valores creditados diretamente na sua carteira Liquid após a confirmação de cada
              cobrança.
            </p>
          </div>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#141413]">
            Valores Liquidados
          </h1>
          <p className="text-sm text-[#73726C] mt-1">
            Valores creditados diretamente na sua carteira Liquid após a confirmação de cada
            cobrança.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className="border-[#D6D0C5] bg-[#FFFFFF] text-xs font-semibold"
        >
          <Link to="/carteiras">
            <Wallet className="w-4 h-4 mr-1.5 text-[#C5A059]" />
            Minhas Carteiras Liquid
          </Link>
        </Button>
      </div>

      {/* Card Principal de Resumo */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] text-[#C5A059] border border-[#D6D0C5] flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#73726C] uppercase tracking-wider">
                Total de Valores Liquidados
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#141413] mt-1">
                {hasRealSettlement ? formatCurrency(totalSettledCents) : 'R$ 0,00'}
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Modelo Não Custodial</span>
          </div>
        </div>

        {/* Nota obrigatória quando não houver operações reais */}
        {!hasRealSettlement && (
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E4DD] text-xs space-y-1.5">
            <p className="font-semibold text-[#141413]">
              Os valores aparecem aqui após a liquidação real das cobranças.
            </p>
            <p className="text-[#73726C] leading-relaxed">
              Valores creditados diretamente na sua carteira Liquid após a confirmação de cada
              cobrança. O ROM nunca custodia fundos: cada pagamento Pix é convertido em tokens DePix
              e transmitido pela blockchain para os seus próprios endereços.
            </p>
          </div>
        )}
      </div>

      {/* Explicação da Arquitetura Não Custodial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-[#141413]">Sem Saldo Custodiado</h3>
          <p className="text-xs text-[#73726C] leading-relaxed">
            O ROM não opera como banco nem custodia valores. Os recursos liquidados residem
            exclusivamente na sua carteira Liquid.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-[#141413]">Paridade 1:1 BRL / DePix</h3>
          <p className="text-xs text-[#73726C] leading-relaxed">
            Cada real pago pelo seu cliente via Pix gera 1 token DePix na rede Liquid com liquidação
            automática e irreversível.
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-[#141413]">Liquidação por Cobrança</h3>
          <p className="text-xs text-[#73726C] leading-relaxed">
            Não há necessidade de pedir saque para receber suas vendas: a liquidação cai
            automaticamente no endereço cadastrado.
          </p>
        </div>
      </div>

      {/* Lista de Liquidações Realizadas */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E6E4DD] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#141413]">
              Extrato de Liquidações Realizadas
            </h3>
            <p className="text-xs text-[#73726C]">
              Cobranças de produção liquidadas com sucesso na rede Liquid
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-[#73726C]">Carregando liquidações...</div>
        ) : settledCharges.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D6D0C5] flex items-center justify-center mx-auto text-[#8C8A7B]">
              <Coins className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#141413]">
              Nenhuma liquidação registrada
            </h4>
            <p className="text-xs text-[#73726C] max-w-md mx-auto">
              Os valores aparecem aqui após a liquidação real das cobranças. Valores creditados
              diretamente na sua carteira Liquid após a confirmação de cada cobrança.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6E4DD]">
            {settledCharges.map((charge) => (
              <div
                key={charge.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#141413]">
                      {charge.customer_name || 'Cliente'}
                    </span>
                    <StatusBadge status={charge.status as ChargeStatus} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#73726C]">
                    <span>{formatDateBr(charge.created)}</span>
                    {charge.liquid_address && (
                      <span className="font-mono text-[11px] text-[#57564F]">
                        • Liquid: {charge.liquid_address.slice(0, 10)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm text-emerald-800">
                    +{formatCurrency(charge.net_depix_amount_cents || charge.amount_cents)} DePix
                  </div>
                  {charge.blockchain_tx_id && (
                    <a
                      href={`https://blockstream.info/liquid/tx/${charge.blockchain_tx_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#C5A059] hover:underline flex items-center justify-end gap-1 mt-0.5"
                    >
                      TxID Blockchain
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SettledValuesPage
