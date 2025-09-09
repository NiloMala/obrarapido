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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        .select('*')
        .eq('service_request_id', serviceRequestId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
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

    // Subscription para novas mensagens
    const subscription = supabase
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
          setMessages(prev => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [open, serviceRequestId]);

  if (!open) return null;

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
          background: '#1976d2',
          color: '#fff',
          borderRadius: '16px 16px 0 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiMessageSquare />
            <span style={{ fontWeight: 600 }}>
              Chat com {isClient ? professionalName : clientName}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              fontSize: 20, 
              cursor: 'pointer' 
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
            messages.map((message) => {
              const isMyMessage = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      background: isMyMessage ? '#1976d2' : '#f5f5f5',
                      color: isMyMessage ? '#fff' : '#333',
                      borderRadius: 12,
                      padding: '8px 12px',
                      maxWidth: '70%',
                      wordBreak: 'break-word'
                    }}
                  >
                    <div style={{ fontSize: 14 }}>{message.message}</div>
                    <div style={{ 
                      fontSize: 11, 
                      opacity: 0.7, 
                      marginTop: 4 
                    }}>
                      {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              );
            })
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
              padding: '8px 12px',
              borderRadius: 20,
              border: '1px solid #ddd',
              fontSize: 14,
              outline: 'none'
            }}
            disabled={loading}
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
