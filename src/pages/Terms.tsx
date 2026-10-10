import React from 'react'
import { Link } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-[#1A1916] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-[#D6D0C5] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E1D8]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <SkipLogo size={32} subtitle="TERMOS DE USO" />
        </div>

        <div className="space-y-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
            Termos de Uso — ROM
          </h1>
          <p className="text-xs text-[#6B6760]">Última atualização: {new Date().getFullYear()}</p>
        </div>

        <div className="prose prose-sm text-xs sm:text-sm text-[#1A1916] space-y-4 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              1. Natureza do Serviço e Modo Simulado
            </h2>
            <p>
              O ROM é uma plataforma de gestão e automação de cobranças Pix. Atualmente, a
              plataforma opera em <strong>Fluxo Simulado</strong>, destinado a testes, validação de
              fluxos comerciais e homologação de rotas de integração. Nenhuma cobrança gerada neste
              modo movimenta moeda fiduciária real no Banco Central do Brasil.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">2. Acesso por Convite</h2>
            <p>
              O acesso aos recursos administrativos e de emissão de cobranças dá-se estritamente por
              modelo de convite privativo. É proibida a cessão de credenciais a terceiros não
              autorizados pelo operador da conta master.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              3. Futura Conexão de Provedora e DePix na Liquid
            </h2>
            <p>
              Quando a parceria com a provedora de pagamentos autorizada for homologada, os usuários
              poderão optar por liquidações convencionais em Reais (BRL) ou em representações
              digitais DePix na Liquid Network, sujeitas aos termos regulatórios aplicáveis.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              4. Responsabilidades do Usuário
            </h2>
            <p>
              O usuário é responsável pela veracidade dos dados cadastrais dos clientes adicionados
              e pelo envio de links aos destinatários corretos.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-[#E6E1D8] text-center">
          <Link to="/">
            <Button className="h-10 px-6 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs border-0">
              Retornar à Plataforma
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Terms
