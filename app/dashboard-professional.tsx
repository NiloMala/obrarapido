"use client";

// Estados e funções de serviços concluídos e avaliação agora estão dentro do componente principal

  // ...existing code...
  // renderStars will be defined after setReviewForm and reviewForm
import { useState, useEffect } from "react";
// Modal simples
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
import { supabase } from "../lib/supabaseClient";
import styles from "./page.module.css";
import { FiFileText, FiCheckCircle, FiClock, FiUsers, FiMessageSquare, FiStar, FiDollarSign } from "react-icons/fi";
import Chat from "./components/Chat";

export default function DashboardProfessional() {
  // ...existing code...
  function renderStars(rating: number, interactive: boolean = false) {
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
          onClick={interactive ? () => setReviewForm((prev: typeof reviewForm) => ({ ...prev, rating: i })) : undefined}
        >
          ★
        </span>
      );
    }
    return stars;
  }
  // Serviços concluídos e avaliação
  const [showCompletedServices, setShowCompletedServices] = useState(false);
  const [completedServices, setCompletedServices] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [userId, setUserId] = useState<string>("");

  // Função para buscar serviços concluídos
  const fetchCompletedServices = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('service_requests')
      .select('*, client:client_id(name, avatar_url), review:reviews(rating, comment)')
      .eq('contracted_professional_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setCompletedServices(data || []);
  };

  // Função para abrir modal de serviços concluídos
  const openCompletedServices = async () => {
    await fetchCompletedServices();
    setShowCompletedServices(true);
  };

  // Função para avaliação
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || reviewForm.rating === 0 || !userId) return;
    setReviewLoading(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          service_request_id: selectedService.id,
          from_user_id: userId,
          to_user_id: selectedService.client_id,
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
  // Navegação de abas
  const [activeTab, setActiveTab] = useState<'oportunidades' | 'plano'>('oportunidades');
  // Modal de orçamento
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [quoteForm, setQuoteForm] = useState({ value: '', deadline: '', startDate: '', note: '' });
  // Modal de detalhes do pedido
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState<any>(null);

  const openDetailsModal = (req: any) => {
    setDetailsRequest(req);
    setShowDetailsModal(true);
  };
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setDetailsRequest(null);
  };
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [quoteSuccess, setQuoteSuccess] = useState('');

  const openQuoteModal = (req: any) => {
    setSelectedRequest(req);
  setQuoteForm({ value: '', deadline: '', startDate: '', note: '' });
    setQuoteError('');
    setQuoteSuccess('');
    setShowQuoteModal(true);
  };
  const closeQuoteModal = () => {
    setShowQuoteModal(false);
    setSelectedRequest(null);
  };
  // Formatação para moeda brasileira
  function formatCurrencyBRL(value: string) {
    const num = Number(value.replace(/\D/g, '')) / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  // Converte string formatada para float (ex: 'R$ 1.500,00' => 1500.00)
  function parseCurrencyBRL(value: string) {
    if (!value) return 0;
    // Remove tudo exceto dígitos, ponto e vírgula
    let clean = value.replace(/[^\d.,]/g, '');
    // Se houver vírgula, ela é o decimal, então remova todos os pontos (milhar)
    // Remove todos os pontos (milhar)
    clean = clean.replace(/\./g, '');
    // Troca a última vírgula por ponto (decimal)
    const lastComma = clean.lastIndexOf(',');
    if (lastComma !== -1) {
      clean = clean.substring(0, lastComma) + '.' + clean.substring(lastComma + 1);
    }
    return parseFloat(clean);
  }
  // Função robusta para formatar moeda BRL
  function formatInputToBRL(value: string) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits, 10);
    return (number / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const handleQuoteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'value') {
      setQuoteForm({ ...quoteForm, value: formatInputToBRL(value) });
    } else {
      setQuoteForm({ ...quoteForm, [name]: value });
    }
  };
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteLoading(true);
    setQuoteError('');
    setQuoteSuccess('');
    if (!selectedRequest) return;

    // Verificar limites do plano antes de enviar orçamento
    if (!planLimits.canSendQuote) {
      if (!subscription) {
        setQuoteError('Você precisa de um plano ativo para enviar orçamentos. Assine um plano na aba "Plano".');
      } else if (planLimits.dailyLimit > 0 && planLimits.quotesUsed >= planLimits.dailyLimit) {
        setQuoteError(`Limite diário atingido! Plano ${subscription.plan_type}: ${planLimits.dailyLimit} orçamento(s) por dia. Upgrade seu plano para mais orçamentos.`);
      } else {
        setQuoteError('Não é possível enviar orçamento no momento.');
      }
      setQuoteLoading(false);
      return;
    }

    try {
      // Valor convertido corretamente para float, independente do formato
      const valorFloat = parseCurrencyBRL(quoteForm.value);
      if (isNaN(valorFloat) || valorFloat <= 0) {
        setQuoteError('O valor do orçamento deve ser maior que R$ 0,00.');
        setQuoteLoading(false);
        return;
      }
      const insertData = {
        service_request_id: selectedRequest.id,
        professional_id: userId,
        price: Number(valorFloat),
        timeline: quoteForm.deadline,
        start_date: quoteForm.startDate,
        observations: quoteForm.note,
        status: 'pending'
      };
      console.log('[DEBUG] Enviando orçamento:', insertData);
      console.log('[DEBUG] Tipos dos campos:', {
        service_request_id: typeof insertData.service_request_id,
        professional_id: typeof insertData.professional_id,
        price: typeof insertData.price,
        timeline: typeof insertData.timeline,
        start_date: typeof insertData.start_date,
        observations: typeof insertData.observations,
        status: typeof insertData.status
      });
      const { error } = await supabase.from('quotes').insert(insertData);
      if (error) {
        console.error('[SUPABASE ERROR]', error);
        setQuoteError('Erro ao enviar orçamento: ' + error.message);
      } else {
        setQuoteSuccess('Orçamento enviado com sucesso!');
        // Atualizar limites após envio bem-sucedido
        await checkQuoteLimits(userId, subscription);
        setTimeout(() => {
          setShowQuoteModal(false);
        }, 1200);
      }
    } catch (err) {
      setQuoteError('Erro inesperado ao enviar orçamento.');
    }
    setQuoteLoading(false);
  };
  console.log("[DEBUG] DashboardProfessional montado");
  const [requests, setRequests] = useState<any[]>([]);
  const [contractedServices, setContractedServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    avaliacao: 0,
    concluidos: 0,
    ganhos: 0,
    propostas: 0,
  });

  const [profile, setProfile] = useState<any>(null);
  // userId já declarado acima
  // Modal de edição de perfil
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ name: '', phone: '', category: '', avatar_url: '' });
  // Lista fixa de categorias disponíveis
  const ALL_CATEGORIES = [
    'Pedreiro', 'Pintor', 'Eletricista', 'Encanador', 'Gesseiro'
  ];
  // Estado para seleção de categorias
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState('');
  const [editProfileSuccess, setEditProfileSuccess] = useState('');
  // Estados do chat
  const [chatOpen, setChatOpen] = useState(false);

  const openEditProfile = async () => {
    // Busca perfil atualizado do banco para garantir categorias corretas
    let dbProfile = profile;
    let services: string[] = [];
    try {
      // Busca nome, telefone, avatar do user_profiles e services do professionals
      const [{ data: userData }, { data: profData }] = await Promise.all([
        supabase.from('user_profiles').select('name, phone, avatar_url').eq('id', userId).single(),
        supabase.from('professionals').select('services').eq('id', userId).single()
      ]);
      if (userData) dbProfile = { ...dbProfile, ...userData };
      if (profData && Array.isArray(profData.services)) services = profData.services;
    } catch {}
    setEditProfileForm({
      name: dbProfile?.name || '',
      phone: dbProfile?.phone || '',
      avatar_url: dbProfile?.avatar_url || '',
      category: '', // não usado mais, mas mantido para compatibilidade
    });
    // Preenche categorias selecionadas a partir do professionals.services (apenas as válidas)
    const cats = (services || []).filter((c: string) => ALL_CATEGORIES.includes(c));
    setSelectedCategories(cats);
    setEditProfileError('');
    setEditProfileSuccess('');
    setShowEditProfile(true);
  };
  const closeEditProfile = () => {
    setShowEditProfile(false);
  };
  const handleEditProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditProfileForm({ ...editProfileForm, [name]: value });
  };
  // Upload de foto
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    console.log('[DEBUG] Iniciando upload da foto:', file.name);
    // Nome do arquivo: userId + extensão
    const ext = file.name.split('.').pop();
    const filePath = `${userId}.${ext}`; // só o nome do arquivo
    console.log('[DEBUG] Caminho do arquivo:', filePath);
    // Upload para o bucket 'avatars' do Supabase Storage
    const { data, error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    console.log('[DEBUG] Resultado do upload:', { data, error });
    if (!error) {
      // Gera URL pública
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      console.log('[DEBUG] URL gerada:', urlData?.publicUrl);
      if (urlData?.publicUrl) {
        setEditProfileForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      }
    } else {
      console.error('[DEBUG] Erro no upload:', error);
    }
  };
  // Alterna seleção de categoria
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };
  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileLoading(true);
    setEditProfileError('');
    setEditProfileSuccess('');
    try {
      // Atualiza telefone e foto em user_profiles e services em professionals
      const updates = [
        supabase.from('user_profiles').update({
          phone: editProfileForm.phone,
          avatar_url: editProfileForm.avatar_url,
        }).eq('id', userId),
        supabase.from('professionals').update({
          services: selectedCategories
        }).eq('id', userId)
      ];
      const [{ error: err1 }, { error: err2 }] = await Promise.all(updates);
      if (err1 || err2) {
        setEditProfileError('Erro ao atualizar perfil: ' + ((err1 && err1.message) || (err2 && err2.message)));
      } else {
        setEditProfileSuccess('Perfil atualizado com sucesso!');
        // Busca novamente o profile atualizado do banco para garantir avatar_url correto
        try {
          const { data: updatedProfile } = await supabase
            .from('user_profiles')
            .select('name, avatar_url, category')
            .eq('id', userId)
            .single();
          setProfile(updatedProfile);
        } catch {}
        setTimeout(() => {
          setShowEditProfile(false);
        }, 1200);
      }
    } catch (err) {
      setEditProfileError('Erro inesperado ao atualizar perfil.');
    }
    setEditProfileLoading(false);
  };

  // Função para verificar limites de orçamentos por plano
  const checkQuoteLimits = async (userId: string, subscription: any) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Buscar quantos orçamentos foram enviados hoje
    const { count: quotesTodayCount } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    setQuotesToday(quotesTodayCount || 0);

    // Definir limites por plano
    let dailyLimit = 0;
    let canSendQuote = true;

    if (!subscription) {
      // Sem plano = sem acesso
      dailyLimit = 0;
      canSendQuote = false;
    } else {
      switch (subscription.plan_type) {
        case 'basic':
          dailyLimit = 1;
          break;
        case 'pro':
          dailyLimit = 3;
          break;
        case 'premium':
          dailyLimit = -1; // Ilimitado
          break;
        default:
          dailyLimit = 0;
          canSendQuote = false;
      }
    }

    // Verificar se pode enviar orçamento
    if (dailyLimit > 0 && (quotesTodayCount || 0) >= dailyLimit) {
      canSendQuote = false;
    } else if (dailyLimit === -1) {
      canSendQuote = true;
    }

    setPlanLimits({
      canSendQuote,
      dailyLimit,
      quotesUsed: quotesTodayCount || 0
    });
  };

  // Função para alterar plano
  const changePlan = async (newPlanType: string) => {
    if (!userId) return;
    
    setLoadingSubscription(true);
    try {
      if (subscription) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_type: newPlanType,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
          })
          .eq('id', subscription.id);

        if (error) throw error;
      } else {
        // Criar nova assinatura
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            professional_id: userId,
            plan_type: newPlanType,
            status: 'active',
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 dias
          });

        if (error) throw error;
      }

      // Recarregar dados
      const { data: updatedSubscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("professional_id", userId)
        .eq("status", "active")
        .single();

      setSubscription(updatedSubscription);
      await checkQuoteLimits(userId, updatedSubscription);
      
      alert(`Plano alterado para ${newPlanType.toUpperCase()} com sucesso!`);
    } catch (error: any) {
      alert('Erro ao alterar plano: ' + error.message);
    }
    setLoadingSubscription(false);
  };

  // Função para cancelar plano
  const cancelPlan = async () => {
    if (!subscription || !userId) return;
    
    const confirmCancel = confirm('Tem certeza que deseja cancelar seu plano? Você perderá o acesso às funcionalidades premium.');
    if (!confirmCancel) return;

    setLoadingSubscription(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled'
        })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(null);
      await checkQuoteLimits(userId, null);
      
      alert('Plano cancelado com sucesso.');
    } catch (error: any) {
      alert('Erro ao cancelar plano: ' + error.message);
    }
    setLoadingSubscription(false);
  };
  // Novo: guardar IDs dos pedidos para os quais já foi enviado orçamento
  const [sentQuotes, setSentQuotes] = useState<{ [key: string]: boolean }>({});
  // Estado para gerenciamento de planos
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [quotesToday, setQuotesToday] = useState(0);
  const [planLimits, setPlanLimits] = useState({ canSendQuote: true, dailyLimit: 0, quotesUsed: 0 });
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
        // Busca perfil do profissional na tabela user_profiles (incluindo name e avatar_url)
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("name, avatar_url, category")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
        // Busca ganhos do mês (soma dos valores dos orçamentos de serviços completed)
        let ganhos = 0;
        let concluidos = 0;
        const { data: concluidosData } = await supabase
          .from("service_requests")
          .select(`
            *,
            quote:quotes!inner(price)
          `)
          .eq("contracted_professional_id", user.id)
          .eq("status", "completed");
        if (concluidosData) {
          ganhos = concluidosData.reduce((acc, cur) => {
            const price = cur.quote?.[0]?.price || 0;
            return acc + Number(price);
          }, 0);
          concluidos = concluidosData.length;
        }

        // Busca avaliação média recebida do profissional
        let avaliacao = 0;
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select("rating")
          .eq("to_user_id", user.id);
        if (reviewsData && reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
          avaliacao = totalRating / reviewsData.length;
        }
        // Busca propostas ativas (orçamentos enviados para serviços open/quoted)
        let propostas = 0;
        const { count: propostasCount } = await supabase
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("professional_id", user.id)
          .in("status", ["open", "quoted"]);
        propostas = propostasCount || 0;
        // Busca pedidos abertos para os serviços do profissional
        let requestsData: any[] = [];
        let categories: string[] = [];
        // Busca os serviços atuais do profissional na tabela professionals
        const { data: profData } = await supabase
          .from("professionals")
          .select("services")
          .eq("id", user.id)
          .single();
        if (profData && Array.isArray(profData.services)) {
          // Converte os serviços para lowercase para comparar com as categorias dos pedidos
          categories = profData.services.map((s: string) => s.toLowerCase());
        }
        if (categories.length > 0) {
          const { data, error: reqError } = await supabase
            .from("service_requests")
            .select("*")
            .in("category", categories)
            .in("status", ["open", "quoted"])
            .order("created_at", { ascending: false });
          if (reqError) {
            setError("Erro ao buscar solicitações: " + reqError.message);
          } else {
            requestsData = data || [];
          }
        }
        setStats({
          avaliacao: avaliacao ? parseFloat(avaliacao.toFixed(1)) : 0,
          concluidos,
          ganhos,
          propostas,
        });
        setRequests(requestsData);

        // Novo: buscar orçamentos já enviados para os pedidos listados
        if (user.id && requestsData.length > 0) {
          const requestIds = requestsData.map((r: any) => r.id);
          const { data: quotesData } = await supabase
            .from('quotes')
            .select('service_request_id')
            .eq('professional_id', user.id)
            .in('service_request_id', requestIds);
          // Monta um objeto { [service_request_id]: true }
          const sent: { [key: string]: boolean } = {};
          if (quotesData) {
            quotesData.forEach((q: any) => {
              sent[q.service_request_id] = true;
            });
          }
          setSentQuotes(sent);
        } else {
          setSentQuotes({});
        }

        // Buscar serviços contratados (onde o profissional foi selecionado)
        const { data: contractedData } = await supabase
          .from("service_requests")
          .select("*, client:client_id(name), quote:quotes!inner(price, timeline, start_date)")
          .eq("contracted_professional_id", user.id)
          .eq("status", "contracted")
          .order("created_at", { ascending: false });
        setContractedServices(contractedData || []);

        // Buscar assinatura atual do profissional
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("professional_id", user.id)
          .eq("status", "active")
          .single();
        
        setSubscription(subscriptionData);

        // Verificar limites de orçamentos por plano
        await checkQuoteLimits(user.id, subscriptionData);
      } catch (err) {
        setError("Erro inesperado ao buscar solicitações.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

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
        {/* Header com título, subtítulo e botões */}
        <div style={{ width: '100%', marginBottom: 0 }}>
          {/* Menu de navegação */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('oportunidades')}
              style={{
                background: activeTab === 'oportunidades' ? '#1976d2' : '#fff',
                color: activeTab === 'oportunidades' ? '#fff' : '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Oportunidades</button>
            <button
              onClick={() => setActiveTab('plano')}
              style={{
                background: activeTab === 'plano' ? '#1976d2' : '#fff',
                color: activeTab === 'plano' ? '#fff' : '#1976d2',
                border: '1px solid #1976d2',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >Plano</button>
            <button
              onClick={openCompletedServices}
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
            >Serviços Concluídos</button>
            <button
              onClick={openEditProfile}
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
        {/* Modal de Serviços Concluídos */}
        <Modal open={showCompletedServices} onClose={() => setShowCompletedServices(false)}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Serviços Concluídos</h3>
          {completedServices.length === 0 ? (
            <div style={{ color: '#888', padding: 20, textAlign: 'center' }}>
              Nenhum serviço concluído ainda.
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {completedServices.map((service, i) => (
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
                    <strong>Cliente:</strong> {service.client?.name || 'N/A'}
                  </div>
                  <div style={{ color: '#555', fontSize: 14, marginBottom: 4 }}>
                    <strong>Status:</strong> Concluído
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
                  ) : (
                    <button
                      onClick={() => { setSelectedService(service); setShowReviewModal(true); }}
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
                      Avaliar Serviço
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Modal de Avaliação */}
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)}>
          <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Avaliar Cliente</h3>
          {selectedService && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{selectedService.title}</div>
              <div style={{ color: '#555', fontSize: 14 }}>
                Cliente: {selectedService.client?.name || 'N/A'}
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
                Observação (opcional)
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Deixe um elogio ou crítica construtiva..."
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
          {/* Avatar e nome do usuário centralizados acima do título */}
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
                {profile?.name && profile.name.trim() !== '' ? profile.name : 'Profissional'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h2 style={{ fontWeight: 700, fontSize: 20, color: '#1976d2', margin: 0, padding: 0 }}>
                Dashboard Profissional
              </h2>
              <span style={{ color: '#555', fontSize: 15, fontWeight: 400, marginTop: 2, display: 'block' }}>Gerencie suas oportunidades e serviços</span>
            </div>
            {/* Removido botão Editar Perfil do header, agora está no menu */}
            {/* Modal de edição de perfil */}
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
                      style={{ 
                        fontSize: 11, 
                        maxWidth: 250, 
                        marginBottom: 4,
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
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
                <label style={{ fontWeight: 500, color: '#1976d2' }}>Categorias</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      style={{
                        background: selectedCategories.includes(cat) ? '#1976d2' : '#fff',
                        color: selectedCategories.includes(cat) ? '#fff' : '#1976d2',
                        border: '1px solid #1976d2',
                        borderRadius: 8,
                        padding: '6px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: 15,
                        outline: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>
                  Selecione as categorias que você atende. Clique para selecionar ou remover.
                </div>
                <button type="submit" disabled={editProfileLoading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8 }}>
                  {editProfileLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                {editProfileError && <div style={{ color: 'red', marginTop: 6 }}>{editProfileError}</div>}
                {editProfileSuccess && <div style={{ color: 'green', marginTop: 6 }}>{editProfileSuccess}</div>}
              </form>
            </Modal>
          </div>
          {/* Estatísticas */}
          <div style={{ display: 'flex', gap: 24, marginTop: 18, marginBottom: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                gap: 24,
                background: '#f5faff',
                borderRadius: 18,
                boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)',
                padding: '10px 16px',
                margin: '0 auto',
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
                <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiStar /></span>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.avaliacao}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Avaliação</div>
              </div>
              <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiCheckCircle /></span>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.concluidos}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Trabalhos Concluídos</div>
              </div>
              <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiDollarSign /></span>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>R$ {Number(stats.ganhos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Ganhos do Mês</div>
              </div>
              <div style={{ minWidth: 80, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 18, color: '#1976d2', marginBottom: 1 }}><FiFileText /></span>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2' }}>{stats.propostas}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Propostas Ativas</div>
              </div>
            </div>
          </div>
        </div>
  {/* O título "Serviços Disponíveis" só aparece na aba Oportunidades, então removido daqui */}
  {/* Conteúdo das abas */}
        {activeTab === 'oportunidades' && (
          <>
            <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 16, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiFileText style={{ color: '#1976d2' }} /> Serviços Disponíveis
            </h3>
            {loading ? (
              <div>Carregando...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : requests.length === 0 ? (
              <div style={{ color: '#888', marginBottom: 24 }}>Nenhum serviço disponível no momento.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32, width: '100%' }}>
                {requests.map((req, i) => (
                  <div key={req.id || i} style={{ background: '#f5faff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600 }}>
                      <FiFileText style={{ color: '#1976d2' }} /> {req.title}
                    </div>
                    <div style={{ color: '#555', fontSize: 15 }}>{req.address}</div>
                    <div style={{ color: '#555', fontSize: 15 }}>{req.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 15 }}>
                      <FiClock style={{ color: '#90caf9' }} /> {new Date(req.created_at).toLocaleDateString('pt-BR')}
                      <span style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiUsers style={{ color: '#1976d2' }} /> Categoria: {req.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                      {sentQuotes[req.id] ? (
                        <span style={{ background: '#e3f2fd', color: '#1976d2', border: '1px solid #90caf9', borderRadius: 8, padding: '8px 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiCheckCircle /> Orçamento já enviado
                        </span>
                      ) : (
                        <button
                          style={{ 
                            background: planLimits.canSendQuote ? '#1976d2' : '#ccc', 
                            border: 'none', 
                            color: '#fff', 
                            borderRadius: 8, 
                            padding: '8px 16px', 
                            fontWeight: 600, 
                            cursor: planLimits.canSendQuote ? 'pointer' : 'not-allowed', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6 
                          }}
                          onClick={() => planLimits.canSendQuote && openQuoteModal(req)}
                          disabled={!planLimits.canSendQuote}
                          title={!planLimits.canSendQuote ? 
                            (!subscription ? 'Assine um plano para enviar orçamentos' : 
                            `Limite diário atingido (${planLimits.quotesUsed}/${planLimits.dailyLimit})`) : ''}
                        >
                          <FiCheckCircle /> Enviar Orçamento
                        </button>
                      )}
                      {/* Modal de envio de orçamento */}
                      <Modal open={showQuoteModal} onClose={closeQuoteModal}>
                        <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Enviar Orçamento</h3>
                        {selectedRequest && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 600 }}>{selectedRequest.title}</div>
                            <div style={{ color: '#555', fontSize: 15 }}>{selectedRequest.address}</div>
                          </div>
                        )}
                        <form onSubmit={handleQuoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <input
                            name="value"
                            type="text"
                            inputMode="numeric"
                            placeholder="Valor do orçamento (R$)"
                            required
                            value={quoteForm.value}
                            onChange={handleQuoteChange}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }}
                            maxLength={15}
                            autoComplete="off"
                          />
                          <input
                            name="deadline"
                            type="text"
                            placeholder="Prazo para entrega (ex: 10 dias)"
                            required
                            value={quoteForm.deadline}
                            onChange={handleQuoteChange}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }}
                          />
                          <label style={{ fontWeight: 500, color: '#1976d2', marginTop: 2 }}>Data para início</label>
                          <input
                            name="startDate"
                            type="date"
                            required
                            value={quoteForm.startDate}
                            onChange={handleQuoteChange}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }}
                          />
                          <textarea
                            name="note"
                            placeholder="Observações (opcional)"
                            value={quoteForm.note}
                            onChange={handleQuoteChange}
                            style={{ padding: 10, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16, minHeight: 60 }}
                          />
                          <button type="submit" disabled={quoteLoading} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 17, marginTop: 8 }}>
                            {quoteLoading ? 'Enviando...' : 'Enviar Orçamento'}
                          </button>
                          {quoteError && <div style={{ color: 'red', marginTop: 6 }}>{quoteError}</div>}
                          {quoteSuccess && <div style={{ color: 'green', marginTop: 6 }}>{quoteSuccess}</div>}
                        </form>
                      </Modal>
                      <button
                        style={{ background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => openDetailsModal(req)}
                      >
                        <FiFileText /> Ver Detalhes
                      </button>
                      {/* Modal de detalhes do pedido */}
                      <Modal open={showDetailsModal && detailsRequest?.id === req.id} onClose={closeDetailsModal}>
                        {detailsRequest && (
                          <div style={{ minWidth: 280 }}>
                            <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Detalhes do Pedido</h3>
                            <div style={{ fontWeight: 600, fontSize: 17 }}>{detailsRequest.title}</div>
                            <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>{detailsRequest.address}</div>
                            <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>{detailsRequest.description}</div>
                            <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>Categoria: {detailsRequest.category}</div>
                            <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>Criado em: {new Date(detailsRequest.created_at).toLocaleString('pt-BR')}</div>
                            {detailsRequest.budget && (
                              <div style={{ color: '#1976d2', fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                                Orçamento do Cliente: R$ {Number(detailsRequest.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                            {detailsRequest.deadline && (
                              <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>Prazo desejado: {detailsRequest.deadline}</div>
                            )}
                            {detailsRequest.start_date && (
                              <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>Data para início: {detailsRequest.start_date}</div>
                            )}
                            {detailsRequest.observations && (
                              <div style={{ color: '#555', fontSize: 15, marginBottom: 6 }}>Observações: {detailsRequest.observations}</div>
                            )}
                          </div>
                        )}
                      </Modal>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Seção de Serviços Contratados */}
            <h3 style={{ fontWeight: 600, fontSize: 22, marginBottom: 16, marginTop: 32, color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCheckCircle style={{ color: '#388e3c' }} /> Serviços Contratados
            </h3>
            {contractedServices.length === 0 ? (
              <div style={{ color: '#888', marginBottom: 24 }}>Nenhum serviço contratado ainda.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32, width: '100%' }}>
                {contractedServices.map((service, i) => (
                  <div key={service.id || i} style={{ background: '#f1f8e9', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px 0 rgba(80,120,200,0.07)', display: 'flex', flexDirection: 'column', gap: 8, border: '2px solid #388e3c' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600 }}>
                      <FiCheckCircle style={{ color: '#388e3c' }} /> {service.title}
                    </div>
                    <div style={{ color: '#555', fontSize: 15 }}>
                      <strong>Cliente:</strong> {service.client?.name || 'Cliente'}
                    </div>
                    <div style={{ color: '#555', fontSize: 15 }}>{service.address}</div>
                    <div style={{ color: '#555', fontSize: 15 }}>{service.description}</div>
                    {service.quote && service.quote[0] && (
                      <>
                        <div style={{ color: '#388e3c', fontSize: 15, fontWeight: 600 }}>
                          <strong>Valor:</strong> R$ {Number(service.quote[0].price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#555', fontSize: 15 }}>
                          <strong>Prazo:</strong> {service.quote[0].timeline}
                        </div>
                        {service.quote[0].start_date && (
                          <div style={{ color: '#555', fontSize: 15 }}>
                            <strong>Data para início:</strong> {new Date(service.quote[0].start_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', fontSize: 15, marginTop: 4 }}>
                      <FiClock style={{ color: '#90caf9' }} /> Contratado em: {new Date(service.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                      <button
                        style={{ background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                          setSelectedService(service);
                          setChatOpen(true);
                        }}
                      >
                        <FiMessageSquare /> Chat com Cliente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'plano' && (
          <div style={{ width: '100%', maxWidth: 550 }}>
            <h3 style={{ color: '#1976d2', fontWeight: 700, fontSize: 22, marginBottom: 18, textAlign: 'center' }}>Gerenciar Plano</h3>
            
            {/* Plano Atual */}
            {subscription ? (
              <div style={{ background: '#f5faff', borderRadius: 14, padding: 20, marginBottom: 24, border: '2px solid #1976d2' }}>
                <h4 style={{ color: '#1976d2', fontWeight: 700, fontSize: 18, marginBottom: 12, textTransform: 'capitalize' }}>
                  Plano {subscription.plan_type} - Ativo
                </h4>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 8 }}>
                  <strong>Início:</strong> {new Date(subscription.starts_at).toLocaleDateString('pt-BR')}
                </div>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 8 }}>
                  <strong>Vence em:</strong> {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                </div>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 12 }}>
                  <strong>Orçamentos hoje:</strong> {planLimits.quotesUsed}/{planLimits.dailyLimit === -1 ? '∞' : planLimits.dailyLimit}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    style={{ background: '#fff', border: '1px solid #1976d2', color: '#1976d2', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                    disabled={loadingSubscription}
                  >
                    {loadingSubscription ? 'Processando...' : 'Alterar Plano'}
                  </button>
                  <button 
                    style={{ background: '#ff5722', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={cancelPlan}
                    disabled={loadingSubscription}
                  >
                    {loadingSubscription ? 'Processando...' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff3e0', borderRadius: 14, padding: 20, marginBottom: 24, border: '2px solid #ff9800' }}>
                <h4 style={{ color: '#ff9800', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
                  Nenhum Plano Ativo
                </h4>
                <p style={{ color: '#555', fontSize: 15, marginBottom: 8 }}>
                  Assine um plano para ter acesso completo às oportunidades de trabalho.
                </p>
                <div style={{ color: '#555', fontSize: 15, marginBottom: 12 }}>
                  <strong>Orçamentos hoje:</strong> {planLimits.quotesUsed}/0 (sem plano)
                </div>
              </div>
            )}

            {/* Planos Disponíveis */}
            <h4 style={{ color: '#333', fontWeight: 600, fontSize: 18, marginBottom: 16 }}>Planos Disponíveis</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Plano Basic */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e0e0e0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h5 style={{ color: '#1976d2', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Basic</h5>
                    <div style={{ color: '#1976d2', fontWeight: 700, fontSize: 24 }}>R$ 29,90<span style={{ fontSize: 14, fontWeight: 400 }}>/mês</span></div>
                  </div>
                  <button 
                    style={{ 
                      background: subscription?.plan_type === 'basic' ? '#e0e0e0' : '#1976d2', 
                      border: 'none', 
                      color: subscription?.plan_type === 'basic' ? '#888' : '#fff', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontWeight: 600, 
                      cursor: subscription?.plan_type === 'basic' ? 'not-allowed' : 'pointer' 
                    }}
                    disabled={subscription?.plan_type === 'basic' || loadingSubscription}
                    onClick={() => changePlan('basic')}
                  >
                    {loadingSubscription ? 'Processando...' : (subscription?.plan_type === 'basic' ? 'Plano Atual' : 'Assinar')}
                  </button>
                </div>
                <ul style={{ color: '#555', fontSize: 14, paddingLeft: 20, margin: 0 }}>
                  <li>1 orçamento por dia</li>
                  <li>Suporte por email</li>
                  <li>Perfil básico</li>
                </ul>
              </div>

              {/* Plano Pro */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '2px solid #4caf50', boxShadow: '0 2px 8px 0 rgba(76,175,80,0.15)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -10, left: 20, background: '#4caf50', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  RECOMENDADO
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h5 style={{ color: '#4caf50', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Pro</h5>
                    <div style={{ color: '#4caf50', fontWeight: 700, fontSize: 24 }}>R$ 59,90<span style={{ fontSize: 14, fontWeight: 400 }}>/mês</span></div>
                  </div>
                  <button 
                    style={{ 
                      background: subscription?.plan_type === 'pro' ? '#e0e0e0' : '#4caf50', 
                      border: 'none', 
                      color: subscription?.plan_type === 'pro' ? '#888' : '#fff', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontWeight: 600, 
                      cursor: subscription?.plan_type === 'pro' ? 'not-allowed' : 'pointer' 
                    }}
                    disabled={subscription?.plan_type === 'pro' || loadingSubscription}
                    onClick={() => changePlan('pro')}
                  >
                    {loadingSubscription ? 'Processando...' : (subscription?.plan_type === 'pro' ? 'Plano Atual' : 'Assinar')}
                  </button>
                </div>
                <ul style={{ color: '#555', fontSize: 14, paddingLeft: 20, margin: 0 }}>
                  <li>3 orçamentos por dia</li>
                  <li>Suporte prioritário</li>
                  <li>Perfil destacado</li>
                  <li>Estatísticas avançadas</li>
                </ul>
              </div>

              {/* Plano Premium */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e0e0e0', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h5 style={{ color: '#ff9800', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Premium</h5>
                    <div style={{ color: '#ff9800', fontWeight: 700, fontSize: 24 }}>R$ 99,90<span style={{ fontSize: 14, fontWeight: 400 }}>/mês</span></div>
                  </div>
                  <button 
                    style={{ 
                      background: subscription?.plan_type === 'premium' ? '#e0e0e0' : '#ff9800', 
                      border: 'none', 
                      color: subscription?.plan_type === 'premium' ? '#888' : '#fff', 
                      borderRadius: 8, 
                      padding: '8px 16px', 
                      fontWeight: 600, 
                      cursor: subscription?.plan_type === 'premium' ? 'not-allowed' : 'pointer' 
                    }}
                    disabled={subscription?.plan_type === 'premium' || loadingSubscription}
                    onClick={() => changePlan('premium')}
                  >
                    {loadingSubscription ? 'Processando...' : (subscription?.plan_type === 'premium' ? 'Plano Atual' : 'Assinar')}
                  </button>
                </div>
                <ul style={{ color: '#555', fontSize: 14, paddingLeft: 20, margin: 0 }}>
                  <li>Orçamentos ilimitados</li>
                  <li>Suporte 24/7</li>
                  <li>Perfil premium</li>
                  <li>Análises detalhadas</li>
                  <li>Prioridade nos resultados</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {/* Aviso visual se perfil não encontrado */}
        {!loading && !profile && (
          <div style={{ color: 'red', marginTop: 24 }}>
            Perfil do profissional não encontrado.<br />
            <span style={{ color: '#1976d2' }}>ID do usuário autenticado: <b>{userId}</b></span><br />
            Verifique no Supabase se existe um registro em <b>user_profiles</b> com esse ID e se o campo <b>category</b> está preenchido corretamente.
          </div>
        )}

        {/* Chat Component */}
        {selectedService && (
          <Chat
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            serviceRequestId={selectedService.id}
            clientId={selectedService.client_id}
            professionalId={userId}
            clientName={selectedService.client?.name || 'Cliente'}
            professionalName={profile?.name || 'Profissional'}
            currentUserId={userId}
            isClient={false}
          />
        )}
      </main>
    </div>
  );
}
