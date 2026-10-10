import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SkipLogo } from '@/components/SkipLogo'
import {
  Home,
  Receipt,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Radio,
  MessageCircle,
  Shield,
  FileText,
  Wallet,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters'
import { chargesService } from '@/services/charges'
import useRealtime from '@/hooks/use-realtime'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)
  const [simulatedTotalCents, setSimulatedTotalCents] = useState(0)

  // Carregar saldo simulado acumulado (soma das pagas)
  const fetchAccumulatedBalance = async () => {
    try {
      const records = await chargesService.getAllForKpis()
      const total = records
        .filter((c) => c.status === 'paid')
        .reduce((sum, c) => sum + (c.amount_cents || 0), 0)
      setSimulatedTotalCents(total)
    } catch {
      // Ignora falha de fetch silencioso
    }
  }

  useEffect(() => {
    fetchAccumulatedBalance()
  }, [])

  // Atualizar saldo em tempo real quando houver alterações em charges
  useRealtime('charges', () => {
    fetchAccumulatedBalance()
  })

  // Fechar drawer ao navegar
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navItems = [
    { label: 'Início', path: '/inicio', icon: Home },
    { label: 'Cobranças', path: '/cobrancas', icon: Receipt },
    { label: 'Clientes', path: '/clientes', icon: Users },
    { label: 'Configurações', path: '/configuracoes', icon: Settings },
  ]

  const handleLogout = () => {
    logout()
    navigate('/entrar')
  }

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      {/* Topo com Logo e Menu */}
      <div>
        <div className="p-6 border-b border-[#C9A227]/15">
          <Link to="/inicio" className="block focus:outline-none">
            <SkipLogo size={38} subtitle="COBRANÇAS PIX" />
          </Link>
        </div>

        <nav className="p-4 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/inicio' && location.pathname.startsWith(item.path))

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-[#1C1A17] text-[#F5D77F] shadow-[0_2px_12px_rgba(201,162,39,0.15)] font-semibold'
                    : 'text-[#D6D0C5] hover:text-[#F6F4EF] hover:bg-[#151413]'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-[#F5D77F] to-[#C9A227] rounded-r-full" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#C9A227]' : 'text-[#8C6A3F]'
                  }`}
                />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Rodapé do Menu com Cartão de Saldo Simulado e Perfil */}
      <div className="p-4 space-y-3 border-t border-[#C9A227]/15">
        {/* Cartão de Resumo de Saldo Simulado */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#181614] to-[#0E0D0C] border border-[#C9A227]/25 shadow-inner">
          <div className="flex items-center justify-between text-[11px] font-sans font-medium uppercase tracking-wider text-[#8C6A3F]">
            <span className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#C9A227]" />
              Saldo Simulado
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#B26A00]/20 text-[#F5D77F] border border-[#B26A00]/30 font-semibold">
              TESTE
            </span>
          </div>
          <div className="mt-1.5 font-serif text-lg font-bold text-[#F6F4EF] tracking-tight">
            {formatCurrency(simulatedTotalCents)}
          </div>
          <p className="text-[10px] text-[#6B6760] mt-1 leading-tight">
            Recebimento simulado (acumulado de cobranças pagas)
          </p>
        </div>

        {/* Info do Usuário & Sair */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] flex items-center justify-center text-[#0B0B0D] font-bold text-xs font-serif flex-shrink-0 shadow-sm">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'U'}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-semibold text-[#F6F4EF] truncate">
                {user?.name || 'Usuário Skip'}
              </span>
              <span className="text-[10px] text-[#8C6A3F] truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={() => setLogoutModalOpen(true)}
            className="p-2 text-[#8C6A3F] hover:text-[#B3261E] hover:bg-[#B3261E]/10 rounded-lg transition-colors"
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#F6F4EF] text-[#1A1916]">
      {/* Sidebar Desktop (≥ 1025px) */}
      <aside className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 left-0 bg-[#0B0B0D] border-r border-[#C9A227]/25 z-30">
        {renderNavContent()}
      </aside>

      {/* Header Mobile/Tablet (< 1025px) */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-[#0B0B0D] border-b border-[#C9A227]/20 z-40 px-4 flex items-center justify-between">
        <Link to="/inicio" className="focus:outline-none">
          <SkipLogo size={32} subtitle="PIX" />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-[#F6F4EF] hover:bg-[#1C1A17] text-[#C9A227] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6 text-[#C9A227]" />
        </button>
      </header>

      {/* Drawer Lateral Mobile com Slide-in */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro semitransparente */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Conteúdo do drawer */}
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-[#0B0B0D] border-r border-[#C9A227]/30 shadow-2xl animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-[#8C6A3F] hover:text-[#F6F4EF]"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-[260px] pt-16 lg:pt-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Rodapé Discreto */}
        <footer className="border-t border-[#D6D0C5] bg-[#EFECE4] px-4 py-4 sm:px-8 text-xs text-[#6B6760] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} Skip — Plataforma de criação de sites</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/termos" className="hover:text-[#1A1916] transition-colors">
              Termos
            </Link>
            <span>•</span>
            <Link to="/privacidade" className="hover:text-[#1A1916] transition-colors">
              Privacidade
            </Link>
            <span>•</span>
            {/* Indicador de Status da Conexão */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/30 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#B26A00] animate-pulse" />
              Modo simulado
            </span>
          </div>
        </footer>
      </div>

      {/* Botão Flutuante de Chat com Assistente Skip */}
      {location.pathname !== '/chat' && (
        <button
          onClick={() => navigate('/chat')}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs tracking-wide shadow-[0_8px_24px_rgba(201,162,39,0.4)] hover:shadow-[0_10px_30px_rgba(201,162,39,0.55)] transition-all transform hover:-translate-y-1 active:scale-95 group"
          title="Falar com Suporte Skip"
          aria-label="Abrir suporte Skip"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B0B0D]" />
          </div>
          <span className="hidden sm:inline font-sans">Suporte Skip</span>
        </button>
      )}

      {/* Modal de Confirmação de Logout */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="bg-[#121110] border border-[#C9A227]/30 text-[#F6F4EF] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#F6F4EF]">Encerrar Sessão</DialogTitle>
            <DialogDescription className="text-[#D6D0C5] text-xs">
              Tem certeza de que deseja sair da sua conta Skip Pix?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              className="border-[#8C6A3F]/40 text-[#D6D0C5] hover:bg-[#1A1916] hover:text-[#F6F4EF]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-[#B3261E] hover:bg-[#962019] text-white border-0"
            >
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
