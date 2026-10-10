export function formatCurrency(amountCents: number): string {
  const value = (amountCents || 0) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateBr(dateString: string | undefined): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateString
  }
}

export function maskPixKey(key: string | undefined): string {
  if (!key) return '—'
  const trimmed = key.trim()
  if (trimmed.length <= 6) return '***'
  const start = trimmed.slice(0, 3)
  const end = trimmed.slice(-3)
  return `${start}•••${end}`
}

export function maskAddress(address: string | undefined): string {
  if (!address) return '—'
  const trimmed = address.trim()
  if (trimmed.length <= 12) return trimmed
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-6)}`
}

export function validateLiquidAddress(address: string): { valid: boolean; reason?: string } {
  const clean = address.trim()
  if (!clean) {
    return { valid: false, reason: 'Informe o endereço da carteira Liquid' }
  }

  // Endereços Liquid / Elements válidos tipicamente iniciam com:
  // - "lq1" (Liquid bech32)
  // - "ex1" (Liquid confidential bech32)
  // - "tlq1" ou "tex1" (testnet liquid)
  // - "Q" ou "G" (Liquid confidential legacy)
  // - "vtc" / "el" em outras variantes Elements
  // - comprimento mínimo plausível de 26 caracteres alfanuméricos
  const lower = clean.toLowerCase()
  const isBech32Liquid =
    lower.startsWith('lq1') ||
    lower.startsWith('ex1') ||
    lower.startsWith('tlq1') ||
    lower.startsWith('tex1')
  const isLegacyLiquid = clean.startsWith('Q') || clean.startsWith('G') || clean.startsWith('V')

  // Validação leve de plausibilidade
  if (!isBech32Liquid && !isLegacyLiquid) {
    // Aceita também formato geral Liquid/Elements se tiver comprimento razoável e caracteres válidos
    const isGeneralLiquidFormat = /^[a-zA-Z0-9_]{26,120}$/.test(clean)
    if (!isGeneralLiquidFormat) {
      return {
        valid: false,
        reason:
          'Endereço incompatível com rede Liquid/DePix (esperado lq1..., ex1... ou formato Elements)',
      }
    }
  }

  if (clean.length < 24) {
    return { valid: false, reason: 'Endereço Liquid muito curto' }
  }

  return { valid: true }
}

export function validatePixKey(key: string): { valid: boolean; type: string } {
  const clean = key.trim()
  if (!clean) return { valid: false, type: 'inválida' }

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { valid: true, type: 'E-mail' }
  }

  // CPF (11 dígitos numéricos ou formatado)
  const digitsOnly = clean.replace(/\D/g, '')
  if (digitsOnly.length === 11) {
    return { valid: true, type: 'CPF' }
  }

  // CNPJ (14 dígitos)
  if (digitsOnly.length === 14) {
    return { valid: true, type: 'CNPJ' }
  }

  // Celular BR (+55 ou DDD + 9 dígitos)
  if (/^(\+55)?\d{10,11}$/.test(digitsOnly)) {
    return { valid: true, type: 'Telefone' }
  }

  // Chave aleatória (EVP UUID padrão ou alfanumérica ~32-36 chars)
  if (
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(clean) ||
    clean.length >= 20
  ) {
    return { valid: true, type: 'Chave Aleatória' }
  }

  return { valid: false, type: 'inválida' }
}
