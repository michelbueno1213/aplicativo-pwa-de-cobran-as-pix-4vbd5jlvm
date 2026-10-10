import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0B0D] text-[#F6F4EF]">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-sans text-[#8C6A3F] tracking-widest uppercase">ROM</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />
  }

  return <Navigate to="/entrar" replace />
}
