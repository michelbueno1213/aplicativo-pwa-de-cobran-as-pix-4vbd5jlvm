import React, { useId } from 'react'

interface PixQrCodeProps {
  value: string
  size?: number
  isSimulated?: boolean
  className?: string
}

/**
 * Gerador de matriz determinística para QR Code visual sem bibliotecas externas pesadas.
 * Para modo simulado, gera um padrão SVG estilizado com os 3 marcadores angulares característicos
 * de QR Codes reais e padrão determinístico de módulos com marca d'água "SIMULADO".
 */
export const PixQrCode: React.FC<PixQrCodeProps> = ({
  value,
  size = 220,
  isSimulated = true,
  className = '',
}) => {
  const gradientId = useId()

  // Gerador determinístico de bits baseado no texto de entrada
  const matrixSize = 25
  const cells: boolean[][] = []

  // Inicializa matriz
  for (let r = 0; r < matrixSize; r++) {
    cells[r] = []
    for (let c = 0; c < matrixSize; c++) {
      cells[r][c] = false
    }
  }

  // Desenhar os 3 marcadores angulares clássicos de QR Code (7x7)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4
        cells[startY + r][startX + c] = isBorder || isCenter
      }
    }
  }

  drawFinder(0, 0) // Superior esquerdo
  drawFinder(matrixSize - 7, 0) // Superior direito
  drawFinder(0, matrixSize - 7) // Inferior esquerdo

  // Padrão de timing
  for (let i = 8; i < matrixSize - 8; i++) {
    cells[6][i] = i % 2 === 0
    cells[i][6] = i % 2 === 0
  }

  // Preenche dados simulados determinísticos com hash do value
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Ignorar áreas dos finders
      const inTopLeft = r < 8 && c < 8
      const inTopRight = r < 8 && c >= matrixSize - 8
      const inBottomLeft = r >= matrixSize - 8 && c < 8
      if (inTopLeft || inTopRight || inBottomLeft) continue

      // Pseudo-random baseado em posição e hash
      const bitVal = Math.abs(Math.sin(hash + r * 13 + c * 37))
      cells[r][c] = bitVal > 0.48
    }
  }

  const cellSize = size / matrixSize

  return (
    <div
      className={`relative inline-block bg-white p-3 rounded-2xl border border-[#D6D0C5] shadow-sm select-none ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full block rounded-lg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A1916" />
            <stop offset="100%" stopColor="#2D2820" />
          </linearGradient>
        </defs>

        {/* Fundo Branco */}
        <rect width={size} height={size} fill="#FFFFFF" />

        {/* Células QR */}
        {cells.map((row, r) =>
          row.map((active, c) => {
            if (!active) return null
            const x = c * cellSize
            const y = r * cellSize
            // Arredondamento suave nos módulos
            const rx = Math.min(1.5, cellSize * 0.15)
            return (
              <rect
                key={`${r}-${c}`}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={rx}
                fill={`url(#${gradientId})`}
              />
            )
          }),
        )}

        {/* Badge central no modo simulado */}
        {isSimulated && (
          <g transform={`translate(${size / 2 - 36}, ${size / 2 - 14})`}>
            <rect width="72" height="28" rx="6" fill="#FAF8F3" stroke="#C9A227" strokeWidth="1.5" />
            <text
              x="36"
              y="18"
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#8C6A3F"
              letterSpacing="0.8"
            >
              SIMULAÇÃO
            </text>
          </g>
        )}
      </svg>

      {/* Tarja de aviso visual no modo simulado */}
      {isSimulated && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#C9A227] text-[#0B0B0D] font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm border border-[#FAF8F3]">
          QR Code Simulado
        </div>
      )}
    </div>
  )
}
