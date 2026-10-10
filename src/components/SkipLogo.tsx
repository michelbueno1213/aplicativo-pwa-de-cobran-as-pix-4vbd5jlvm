import React from 'react'

interface SkipLogoProps {
  className?: string
  size?: number
  showText?: boolean
  subtitle?: string
}

export const SkipLogo: React.FC<SkipLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  subtitle = 'COBRANÇAS PIX',
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Monograma com brasão ornamentado e brilho sutil */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1C1A17] via-[#0B0B0D] to-[#121110] border border-[#C9A227]/40 shadow-[0_4px_16px_rgba(201,162,39,0.2)] overflow-hidden flex-shrink-0 group"
        style={{ width: size, height: size }}
      >
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C9A227]/20 via-transparent to-[#8C6A3F]/30 opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Brasão ornamentado SVG */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
        >
          {/* Escudo externo ornamentado */}
          <path
            d="M24 4L38 10V22C38 31.5 32 39.5 24 44C16 39.5 10 31.5 10 22V10L24 4Z"
            stroke="url(#goldGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Borda interna */}
          <path
            d="M24 8L34 12.5V21C34 28.5 29.5 35 24 38.5C18.5 35 14 28.5 14 21V12.5L24 8Z"
            stroke="#8C6A3F"
            strokeWidth="1"
            strokeOpacity="0.7"
          />
          {/* Monograma 'S' estilizado */}
          <path
            d="M28 17C28 15.34 26.21 14 24 14C21.79 14 20 15.34 20 17C20 20 28 19.5 28 23.5C28 25.5 26 27 24 27C21.5 27 19.8 25.5 19.8 23.8"
            stroke="url(#goldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Raio/símbolo Pix cruzado sutil */}
          <circle cx="24" cy="33" r="1.5" fill="#C9A227" />
          <defs>
            <linearGradient
              id="goldGrad"
              x1="10"
              y1="4"
              x2="38"
              y2="44"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F5D77F" />
              <stop offset="0.5" stopColor="#C9A227" />
              <stop offset="1" stopColor="#8C6A3F" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-serif text-xl font-bold tracking-tight text-[#F6F4EF] flex items-center gap-1.5 leading-none">
            Skip
            <span className="text-[#C9A227] text-xs font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#C9A227]/15 border border-[#C9A227]/30">
              PIX
            </span>
          </span>
          {subtitle && (
            <span className="text-[10px] font-sans font-medium uppercase tracking-[0.2em] text-[#8C6A3F] mt-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SkipLogo
