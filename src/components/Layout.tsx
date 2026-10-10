import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Wallet,
  Coins,
  ShieldAlert,
  ArrowRightLeft,
  Link as LinkIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { RomLogo } from '@/components/SkipLogo'
import { Button } from '@/components/ui/button'
import { Outlet } from 'react-router-dom'

export const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/entrar')
  }

  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  // Ordem exata dos itens exigida pela especificação:
  // Início, Nova Cobrança, Meus Links, Saques, Histórico, Carteiras Liquid, Valores Liquidados, Configurações, Suporte
  // mais "Homologação" visível SOMENTE para administradores (não-admins nunca veem o item)
  const displayItems = [
    { title: 'Início', path: '/inicio', icon: LayoutDashboard },
    { title: 'Nova Cobrança', path: '/cobrancas/nova', icon: PlusCircle },
    { title: 'Meus Links', path: '/links', icon: LinkIcon },
    { title: 'Saques', path: '/saques', icon: ArrowRightLeft },
    { title: 'Histórico', path: '/cobrancas', icon: Receipt },
    { title: 'Carteiras Liquid', path: '/carteiras', icon: Wallet },
    { title: 'Valores Liquidados', path: '/valores-liquidados', icon: Coins },
    { title: 'Configurações', path: '/configuracoes', icon: Settings },
    { title: 'Suporte', path: '/suporte', icon: HelpCircle },
    ...(isAdmin
      ? [
          {
            title: 'Homologação',
            path: '/homologacao',
            icon: ShieldAlert,
          },
        ]
      : []),
  ]

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [base, query] = path.split('?')
      return location.pathname === base && location.search.includes(query)
    }
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141413] flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#141413] text-[#FAF8F5] border-r border-[#2C2A29] shrink-0 min-h-screen">
        <div className="p-6 border-b border-[#2C2A29]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <RomLogo size={32} />
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#FAF8F5]">
                ROM
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-[#C5A059] font-medium">
                Pix2DePix Liquid
              </span>
            </div>
          </Link>
        </div>

        {/* Informações da Conta do Comerciante */}
        <div className="px-6 py-4 border-b border-[#2C2A29]/60">
          <p className="text-xs text-[#8C8A7B]">Conta do Comerciante</p>
          <p className="text-sm font-semibold text-[#FAF8F5] truncate mt-0.5">
            {user?.name || user?.email || 'Comerciante'}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-[#A29F95]">Modelo Não Custodial</span>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 p-4 space-y-1">
          {displayItems.map((item) => {
            const active = isActive(item.path)
            const Icon = item.icon
            return (
              <Link
                key={item.title}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#C5A059] text-[#141413]'
                    : 'text-[#A29F95] hover:text-[#FAF8F5] hover:bg-[#201F1D]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#141413]' : 'text-[#8C8A7B]'}`} />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#2C2A29]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-[#A29F95] hover:text-[#FAF8F5] hover:bg-[#201F1D] transition-colors"
          >
            <LogOut className="w-4 h-4 text-[#8C8A7B]" />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-[#141413] text-[#FAF8F5] border-b border-[#2C2A29] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center gap-2">
          <RomLogo size={28} />
          <span className="font-serif text-lg font-bold text-[#FAF8F5]">ROM</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-[#A29F95] hover:text-[#FAF8F5]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Menu Aberto Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[53px] bg-[#141413] z-40 p-4 flex flex-col justify-between">
          <nav className="space-y-1">
            {displayItems.map((item) => {
              const active = isActive(item.path)
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-[#C5A059] text-[#141413]'
                      : 'text-[#A29F95] hover:text-[#FAF8F5] hover:bg-[#201F1D]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <div className="pt-4 border-t border-[#2C2A29]">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium text-red-400"
            >
              <LogOut className="w-4 h-4" />
              Encerrar Sessão
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal com Rodapé Institucional */}
      <div className="flex-1 flex flex-col justify-between">
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1">{children || <Outlet />}</main>

        {/* Nota Institucional no rodapé do painel */}
        <footer className="px-4 py-4 md:px-8 border-t border-[#D6D0C5]/40 text-center text-xs text-[#8C8A7B]">
          Emissão real de cobranças habilitada somente após aprovação da provedora e implantação das
          credenciais.
        </footer>
      </div>
    </div>
  )
}

export default Layout
