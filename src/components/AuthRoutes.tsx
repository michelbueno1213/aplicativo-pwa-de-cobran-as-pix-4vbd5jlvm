import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0B0D] text-[#F6F4EF]">
        <div className="w-12 h-12 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-sans text-[#8C6A3F] tracking-wider uppercase">
          Carregando ROM...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0B0D] text-[#F6F4EF]">
        <Loader2 className="w-8 h-8 text-[#C9A227] animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />
  }

  return <>{children}</>
}
