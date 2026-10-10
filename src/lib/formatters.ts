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
