
"use client";

import { useState, useEffect } from "react";
import { FiMapPin, FiClock, FiUsers, FiUser, FiMessageSquare, FiFileText, FiCheckCircle, FiStar } from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import styles from "./page.module.css";
import Chat from "./components/Chat";

// Modal simples reutilizável
function Modal({ open, onClose, children }: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 32px 0 rgba(80,120,200,0.15)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#1976d2', cursor: 'pointer' }}>&times;</button>
        {children}
      </div>
    </div>
  );
}

function ServiceRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    address: "",
    photo: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      const { error: reqError } = await supabase.from("service_requests").insert({
        client_id: user.id,
        category: form.category,
        title: form.title,
        description: form.description,
        address: form.address,
        photos: form.photo ? [form.photo] : [],
        status: "open"
      });
      if (reqError) {
        setError("Erro ao enviar pedido: " + reqError.message);
        setLoading(false);
        return;
      }
      setSuccess("Pedido enviado com sucesso!");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      setError("Erro inesperado ao enviar pedido.");
    }
    setLoading(false);
  };


  if (!open) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, padding: 32, minWidth: 320, maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 4px 32px 0 rgba(80,120,200,0.12)" }}>
        <h3 style={{ fontWeight: 700, fontSize: 22, color: '#1976d2', marginBottom: 8 }}>Solicitar Serviço</h3>
        <select name="category" required value={form.category} onChange={handleChange} style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }}>
          <option value="">Selecione a categoria</option>
          <option value="pedreiro">Pedreiro</option>
          <option value="pintor">Pintor</option>
          <option value="gesseiro">Gesseiro</option>
          <option value="eletricista">Eletricista</option>
          <option value="encanador">Encanador</option>
        </select>
        <input name="title" type="text" placeholder="Título do serviço" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.title} onChange={handleChange} />
        <textarea name="description" placeholder="Descrição detalhada" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16, minHeight: 60 }} value={form.description} onChange={handleChange} />
        <input name="address" type="text" placeholder="Endereço" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.address} onChange={handleChange} />
        <input name="photo" type="text" placeholder="URL da foto (opcional)" style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.photo} onChange={handleChange} />
        <button type="submit" className={styles.primary} style={{ fontSize: 18, padding: '14px 0', borderRadius: 10, marginTop: 8 }} disabled={loading}>
          {loading ? "Enviando..." : "Enviar Pedido"}
        </button>
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <button type="button" onClick={onClose} style={{ marginTop: 8, background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer' }}>Cancelar</button>
      </form>
    </div>
  );
}

// Apenas exportar o DashboardClient como default

export default function DashboardClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [receivedQuotes, setReceivedQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Menu de abas
  const [activeTab, setActiveTab] = useState<'solicitacoes' | 'perfil'>('solicitacoes');
  // Estado do perfil do cliente
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  // Modal de edição de perfil
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '', avatar_url: '' });
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState('');
  const [editProfileSuccess, setEditProfileSuccess] = useState('');
  // Estados do chat
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Estatísticas do cliente
  const [stats, setStats] = useState({
    solicitacoesAtivas: 0,
    concluidos: 0,
    avaliacao: 0,
    mensagens: 0,
  });

  // Estados para serviços contratados
  const [contractedServices, setContractedServices] = useState<any[]>([]);
  const [showContractedServices, setShowContractedServices] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Função para aceitar orçamento e mudar status da solicitação
  const handleAcceptQuote = async (quote: any) => {
    if (!quote || !quote.service_request_id) return;
    try {
      // Atualiza status da solicitação para 'contracted' e salva o profissional contratado
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'contracted', contracted_professional_id: quote.professional_id })
        .eq('id', quote.service_request_id);
      if (!error) {
        // Opcional: feedback visual
        alert('Orçamento aceito com sucesso!');
        // Atualiza a tela
        window.location.reload();
      } else {
        alert('Erro ao aceitar orçamento: ' + error.message);
      }
    } catch (err) {
      alert('Erro inesperado ao aceitar orçamento.');
    }
  };

  // Função para abrir chat
  const handleOpenChat = (quote: any) => {
    setSelectedQuote(quote);
    setChatOpen(true);
  };

  // Funções para serviços contratados
  const handleCompleteService = async (service: any) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'completed' })
        .eq('id', service.id);
      
      if (!error) {
        // Atualiza o estado local
        setContractedServices(prev => 
          prev.map(s => s.id === service.id ? { ...s, status: 'completed' } : s)
        );
        setSelectedService(service);
        setShowReviewModal(true);
      } else {
        alert('Erro ao marcar serviço como concluído: ' + error.message);
      }
    } catch (err) {
      alert('Erro inesperado ao marcar serviço como concluído.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || reviewForm.rating === 0) return;
    
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          service_request_id: selectedService.id,
          from_user_id: userId,
          to_user_id: selectedService.contracted_professional_id,
          rating: reviewForm.rating,
          comment: reviewForm.comment || null
        });

      if (error) {
        setReviewError('Erro ao enviar avaliação: ' + error.message);
      } else {
        setReviewSuccess('Avaliação enviada com sucesso!');
        setTimeout(() => {
          setShowReviewModal(false);
          setReviewForm({ rating: 0, comment: '' });
          setReviewSuccess('');
        }, 1500);
      }
    } catch (err) {
      setReviewError('Erro inesperado ao enviar avaliação.');
    }
    setReviewLoading(false);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            fontSize: 24,
            color: i <= rating ? '#FFD700' : '#ddd',
            cursor: interactive ? 'pointer' : 'default',
            marginRight: 4
          }}
          onClick={interactive ? () => setReviewForm(prev => ({ ...prev, rating: i })) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Usuário não autenticado.");
        setLoading(false);
        return;
      }
      setUserId(user.id);
      // Busca perfil do cliente na tabela user_profiles
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("name, phone, avatar_url")
        .eq("id", user.id)
        .single();
      setProfile(profileData);
      setEditProfileForm({
        name: profileData?.name || '',
        phone: profileData?.phone || '',
        avatar_url: profileData?.avatar_url || ''
      });
      // Busca as solicitações do cliente
      const { data: requestsData, error: reqError } = await supabase
        .from("service_requests")
        .select("*, contracted_professional:contracted_professional_id(name)")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      if (reqError) {
        setError("Erro ao buscar solicitações: " + reqError.message);
      } else if (requestsData) {
        // Para cada solicitação, buscar a contagem de orçamentos (quotes)
        const requestsWithQuotes = await Promise.all(requestsData.map(async (req: any) => {
          const { count } = await supabase
            .from("quotes")
            .select("id", { count: "exact", head: true })
            .eq("service_request_id", req.id);
          return {
            ...req,
            quotesCount: count || 0
          };
        }));
        setRequests(requestsWithQuotes);

        // Estatísticas: Solicitações Ativas, Serviços Concluídos
        const solicitacoesAtivas = requestsWithQuotes.filter((r: any) => r.status === 'open' || r.status === 'in_progress' || r.status === 'contracted').length;
        const concluidos = requestsWithQuotes.filter((r: any) => r.status === 'done' || r.status === 'completed').length;

        // NOVO: Busca média das avaliações FEITAS pelo cliente para profissionais
        let avaliacao = 0;
        let ratings: number[] = [];
        const { data: reviewsGiven, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('from_user_id', user.id);
        if (!reviewsError && reviewsGiven && reviewsGiven.length > 0) {
          ratings = reviewsGiven.map((r: any) => Number(r.rating)).filter((n) => !isNaN(n));
          if (ratings.length > 0) {
            avaliacao = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          }
        }

        // Busca todos os orçamentos recebidos para as solicitações do cliente
        const requestIds = requestsData.map((r: any) => r.id);
        let allQuotes: any[] = [];
        if (requestIds.length > 0) {
          const { data: quotesData, error: quotesError } = await supabase
            .from('quotes')
            .select('*, professional:professional_id(name, avatar_url), service_request:service_request_id(status, contracted_professional_id)')
            .in('service_request_id', requestIds)
            .order('created_at', { ascending: false });
          if (!quotesError && quotesData) {
            allQuotes = quotesData;
          }
        }
        setReceivedQuotes(allQuotes);
        // Mensagens: total de orçamentos recebidos (pode ser ajustado para contar mensagens reais se necessário)
        const mensagens = allQuotes.length;
        setStats({
          solicitacoesAtivas,
          concluidos,
          avaliacao: ratings.length > 0 ? parseFloat(avaliacao.toFixed(1)) : 0,
          mensagens,
        });

        // Buscar serviços contratados
        const { data: contractedData } = await supabase
          .from("service_requests")
          .select(`
            *, 
            professional:contracted_professional_id(name, avatar_url),
            quote:quotes!inner(price, timeline, start_date),
            review:reviews(rating, comment)
          `)
          .eq("client_id", user.id)
          .eq("status", "contracted")
          .order("created_at", { ascending: false });
        setContractedServices(contractedData || []);
      }
    } catch (err) {
      setError("Erro inesperado ao buscar solicitações.");
    }
    setLoading(false);
  };
  fetchData();
}, []);

  // Modal editar perfil
  const openEditProfile = () => {
    setEditProfileError('');
    setEditProfileSuccess('');
    setShowEditProfile(true);
  };
  const closeEditProfile = () => {
    setShowEditProfile(false);
  };
  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfileForm({ ...editProfileForm, [name]: value });
  };
  // Upload de foto
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop();
    const filePath = `${userId}.${ext}`;
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        setEditProfileForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      }
    }
  };
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileLoading(true);
    setEditProfileError('');
    setEditProfileSuccess('');
    try {
      // Atualiza telefone e foto em user_profiles
      const { error: err1 } = await supabase.from('user_profiles').update({
        phone: editProfileForm.phone,
        avatar_url: editProfileForm.avatar_url,
      }).eq('id', userId);
      if (err1) {
        setEditProfileError('Erro ao atualizar perfil: ' + err1.message);
      } else {
        setEditProfileSuccess('Perfil atualizado com sucesso!');
        // Atualiza o profile local
        setProfile((prev: any) => ({ ...prev, phone: editProfileForm.phone, avatar_url: editProfileForm.avatar_url }));
        setTimeout(() => {
          setShowEditProfile(false);
        }, 1200);
      }
    } catch (err) {
      setEditProfileError('Erro inesperado ao atualizar perfil.');
    }
    setEditProfileLoading(false);
  };

  const statusLabel = (req: any) => {
    // Se status for 'open' e já houver pelo menos 1 orçamento, mostrar 'Orçamento recebido'
    if (req.status === 'open' && req.quotesCount && req.quotesCount > 0) {
      return <span style={{ color: '#388e3c', fontWeight: 600 }}><FiCheckCircle style={{ verticalAlign: 'middle' }} /> Orçamento recebido</span>;
    }
    switch (req.status) {
      case "open": return <span style={{ color: '#1976d2', fontWeight: 600 }}><FiClock style={{ verticalAlign: 'middle' }} /> Aguardando Orçamentos</span>;
      case "in_progress": return <span style={{ color: '#ffa000', fontWeight: 600 }}><FiUser style={{ verticalAlign: 'middle' }} /> Em Andamento</span>;
      case "done": return <span style={{ color: '#388e3c', fontWeight: 600 }}><FiFileText style={{ verticalAlign: 'middle' }} /> Finalizado</span>;
      default: return req.status;
    }
  };

  return (
    <div className={styles.page} style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fafc 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 4px 32px 0 rgba(80,120,200,0.08)',
        padding: '48px 32px',
        minWidth: 320,
        maxWidth: 780,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}>
        {/* Header com título, subtítulo, estatísticas e botões */}
        <div style={{ width: '100%', marginBottom: 0 }}>
          {/* Menu de navegação com três botões */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Solicitar Serviço</button>
            <button
              onClick={() => setShowContractedServices(true)}
              style={{
                background: '#fff',
                color: '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Serviços Contratados</button>
            <button
              onClick={() => setShowEditProfile(true)}
              style={{
                background: '#fff',
                color: '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Editar Perfil</button>
          </div>
          {/* Avatar e nome do cliente centralizados abaixo do menu */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8 }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto do usuário" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1976d2', boxShadow: '0 2px 8px 0 rgba(25,118,210,0.10)' }} />
              ) : (
                <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#e3f2fd', border: '3px solid #1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1976d2', fontWeight: 700, fontSize: 32 }}>
                  ?
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 22, color: '#1976d2', lineHeight: 1.1, marginLeft: 4 }}>
                {profile?.name && profile.name.trim() !== '' ? profile.name : 'Cliente'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', margin: 0, padding: 0 }}>
                Dashboard Cliente
              </h2>
              <span style={{ color: '#555', fontSize: 15, fontWeight: 400, marginTop: 2, display: 'block' }}>Gerencie seus serviços solicitados</span>
            </div>
          </div>
          {/* Estatísticas do cliente */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              background: '#f5faff',
              borderRadius: 18,
              boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)',
              padding: '10px 16px',
              margin: '18px auto 8px auto',
              width: '100%',
              maxWidth: 600,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              rowGap: 16,
              columnGap: 24,
              overflowX: 'auto',
              minHeight: 90,
            }}
          >
            <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiFileText /></span>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.solicitacoesAtivas}</div>
              <div style={{ color: '#888', fontSize: 11 }}>Solicitações Ativas</div>
            </div>
            <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiCheckCircle /></span>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.concluidos}</div>
              <div style={{ color: '#888', fontSize: 11 }}>Serviços Concluídos</div>
            </div>
            <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiStar /></span>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.avaliacao}</div>
              <div style={{ color: '#888', fontSize: 11 }}>Avaliação Média</div>
            </div>
            <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiMessageSquare /></span>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.mensagens}</div>
              <div style={{ color: '#888', fontSize: 11 }}>Mensagens</div>
            </div>
          </div>
        </div>

        {/* Conteúdo das abas */}
        {/* Conteúdo principal sempre visível (não depende mais de activeTab) */}
        <>
          <span style={{ color: '#555', fontSize: 15, fontWeight: 400, marginTop: 2, display: 'block' }}>Gerencie seus serviços solicitados</span>
          <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 16, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiFileText style={{ color: '#1976d2' }} /> Solicitações Ativas
          </h3>
          {loading ? (
            <div>Carregando...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : requests.length === 0 ? (
            <div style={{ color: '#888', marginBottom: 24 }}>Nenhuma solicitação encontrada.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              {requests.map((req, i) => (
                <div key={req.id || i} style={{ background: '#f5faff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600 }}>
                    <FiFileText style={{ color: '#1976d2' }} /> {req.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 15 }}>
                    <FiMapPin style={{ color: '#90caf9' }} /> {req.address}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 15 }}>
                    {statusLabel(req)}
                    <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock style={{ color: '#90caf9' }} /> {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <FiUsers style={{ color: '#1976d2' }} />
                    {req.quotesCount || 0} orçamentos recebidos
                    {req.status === 'contracted' && req.contracted_professional?.name && (
                      <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUser style={{ color: '#1976d2' }} /> {req.contracted_professional.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NOVA SEÇÃO: Solicitações de Orçamento Recebidas - excluindo serviços concluídos */}
          <h3 style={{ fontWeight: 600, fontSize: 22, margin: '32px 0 16px 0', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUsers style={{ color: '#1976d2' }} /> Solicitações de Orçamento Recebidas
          </h3>
          {receivedQuotes.filter(quote => quote.service_request?.status !== 'completed' && quote.service_request?.status !== 'done').length === 0 ? (
            <div style={{ color: '#888', marginBottom: 24 }}>Nenhum orçamento pendente.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
              {receivedQuotes.filter(quote => quote.service_request?.status !== 'completed' && quote.service_request?.status !== 'done').map((quote, i) => (
                <div key={quote.id || i} style={{ background: '#f5faff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600 }}>
                    <FiUser style={{ color: '#1976d2' }} /> {quote.professional?.name || 'Profissional'}
                  </div>
                  <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                    <b>Valor:</b> R$ {Number(quote.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                    <b>Prazo:</b> {quote.timeline}
                  </div>
                  {quote.start_date && (
                    <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                      <b>Data para início:</b> {new Date(quote.start_date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {quote.observations && (
                    <div style={{ color: '#555', fontSize: 15, marginBottom: 4 }}>
                      <b>Observações:</b> {quote.observations}
                    </div>
                  )}
                  <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
                    Recebido em: {new Date(quote.created_at).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button
                      style={{ background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => handleOpenChat(quote)}
                    >
                      <FiMessageSquare /> Chat
                    </button>
                    {quote.service_request?.status === 'contracted' && quote.service_request?.contracted_professional_id === quote.professional_id ? (
                      <button
                        style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'default', display: 'flex', alignItems: 'center', gap: 6 }}
                        disabled
                      >
                        <FiCheckCircle /> Serviço Contratado
                      </button>
                    ) : quote.service_request?.status === 'contracted' ? (
                      <button
                        style={{ background: '#ccc', color: '#666', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'default', display: 'flex', alignItems: 'center', gap: 6 }}
                        disabled
                      >
                        <FiCheckCircle /> Já Contratado
                      </button>
                    ) : (
                      <button
                        style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleAcceptQuote(quote)}
                      >
                        <FiCheckCircle /> Aceitar Orçamento
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ServiceRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
        {/* Modal de edição de perfil sempre disponível, não depende da aba */}
        <Modal open={showEditProfile} onClose={closeEditProfile}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Editar Perfil</h3>
          <form onSubmit={handleEditProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 260 }}>
            <label style={{ fontWeight: 500, color: '#1976d2' }}>Nome</label>
            <input
              name="name"
              type="text"
              value={editProfileForm.name}
              readOnly
              style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16, background: '#f5f5f5', color: '#888' }}
            />
            <label style={{ fontWeight: 500, color: '#1976d2' }}>Foto do Usuário</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {editProfileForm.avatar_url && (
                <img src={editProfileForm.avatar_url} alt="Foto do usuário" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '1px solid #90caf9' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ fontSize: 11, maxWidth: 250, marginBottom: 4, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
                <span style={{ fontSize: 10, color: '#888', marginTop: 2, maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Nenhum arquivo escolhido
                </span>
              </div>
            </div>
            <label style={{ fontWeight: 500, color: '#1976d2' }}>Telefone</label>
            <input
              name="phone"
              type="text"
              placeholder="(99) 99999-9999"
              value={editProfileForm.phone}
              onChange={handleEditProfileChange}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }}
              maxLength={20}
              required
            />
            <button type="submit" disabled={editProfileLoading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8 }}>
              {editProfileLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            {editProfileError && <div style={{ color: 'red', marginTop: 6 }}>{editProfileError}</div>}
            {editProfileSuccess && <div style={{ color: 'green', marginTop: 6 }}>{editProfileSuccess}</div>}
          </form>
        </Modal>

        {/* Modal de Serviços Contratados */}
        <Modal open={showContractedServices} onClose={() => setShowContractedServices(false)}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Serviços Contratados</h3>
          {contractedServices.length === 0 ? (
            <div style={{ color: '#888', padding: 20, textAlign: 'center' }}>
              Nenhum serviço contratado ainda.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {contractedServices.map((service, i) => (
                <div key={service.id || i} style={{ 
                  background: '#f5faff', 
                  borderRadius: 12, 
                  padding: 16, 
                  marginBottom: 12,
                  border: '1px solid #e3f2fd'
                }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#1976d2', marginBottom: 8 }}>
                    {service.title}
                  </div>
                  <div style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>
                    <strong>Profissional:</strong> {service.professional?.name || 'N/A'}
                  </div>
                  <div style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>
                    <strong>Valor:</strong> R$ {service.quote?.[0]?.price ? Number(service.quote[0].price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'N/A'}
                  </div>
                  <div style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>
                    <strong>Status:</strong> {service.status === 'contracted' ? 'Em andamento' : service.status === 'completed' ? 'Concluído' : service.status}
                  </div>
                  {service.review && service.review.length > 0 ? (
                    <div style={{ marginTop: 12, padding: 12, background: '#e8f5e8', borderRadius: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#2e7d32', marginBottom: 4 }}>
                        Sua avaliação:
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        {renderStars(service.review[0].rating)}
                      </div>
                      {service.review[0].comment && (
                        <div style={{ fontSize: 13, color: '#555' }}>
                          &quot;{service.review[0].comment}&quot;
                        </div>
                      )}
                    </div>
                  ) : service.status === 'contracted' ? (
                    <button
                      onClick={() => handleCompleteService(service)}
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 12
                      }}
                    >
                      Marcar como Concluído
                    </button>
                  ) : (
                    <div style={{ marginTop: 12, padding: 8, background: '#fff3cd', borderRadius: 6, fontSize: 13, color: '#856404' }}>
                      Serviço concluído - aguardando avaliação
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Modal de Avaliação */}
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Avaliar Serviço</h3>
          {selectedService && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{selectedService.title}</div>
              <div style={{ color: '#555', fontSize: 14 }}>
                Profissional: {selectedService.professional?.name || 'N/A'}
              </div>
            </div>
          )}
          <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 8, display: 'block' }}>
                Avaliação (1 a 5 estrelas)
              </label>
              <div style={{ marginBottom: 8 }}>
                {renderStars(reviewForm.rating, true)}
              </div>
              {reviewForm.rating === 0 && (
                <div style={{ color: '#d32f2f', fontSize: 12 }}>Selecione uma avaliação</div>
              )}
            </div>
            <div>
              <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 8, display: 'block' }}>
                Comentário (opcional)
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Descreva sua experiência com o serviço..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #90caf9',
                  fontSize: 14,
                  resize: 'vertical'
                }}
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              disabled={reviewLoading || reviewForm.rating === 0}
              style={{
                background: reviewForm.rating === 0 ? '#ccc' : '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontWeight: 700,
                fontSize: 16,
                cursor: reviewForm.rating === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {reviewLoading ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
            {reviewError && <div style={{ color: 'red', fontSize: 14 }}>{reviewError}</div>}
            {reviewSuccess && <div style={{ color: 'green', fontSize: 14 }}>{reviewSuccess}</div>}
          </form>
        </Modal>

        {/* Chat Component */}
        {selectedQuote && (
          <Chat
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            serviceRequestId={selectedQuote.service_request_id}
            clientId={userId}
            professionalId={selectedQuote.professional_id}
            clientName={profile?.name || 'Cliente'}
            professionalName={selectedQuote.professional?.name || 'Profissional'}
            currentUserId={userId}
            isClient={true}
          />
        )}
      </main>
    </div>
  );
}
