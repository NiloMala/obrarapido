"use client";

import { useState, useEffect, useRef } from "react";
import { FiSend, FiX, FiMessageSquare } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";

interface ChatProps {
  open: boolean;
  onClose: () => void;
  serviceRequestId: string;
  clientId: string;
  professionalId: string;
  clientName?: string;
  professionalName?: string;
  currentUserId: string;
  isClient: boolean; // true se o usuário atual é cliente, false se é profissional
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read_at?: string | null;
  is_read?: boolean;
}

export default function Chat({ 
  open, 
  onClose, 
  serviceRequestId,
  clientId, 
  professionalId, 
  clientName, 
  professionalName, 
  currentUserId, 
  isClient 
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneWarning, setPhoneWarning] = useState("");
  // Estados para indicador de digitação
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Função para notificar que está digitando
  const notifyTyping = () => {
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUserId,
          service_request_id: serviceRequestId,
          typing: true
        }
      });
    }
  };

  // Função para notificar que parou de digitar
  const notifyStoppedTyping = () => {
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: currentUserId,
          service_request_id: serviceRequestId,
          typing: false
        }
      });
    }
  };

  // Função para detectar números de telefone
  const detectPhoneNumber = (text: string): boolean => {
    // Padrões para detectar telefones brasileiros
    const phonePatterns = [
      /\b\d{2}\s?\d{4,5}[-\s]?\d{4}\b/g, // (xx) xxxxx-xxxx ou xx xxxxx-xxxx
      /\(\d{2}\)\s?\d{4,5}[-\s]?\d{4}/g, // (xx) xxxxx-xxxx
      /\b\d{10,11}\b/g, // xxxxxxxxxx ou xxxxxxxxxxx (sequência de 10-11 dígitos)
      /\b\d{9}\b/g, // xxxxxxxxx (9 dígitos - celular sem DDD)
      /\b\d{8}\b/g, // xxxxxxxx (8 dígitos - fixo sem DDD)
      /\b\d{2}[-\s]\d{4,5}[-\s]?\d{4}\b/g, // xx-xxxxx-xxxx
      /\+55\s?\d{2}\s?\d{4,5}[-\s]?\d{4}/g, // +55 xx xxxxx-xxxx
      /whats?\s?\d{8,}/gi, // whats seguido de 8+ dígitos
      /zap\s?\d{8,}/gi, // zap seguido de 8+ dígitos
      /fone\s?\d{8,}/gi, // fone seguido de 8+ dígitos
      /tel\s?\d{8,}/gi, // tel seguido de 8+ dígitos
      /\b9\d{8}\b/g, // 9xxxxxxxx (celular começando com 9)
      /\b[2-5]\d{7}\b/g, // fixo começando com 2,3,4,5 + 7 dígitos
      /\b9\d{4}[-\s]\d{4}\b/g, // 9xxxx-xxxx (celular com hífen)
      /\b[2-5]\d{3}[-\s]\d{4}\b/g, // xxxx-xxxx (fixo com hífen)
      /\b\d{5}[-\s]\d{4}\b/g, // xxxxx-xxxx (qualquer número com hífen 5+4)
      /\b\d{4}[-\s]\d{4}\b/g, // xxxx-xxxx (qualquer número com hífen 4+4)
    ];
    
    return phonePatterns.some(pattern => pattern.test(text));
  };

  // Buscar mensagens existentes
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at,
          service_request_id,
          read_at,
          is_read
        `)
        .eq('service_request_id', serviceRequestId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        // Garantir que todas as mensagens tenham os campos de leitura
        const messagesWithReadStatus = data.map(msg => ({
          ...msg,
          is_read: msg.is_read === true, // Garantir boolean
          read_at: msg.read_at || null
        }));
        
        setMessages(messagesWithReadStatus);
        setTimeout(scrollToBottom, 100);
        
        // Marcar mensagens recebidas como lidas (apenas mensagens que EU recebi)
        const hasUnreadReceivedMessages = messagesWithReadStatus.some(msg => 
          msg.receiver_id === currentUserId && !msg.is_read
        );
        
        if (hasUnreadReceivedMessages) {
          await markMessagesAsRead();
        }
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    }
  };

  // Indicador de digitação
  const handleTyping = () => {
    // Notificar que está digitando
    notifyTyping();
    
    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Definir novo timeout para parar de digitar após 1 segundo de inatividade
    typingTimeoutRef.current = setTimeout(() => {
      notifyStoppedTyping();
    }, 1000);
  };

  // Função para formatar timestamp de forma mais amigável
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return `Ontem ${date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Marcar mensagens como lidas
  const markMessagesAsRead = async () => {
    try {
      // Verificar se temos os dados necessários
      if (!serviceRequestId || !currentUserId) {
        console.debug('Dados incompletos para marcar mensagens como lidas:', {
          serviceRequestId,
          currentUserId
        });
        return;
      }

      console.debug('Marcando mensagens como lidas:', {
        serviceRequestId,
        currentUserId,
        serviceRequestIdType: typeof serviceRequestId,
        currentUserIdType: typeof currentUserId
      });

      const { data, error } = await supabase.rpc('mark_messages_as_read', {
        p_service_request_id: serviceRequestId,
        p_user_id: currentUserId
      });
      
      if (error) {
        // Se a função não existir, apenas log em debug (não é erro crítico)
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.debug('Função mark_messages_as_read ainda não foi criada no banco de dados');
          return;
        }
        console.error('Erro ao marcar mensagens como lidas:', {
          error,
          data,
          serviceRequestId,
          currentUserId,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
          fullError: JSON.stringify(error, null, 2)
        });
      } else {
        console.debug('Mensagens marcadas como lidas com sucesso');
        // Recarregar mensagens para atualizar o status
        setTimeout(fetchMessages, 500);
      }
    } catch (err: any) {
      // Se a função não existir, apenas log em debug
      if (err?.message?.includes('function') && err?.message?.includes('does not exist')) {
        console.debug('Função mark_messages_as_read ainda não foi criada no banco de dados');
        return;
      }
      console.error('Erro ao marcar mensagens como lidas (catch):', {
        err,
        serviceRequestId,
        currentUserId,
        message: err?.message
      });
    }
  };

  // Enviar mensagem
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Verificar se a mensagem contém número de telefone
    if (detectPhoneNumber(newMessage)) {
      setPhoneWarning("❌ Não é permitido compartilhar números de telefone no chat. Use apenas a plataforma para comunicação.");
      setTimeout(() => setPhoneWarning(""), 5000);
      return;
    }

    setLoading(true);
    setPhoneWarning("");
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          service_request_id: serviceRequestId,
          sender_id: currentUserId,
          receiver_id: isClient ? professionalId : clientId,
          message: newMessage.trim()
        });

      if (!error) {
        setNewMessage("");
        setPhoneWarning(""); // Limpar aviso de telefone
        notifyStoppedTyping(); // Parar indicador de digitação
        fetchMessages(); // Recarregar mensagens
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
    setLoading(false);
  };

  // Configurar listener para novas mensagens em tempo real
  useEffect(() => {
    if (!open) return;

    fetchMessages();

    // Canal principal para mensagens
    const messageSubscription = supabase
      .channel(`chat-${serviceRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `service_request_id=eq.${serviceRequestId}`
        },
        (payload: any) => {
          console.debug('Nova mensagem recebida:', payload.new);
          const newMessage = {
            ...payload.new,
            is_read: payload.new.is_read === true, // Garantir boolean
            read_at: payload.new.read_at || null
          };
          
          setMessages(prev => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
          
          // Se a nova mensagem foi enviada para mim, marcar como lida automaticamente
          if (payload.new.receiver_id === currentUserId) {
            setTimeout(markMessagesAsRead, 500);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `service_request_id=eq.${serviceRequestId}`
        },
        (payload: any) => {
          console.debug('Mensagem atualizada:', payload.new);
          // Atualizar status de leitura em tempo real
          const updatedMessage = {
            ...payload.new,
            is_read: payload.new.is_read === true, // Garantir boolean
            read_at: payload.new.read_at || null
          };
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    // Canal separado para indicador de digitação
    const typingSubscription = supabase
      .channel(`typing-${serviceRequestId}`)
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        // Só mostrar indicador se não for eu digitando
        if (payload.payload.user_id !== currentUserId) {
          setOtherUserTyping(payload.payload.typing);
          
          // Auto-remover o indicador após 3 segundos
          if (payload.payload.typing) {
            setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe();

    // Armazenar referência do canal de digitação
    typingChannelRef.current = typingSubscription;

    return () => {
      messageSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      notifyStoppedTyping(); // Notificar que parou de digitar ao fechar
    };
  }, [open, serviceRequestId]);

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      notifyStoppedTyping();
    };
  }, []);
  useEffect(() => {
    if (open && messages.length > 0) {
      // Verificar se há mensagens não lidas que eu recebi
      const hasUnreadReceivedMessages = messages.some(msg => 
        msg.receiver_id === currentUserId && msg.is_read !== true
      );
      
      console.debug('Verificando mensagens não lidas:', {
        hasUnreadReceivedMessages,
        currentUserId,
        messagesCount: messages.length,
        unreadMessages: messages.filter(msg => msg.receiver_id === currentUserId && msg.is_read !== true)
      });
      
      if (hasUnreadReceivedMessages) {
        // Aguardar um pouco antes de marcar como lidas para simular visualização
        setTimeout(markMessagesAsRead, 1000);
      }
    }
  }, [open, messages, currentUserId]);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.5)', 
      zIndex: 2000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: 16, 
        width: '90%', 
        maxWidth: 500, 
        height: '80%', 
        maxHeight: 600, 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 4px 32px 0 rgba(80,120,200,0.15)' 
      }}>
        {/* Header do Chat */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid #e0e0e0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1976d2, #1565c0)',
          color: '#fff',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FiMessageSquare size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {isClient ? (professionalName || 'Profissional') : (clientName || 'Cliente')}
              </div>
              {lastSeen && (
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  visto por último {lastSeen}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: '#fff', 
              fontSize: 18, 
              cursor: 'pointer',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Área de Mensagens */}
        <div style={{ 
          flex: 1, 
          padding: 16, 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {/* Aviso sobre regras do chat */}
          <div style={{
            background: '#e3f2fd',
            border: '1px solid #90caf9',
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            color: '#1565c0',
            textAlign: 'center',
            marginBottom: 8
          }}>
            🔒 <strong>Chat Seguro:</strong> Por segurança, não é permitido compartilhar números de telefone ou contatos externos neste chat.
          </div>

          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#888', 
              marginTop: 20 
            }}>
              Nenhuma mensagem ainda. Comece a conversa!
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isMyMessage = message.sender_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                      marginBottom: 8
                    }}
                  >
                    <div
                      style={{
                        background: isMyMessage ? '#1976d2' : '#f5f5f5',
                        color: isMyMessage ? '#fff' : '#333',
                        borderRadius: isMyMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px',
                        maxWidth: '70%',
                        wordBreak: 'break-word',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ fontSize: 14, lineHeight: 1.4 }}>{message.message}</div>
                      <div style={{ 
                        fontSize: 11, 
                        opacity: 0.7, 
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                        gap: 4
                      }}>
                        <span>
                          {formatMessageTime(message.created_at)}
                        </span>
                        {isMyMessage && (
                          <span style={{ fontSize: 12 }}>
                            {/* Mostrar indicador de leitura baseado no status da mensagem */}
                            {message.is_read === true ? (
                              <span style={{ color: '#4fc3f7' }} title="Visualizada">✓✓</span>
                            ) : (
                              <span style={{ color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#999' }} title="Enviada">✓</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Indicador de digitação */}
              {otherUserTyping && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 8
                }}>
                  <div style={{
                    background: '#f5f5f5',
                    borderRadius: '18px 18px 18px 4px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {isClient ? professionalName : clientName} está digitando
                    </span>
                    <div style={{
                      display: 'flex',
                      gap: 2
                    }}>
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#666',
                        animation: 'pulse 1.5s infinite'
                      }} />
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#666',
                        animation: 'pulse 1.5s infinite 0.3s'
                      }} />
                      <div style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#666',
                        animation: 'pulse 1.5s infinite 0.6s'
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Aviso sobre telefones */}
        {phoneWarning && (
          <div style={{
            padding: '8px 16px',
            background: '#fff3cd',
            borderTop: '1px solid #ffeaa7',
            color: '#856404',
            fontSize: 12,
            fontWeight: 500
          }}>
            {phoneWarning}
          </div>
        )}

        {/* Campo de Envio */}
        <form 
          onSubmit={sendMessage}
          style={{ 
            padding: 16, 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: 8
          }}
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              const value = e.target.value;
              setNewMessage(value);
              
              // Simular indicador de digitação
              handleTyping();
              
              // Verificar em tempo real se há números de telefone
              if (value.trim() && detectPhoneNumber(value)) {
                setPhoneWarning("⚠️ Atenção: Não é permitido compartilhar telefone no chat");
              } else {
                setPhoneWarning("");
              }
            }}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 25,
              border: '1px solid #ddd',
              fontSize: 14,
              outline: 'none',
              background: '#f8f9fa'
            }}
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            style={{
              background: '#1976d2',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading || !newMessage.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !newMessage.trim() ? 0.5 : 1
            }}
          >
            <FiSend size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
