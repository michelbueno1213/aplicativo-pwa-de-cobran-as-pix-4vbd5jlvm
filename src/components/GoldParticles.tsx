import React from 'react'

export const GoldParticles: React.FC = () => {
  // Gera partículas douradas flutuando suavemente
  const particles = [
    { top: '12%', left: '15%', size: 4, delay: '0s', duration: '7s' },
    { top: '25%', left: '80%', size: 3, delay: '1.2s', duration: '9s' },
    { top: '45%', left: '20%', size: 5, delay: '2.5s', duration: '8s' },
    { top: '65%', left: '75%', size: 3.5, delay: '0.8s', duration: '10s' },
    { top: '80%', left: '30%', size: 4, delay: '3.1s', duration: '7.5s' },
    { top: '35%', left: '60%', size: 2.5, delay: '1.8s', duration: '11s' },
    { top: '85%', left: '85%', size: 4.5, delay: '2.0s', duration: '8.5s' },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Luz central bronze/dourada */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-[#C9A227]/12 via-[#8C6A3F]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {particles.map((p, idx) => (
        <span
          key={idx}
          className="absolute rounded-full bg-gradient-to-tr from-[#C9A227] to-[#F5D77F] shadow-[0_0_8px_#C9A227] opacity-60 animate-float"
          style={{
            top: p.top,
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

export default GoldParticles
