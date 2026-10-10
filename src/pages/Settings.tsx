import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { validatePixKey } from '@/lib/formatters'
import {
  User,
  KeyRound,
  Radio,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Camera,
  Layers,
  Sparkles,
  UserPlus,
  Send,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth()

  // Seção Perfil
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Seção Chave Pix Padrão
  const [pixKey, setPixKey] = useState(user?.pix_key || '')
  const [savingPix, setSavingPix] = useState(false)
  const [pixSuccess, setPixSuccess] = useState<string | null>(null)
  const [pixError, setPixError] = useState<string | null>(null)

  // Seção Conectar Provedora Modal
  const [providerModalOpen, setProviderModalOpen] = useState(false)

  // Seção Convites de Novos Usuários (Modelo de Acesso por Convite)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('Rom@2025!')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Seção Logout Modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  // Salvar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    setProfileSuccess(null)
    setProfileError(null)

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
      }

      await pb.collection('users').update(user.id, payload)

      // Se alterou e-mail, dispara solicitação de confirmação de e-mail
      if (email.trim() && email.trim() !== user.email) {
        await pb.collection('users').requestEmailChange(email.trim())
        setProfileSuccess(
          'Perfil atualizado! Enviamos uma confirmação para seu novo e-mail. Confirme para concluir a troca.',
        )
      } else {
        setProfileSuccess('Perfil atualizado com sucesso!')
      }

      await refreshUser()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message || 'Erro ao atualizar perfil')
      } else {
        setProfileError('Falha ao comunicar com o servidor')
      }
    } finally {
      setSavingProfile(false)
    }
  }

  // Upload de avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await pb.collection('users').update(user.id, formData)
      await refreshUser()
      setProfileSuccess('Foto de perfil atualizada!')
    } catch {
      setProfileError('Não foi possível enviar a imagem.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Salvar Chave Pix Padrão
  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingPix(true)
    setPixSuccess(null)
    setPixError(null)

    if (pixKey.trim()) {
      const check = validatePixKey(pixKey.trim())
      if (!check.valid) {
        setPixError('Formato de chave Pix inválido (e-mail, CPF, celular ou aleatória).')
        setSavingPix(false)
        return
      }
    }

    try {
      await pb.collection('users').update(user.id, {
        pix_key: pixKey.trim(),
      })
      await refreshUser()
      setPixSuccess('Chave Pix padrão salva com sucesso!')
    } catch {
      setPixError('Erro ao salvar chave Pix.')
    } finally {
      setSavingPix(false)
    }
  }

  // Convidar novo usuário
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)

    if (!inviteEmail.trim()) {
      setInviteError('Informe o e-mail do colaborador convidado.')
      return
    }

    setInviting(true)
    try {
      // Cria usuário com e-mail + senha inicial
      await pb.collection('users').create({
        email: inviteEmail.trim(),
        name: inviteName.trim() || 'Usuário Convidado',
        password: invitePassword,
        passwordConfirm: invitePassword,
      })

      // Envia e-mail de verificação
      try {
        await pb.collection('users').requestVerification(inviteEmail.trim())
      } catch {
        // Ignora se o serviço de SMTP ainda não estiver conectado no cloud
      }

      setInviteSuccess(
        `Convite criado para ${inviteEmail.trim()}! O usuário já pode acessar com a senha temporária ${invitePassword} ou através do link de confirmação.`,
      )
      setInviteName('')
      setInviteEmail('')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setInviteError(err.message || 'Erro ao criar convite. Verifique se o e-mail já existe.')
      } else {
        setInviteError('Falha ao processar convite.')
      }
    } finally {
      setInviting(false)
    }
  }

  const avatarUrl = user?.avatar ? pb.files.getURL(user, user.avatar) : null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Título */}
      <div className="pb-2 border-b border-[#D6D0C5]/60">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1916]">
          Configurações da Conta
        </h1>
        <p className="text-xs sm:text-sm text-[#6B6760] font-sans mt-0.5">
          Gerencie seu perfil, chave Pix padrão, integrações e membros convidados
        </p>
      </div>

      {/* 1. SEÇÃO PERFIL */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E1D8]">
          <User className="w-5 h-5 text-[#C9A227]" />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1916]">Perfil do Usuário</h2>
            <p className="text-xs text-[#6B6760]">Informações pessoais e de acesso</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-xl bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/20 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Upload de Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#C9A227]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-xl flex items-center justify-center shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <label
              htmlFor="avatarUpload"
              className="absolute inset-0 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-5 h-5" />
            </label>
            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div>
            <label
              htmlFor="avatarUpload"
              className="text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] cursor-pointer"
            >
              Alterar foto de perfil
            </label>
            <p className="text-[11px] text-[#6B6760]">JPG, PNG ou GIF até 5MB</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Nome Completo
              </Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                E-mail
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
              <p className="text-[10px] text-[#8C6A3F]">
                Alterar o e-mail dispara uma mensagem de verificação na nova caixa.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingProfile}
              className="h-10 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs border-0"
            >
              {savingProfile ? 'Salvando...' : 'Atualizar Perfil'}
            </Button>
          </div>
        </form>
      </div>

      {/* 2. SEÇÃO CHAVE PIX PADRÃO */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E1D8]">
          <KeyRound className="w-5 h-5 text-[#C9A227]" />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1916]">Chave Pix Padrão</h2>
            <p className="text-xs text-[#6B6760]">
              Esta chave será preenchida automaticamente ao criar novas cobranças
            </p>
          </div>
        </div>

        {pixSuccess && (
          <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{pixSuccess}</span>
          </div>
        )}

        {pixError && (
          <div className="p-3 rounded-xl bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/20 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{pixError}</span>
          </div>
        )}

        <form onSubmit={handleSavePix} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
              Chave Pix (E-mail, CPF, CNPJ, Celular ou Aleatória)
            </Label>
            <Input
              type="text"
              placeholder="Ex: seu-pix@email.com ou 11999999999"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              className="h-11 bg-[#FAF8F3] border-[#D6D0C5] text-xs font-mono text-[#1A1916] rounded-xl"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={savingPix}
              className="h-10 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs border-0"
            >
              {savingPix ? 'Salvando...' : 'Salvar Chave Pix'}
            </Button>
          </div>
        </form>
      </div>

      {/* 3. SEÇÃO PROVEDORA PIX & DEPIX LIQUID */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E1D8]">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-[#C9A227]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1A1916]">
                Conexão da Provedora Pix & DePix
              </h2>
              <p className="text-xs text-[#6B6760]">
                Status da liquidação financeira e liquidez em Bitcoin/Liquid
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/30 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#B26A00] animate-pulse" />
            Modo Simulado Ativo
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E6E1D8] space-y-2">
          <p className="text-xs text-[#1A1916] leading-relaxed">
            Atualmente suas cobranças são emitidas em <strong>Fluxo Simulado</strong>. Nenhum
            cliente transfere valores reais por enquanto.
          </p>
          <p className="text-xs text-[#8C6A3F] leading-relaxed">
            Em breve você poderá conectar sua provedora Pix e a{' '}
            <strong>carteira Liquid via DePix</strong> para processar liquidações reais diretas.
          </p>
        </div>

        <div className="flex justify-start">
          <Button
            type="button"
            onClick={() => setProviderModalOpen(true)}
            className="h-10 px-5 bg-[#FAF8F3] border border-[#C9A227] text-[#1A1916] hover:bg-[#C9A227]/10 text-xs font-semibold rounded-xl"
          >
            Conectar provedora
          </Button>
        </div>
      </div>

      {/* 4. SEÇÃO ACESSO POR CONVITE (GERENCIAR CONVITES) */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#E6E1D8]">
          <UserPlus className="w-5 h-5 text-[#C9A227]" />
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1A1916]">
              Acesso por Convite (Membros da Equipe)
            </h2>
            <p className="text-xs text-[#6B6760]">
              O cadastro público é fechado. Convide novos operadores e sócios aqui.
            </p>
          </div>
        </div>

        {inviteSuccess && (
          <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{inviteSuccess}</span>
          </div>
        )}

        {inviteError && (
          <div className="p-3 rounded-xl bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/20 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{inviteError}</span>
          </div>
        )}

        <form onSubmit={handleInviteUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Nome do Convidado
              </Label>
              <Input
                type="text"
                placeholder="Ex: Carlos Oliveira"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                E-mail do Convidado *
              </Label>
              <Input
                type="email"
                placeholder="colaborador@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs text-[#1A1916] rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#1A1916]">
                Senha Inicial Padrão
              </Label>
              <Input
                type="text"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="h-10 bg-[#FAF8F3] border-[#D6D0C5] text-xs font-mono text-[#1A1916] rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={inviting}
              className="h-10 px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs border-0 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {inviting ? 'Criando convite...' : 'Gerar e Enviar Convite'}
            </Button>
          </div>
        </form>
      </div>

      {/* 5. SEÇÃO SAIR */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#1A1916]">Encerrar Sessão</h2>
          <p className="text-xs text-[#6B6760]">Desconectar sua conta neste dispositivo</p>
        </div>

        <Button
          variant="outline"
          onClick={() => setLogoutModalOpen(true)}
          className="border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E]/10 text-xs font-semibold rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-1.5" />
          Sair da Conta
        </Button>
      </div>

      {/* MODAL CONECTAR PROVEDORA */}
      <Dialog open={providerModalOpen} onOpenChange={setProviderModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-[#1A1916] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C9A227]" />
              Conectar Provedora Pix & DePix Liquid
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              Integração bancária e carteira autocustodial da próxima versão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D8] space-y-2">
              <p className="text-[#1A1916] leading-relaxed">
                Estamos finalizando a parceria homologada com a provedora Pix e o gateway de
                liquidação DePix para a rede Liquid Network.
              </p>
              <p className="text-[#8C6A3F] leading-relaxed">
                Assim que a parceria for aprovada, você poderá inserir suas credenciais de produção
                e receber seus pagamentos instantaneamente.
              </p>
            </div>

            <div className="space-y-3 opacity-60">
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-[#1A1916]">
                  Chave da API (Client ID)
                </Label>
                <Input
                  disabled
                  value="Disponível na próxima versão"
                  className="bg-[#F1EFEA] border-[#D6D0C5] text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-[#1A1916]">
                  Segredo da API (Client Secret)
                </Label>
                <Input
                  disabled
                  type="password"
                  value="••••••••••••••••••••••••"
                  className="bg-[#F1EFEA] border-[#D6D0C5] text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-[#1A1916]">
                  Endereço da Carteira Liquid (DePix)
                </Label>
                <Input
                  disabled
                  value="Disponível na próxima versão"
                  className="bg-[#F1EFEA] border-[#D6D0C5] text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setProviderModalOpen(false)}
              className="w-full bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-xs border-0"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE SAIR */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#1A1916]">
              Encerrar Sessão
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              Tem certeza de que deseja sair? Suas cobranças simuladas continuarão salvas com
              segurança.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              className="border-[#D6D0C5] text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={logout}
              className="bg-[#B3261E] hover:bg-[#962019] text-white text-xs border-0"
            >
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SettingsPage
