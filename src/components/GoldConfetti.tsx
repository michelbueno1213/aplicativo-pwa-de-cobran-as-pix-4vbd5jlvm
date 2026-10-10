import React from 'react'

export const GoldConfetti: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null

  // Gera partículas de confete dourado caindo
  const items = Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 0.4}s`,
    animationDuration: `${1 + Math.random() * 0.8}s`,
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    color: i % 2 === 0 ? '#C9A227' : i % 3 === 0 ? '#F5D77F' : '#8C6A3F',
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {items.map((c) => (
        <span
          key={c.id}
          className="absolute top-0 rounded-xs animate-fade-out-down shadow-sm"
          style={{
            left: c.left,
            width: `${c.size}px`,
            height: `${c.size * 0.7}px`,
            backgroundColor: c.color,
            animationDelay: c.animationDelay,
            animationDuration: c.animationDuration,
            transform: `rotate(${c.rotate}deg)`,
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  )
}

export default GoldConfetti
