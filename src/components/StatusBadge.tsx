import React from 'react'

export type ChargeStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

interface StatusBadgeProps {
  status: ChargeStatus | string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
          Paga
        </span>
      )
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/25 shadow-xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B26A00] animate-pulse" />
          Pendente
        </span>
      )
    case 'expired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#F1EFEA] text-[#6B6760] border border-[#D6D0C5] ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B6760]" />
          Expirada
        </span>
      )
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/20 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B3261E]" />
          Cancelada
        </span>
      )
    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs bg-gray-100 text-gray-700 ${className}`}
        >
          {status}
        </span>
      )
  }
}

export default StatusBadge
