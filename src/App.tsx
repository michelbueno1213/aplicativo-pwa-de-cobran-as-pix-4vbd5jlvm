/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/AuthRoutes'

import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import InviteAccept from './pages/InviteAccept'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConfirmEmail from './pages/ConfirmEmail'
import VerifyEmail from './pages/VerifyEmail'

import Dashboard from './pages/Dashboard'
import ChargesList from './pages/ChargesList'
import NewCharge from './pages/NewCharge'
import ChargeDetails from './pages/ChargeDetails'
import CustomersList from './pages/CustomersList'
import SettingsPage from './pages/Settings'
import ChatPage from './pages/Chat'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

import MyLinksPage from './pages/MyLinks'
import WithdrawalsPage from './pages/Withdrawals'
import SettledValuesPage from './pages/SettledValues'
import LiquidWalletsPage from './pages/LiquidWallets'
import HomologationPage from './pages/Homologation'
import PublicPaymentPage from './pages/PublicPayment'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from '@/hooks/use-toast'
import React from 'react'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota inicial com redirecionamento automático */}
          <Route path="/" element={<Index />} />

          {/* Rotas Públicas de Autenticação */}
          <Route
            path="/entrar"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/convite"
            element={
              <PublicOnlyRoute>
                <InviteAccept />
              </PublicOnlyRoute>
            }
          />
          {/* Rota legada de cadastro redirecionada para ativação de convite */}
          <Route path="/cadastro" element={<Navigate to="/convite" replace />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/redefinir-senha" element={<ResetPassword />} />
          <Route path="/confirmar-email" element={<ConfirmEmail />} />
          <Route path="/verificar-email" element={<VerifyEmail />} />

          {/* Página Pública de Pagamento (sem login) */}
          <Route path="/pagar/:id" element={<PublicPaymentPage />} />

          {/* Páginas Institucionais Públicas */}
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />

          {/* Rotas Protegidas envoltas pelo Layout Global */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/inicio" replace />} />
            <Route path="/cobrancas/nova" element={<NewCharge />} />
            <Route path="/links" element={<MyLinksPage />} />
            <Route path="/saques" element={<WithdrawalsPage />} />
            <Route path="/cobrancas" element={<ChargesList />} />
            <Route path="/cobrancas/:id" element={<ChargeDetails />} />
            <Route path="/carteiras" element={<LiquidWalletsPage />} />
            <Route path="/valores-liquidados" element={<SettledValuesPage />} />
            <Route path="/clientes" element={<CustomersList />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/suporte" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/homologacao" element={<AdminOnlyHomologation />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

const AdminOnlyHomologation: React.FC = () => {
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  React.useEffect(() => {
    if (!isAdmin) {
      toast({
        title: 'Acesso restrito',
        description: 'Acesso restrito a administradores.',
        variant: 'destructive',
      })
    }
  }, [isAdmin])

  if (!isAdmin) {
    return <Navigate to="/inicio" replace />
  }

  return <HomologationPage />
}

export default App
