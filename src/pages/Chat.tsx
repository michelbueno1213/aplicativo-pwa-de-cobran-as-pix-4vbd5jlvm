import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  displayableMessages,
  type DisplayMessage,
  type AgentMessage,
} from '@/lib/skipAi'
import {
  Send,
  MessageCircle,
  Sparkles,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Radio,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const ChatPage: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Eu sou o assistente de Suporte ROM. Posso esclarecer dúvidas sobre cobranças Pix, como funciona o Modo Simulado, gerenciamento de clientes ou a futura integração com carteira Liquid e DePix. Como posso ajudar você hoje?',
      created: new Date().toISOString(),
    },
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Cancelar stream ao desmontar
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputMessage.trim()
    if (!text || loading) return

    setError(null)
    setInputMessage('')

    // Adiciona a mensagem do usuário
    const userMsg: DisplayMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      created: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // Mensagem temporária do assistente para streaming
    const assistantId = `ast_${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        created: new Date().toISOString(),
      },
    ])

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/support/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({
            message: text,
            conversation_id: conversationId,
            stream: true,
          }),
          signal: abortController.signal,
        },
      )

      const result = await streamAgentChat(response, {
        onChunk: (_delta, full) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)),
          )
        },
        signal: abortController.signal,
      })

      const newConvId = response.headers.get('X-Conversation-Id') || result.conversation_id
      if (newConvId) setConversationId(newConvId)
    } catch (err: unknown) {
      if (abortController.signal.aborted) return

      // Fallback amigável se a IA estiver sem cota ou indisponível
      const fallbackContent =
        'Compreendi sua dúvida sobre a plataforma ROM! O modo simulado permite testar emissão e compartilhamento de cobranças. Assim que a provedora Pix for aprovada, você poderá conectar suas chaves de API e receber DePix na carteira Liquid. Se precisar de suporte adicional, entre em contato com nosso time administrativo.'

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: m.content || fallbackContent,
              }
            : m,
        ),
      )
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl border border-[#D6D0C5] shadow-xs overflow-hidden animate-fade-in">
      {/* Header do Chat */}
      <div className="p-4 sm:p-5 border-b border-[#E6E1D8] bg-[#0B0B0D] text-[#F6F4EF] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] flex items-center justify-center font-bold shadow-sm">
            <Bot className="w-5 h-5 text-[#0B0B0D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-bold text-[#F6F4EF]">
                Suporte ROM
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-[#8C6A3F]">
              Assistente oficial para dúvidas de cobranças Pix e DePix
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1A17] text-[#C9A227] border border-[#C9A227]/30 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
          ROM IA Agent
        </span>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAF8F3]">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-br from-[#C9A227] to-[#A8861F] text-[#0B0B0D]'
                    : 'bg-[#0B0B0D] text-[#F5D77F] border border-[#C9A227]/30'
                }`}
              >
                {isUser ? (
                  user?.name ? (
                    user.name[0].toUpperCase()
                  ) : (
                    'U'
                  )
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Balão */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-medium rounded-tr-none'
                    : 'bg-white text-[#1A1916] border border-[#E6E1D8] rounded-tl-none'
                }`}
              >
                {msg.content ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="flex items-center gap-2 text-[#8C6A3F]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Pensando...</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Rodapé / Input de Mensagem */}
      <div className="p-3 sm:p-4 border-t border-[#E6E1D8] bg-white">
        {error && (
          <div className="mb-2 p-2 rounded-lg bg-[#B3261E]/15 text-[#B3261E] text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Digite sua dúvida sobre o ROM..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 h-11 bg-[#FAF8F3] border-[#D6D0C5] text-xs sm:text-sm text-[#1A1916] rounded-xl focus-visible:ring-[#C9A227]"
          />
          <Button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="h-11 px-4 sm:px-5 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-xs rounded-xl border-0 flex items-center gap-1.5 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </>
            )}
          </Button>
        </form>

        <p className="text-[10px] text-center text-[#8C6A3F] mt-2">
          Atendimento inteligente com respostas baseadas nas regras do ROM e modo simulado.
        </p>
      </div>
    </div>
  )
}

export default ChatPage
