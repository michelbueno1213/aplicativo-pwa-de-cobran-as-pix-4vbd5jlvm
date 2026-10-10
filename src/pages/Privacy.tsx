import React from 'react'
import { Link } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { ArrowLeft, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Privacy: React.FC = () => {
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
          <SkipLogo size={32} subtitle="PRIVACIDADE" />
        </div>

        <div className="space-y-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
            Política de Privacidade — ROM
          </h1>
          <p className="text-xs text-[#6B6760]">Última atualização: {new Date().getFullYear()}</p>
        </div>

        <div className="prose prose-sm text-xs sm:text-sm text-[#1A1916] space-y-4 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">1. Dados Coletados</h2>
            <p>
              O ROM coleta estritamente as informações necessárias para a geração das ordens de
              cobrança Pix e liquidação em DePix (Liquid), além da identificação dos operadores da
              conta: nome, e-mail, telefone, chave Pix da cobrança e endereço da carteira Liquid
              para crédito de DePix.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              2. Segurança e Armazenamento
            </h2>
            <p>
              Todos os registros trafegam por criptografia de ponta a ponta (HTTPS/TLS) e são
              armazenados com regras estritas de isolamento por usuário (Row-Level Security),
              garantindo que apenas você visualize suas próprias cobranças e clientes cadastrados.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              3. Compartilhamento de Dados
            </h2>
            <p>
              Não comercializamos nem cedemos dados cadastrais para terceiros. Informações de ordens
              de pagamento e liquidações em DePix são processadas com sigilo estrito e os dados do
              modo simulado são de uso exclusivo para testes e demonstração da ferramenta.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-base font-bold text-[#1A1916]">
              4. Seus Direitos (LGPD)
            </h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode a qualquer
              momento consultar, corrigir ou solicitar a exclusão definitiva dos seus dados e dos
              registros de cobrança.
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

export default Privacy
