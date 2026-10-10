import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface UserProfile extends RecordModel {
  name?: string
  email?: string
  avatar?: string
  pix_key?: string
  role?: 'merchant' | 'admin'
  is_admin?: boolean
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(
    (pb.authStore.record as unknown as UserProfile) || null,
  )
  const [token, setToken] = useState<string | null>(pb.authStore.token || null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = async () => {
    try {
      if (pb.authStore.isValid && pb.authStore.record) {
        const refreshed = await pb.collection('users').getOne<UserProfile>(pb.authStore.record.id)
        setUser(refreshed)
      } else {
        setUser(null)
      }
    } catch {
      // Se der erro ao carregar usuário, limpar sessão
      pb.authStore.clear()
      setUser(null)
      setToken(null)
    }
  }

  useEffect(() => {
    const unsub = pb.authStore.onChange((newToken, model) => {
      setToken(newToken || null)
      setUser((model as unknown as UserProfile) || null)
    })

    // Checagem inicial
    if (pb.authStore.isValid) {
      refreshUser().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    const authData = await pb.collection('users').authWithPassword<UserProfile>(email, pass)
    setUser(authData.record)
    setToken(authData.token)
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
