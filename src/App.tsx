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
            <Route path="/cobrancas" element={<ChargesList />} />
            <Route path="/cobrancas/nova" element={<NewCharge />} />
            <Route path="/cobrancas/:id" element={<ChargeDetails />} />
            <Route path="/clientes" element={<CustomersList />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
