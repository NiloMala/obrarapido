"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import styles from "./page.module.css";

export default function RegisterProfessional() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    phone: "",
    city: "",
    neighborhood: "",
    services: [] as string[],
    regions: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const serviceOptions = [
    "Pedreiro",
    "Pintor",
    "Encanador",
    "Eletricista",
    "Gesseiro"
  ];

  const handleServiceToggle = (service: string) => {
    setForm((prev) => {
      const already = prev.services.includes(service);
      return {
        ...prev,
        services: already
          ? prev.services.filter((s) => s !== service)
          : [...prev.services, service],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    // 1. Cria usuário no Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError || !data.user || !data.user.id) {
      let msg = signUpError?.message || "Erro ao criar usuário.";
      if (msg.toLowerCase().includes("user already registered") || msg.toLowerCase().includes("email already registered") || msg.toLowerCase().includes("email already in use") || msg.toLowerCase().includes("duplicate key value")) {
        msg = "Email já cadastrado, faça o login.";
      }
      setError(msg);
      setLoading(false);
      return;
    }
    // 2. Cria perfil na tabela user_profiles somente se id existir
    const userId = data.user.id;
    if (!userId) {
      setError("Erro ao obter o ID do usuário criado.");
      setLoading(false);
      return;
    }
    // Salva category como lista de serviços selecionados, em minúsculo, separados por vírgula
    const selectedCategories = form.services.map(s => s.toLowerCase()).join(",");
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: userId,
      name: form.name,
      phone: form.phone,
      city: form.city,
      neighborhood: form.neighborhood,
      user_type: "professional",
      category: selectedCategories,
    });
    // 3. Cria registro na tabela professionals
    const { error: professionalError } = await supabase.from("professionals").insert({
      id: userId,
      cpf_cnpj: form.cpf_cnpj,
      services: form.services,
      regions: form.regions.split(",").map(r => r.trim()),
    });
    if (profileError || professionalError) {
      let msg = profileError?.message || professionalError?.message || "Erro ao salvar perfil.";
      if (msg.toLowerCase().includes("violates foreign key constraint") && msg.toLowerCase().includes("user_profiles_id_fkey")) {
        msg = "Email já cadastrado, faça o login.";
      }
      setError(msg.startsWith("Usuário criado") ? msg : "Usuário criado, mas erro ao salvar perfil: " + msg);
      setLoading(false);
      return;
    }
    setSuccess("Cadastro realizado com sucesso! Redirecionando para login...");
    setLoading(false);
    setTimeout(() => {
      router.push("/login?role=professional");
    }, 1800);
  };

  return (
    <div className={styles.page} style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fafc 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 4px 32px 0 rgba(80,120,200,0.08)',
        padding: '48px 32px',
        minWidth: 320,
        maxWidth: 400,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, color: '#1976d2', marginBottom: 8 }}>
          Cadastro Profissional
        </h2>
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input name="name" type="text" placeholder="Nome completo" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.name} onChange={handleChange} />
          <input name="cpf_cnpj" type="text" placeholder="CPF ou CNPJ" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.cpf_cnpj} onChange={handleChange} />
          <input name="phone" type="text" placeholder="Telefone" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.phone} onChange={handleChange} />
          <input name="city" type="text" placeholder="Cidade" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.city} onChange={handleChange} />
          <input name="neighborhood" type="text" placeholder="Bairro" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.neighborhood} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontWeight: 500, color: '#1976d2', marginBottom: 2 }}>Serviços prestados</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {serviceOptions.map((service) => (
                <button
                  type="button"
                  key={service}
                  onClick={() => handleServiceToggle(service)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: form.services.includes(service) ? '2px solid #1976d2' : '1px solid #90caf9',
                    background: form.services.includes(service) ? '#1976d2' : '#fff',
                    color: form.services.includes(service) ? '#fff' : '#1976d2',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {service}
                </button>
              ))}
            </div>
            {form.services.length === 0 && <span style={{ color: 'red', fontSize: 13 }}>Selecione pelo menos um serviço</span>}
          </div>
          <input name="regions" type="text" placeholder="Região de atendimento" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.regions} onChange={handleChange} />
          <input name="email" type="email" placeholder="E-mail" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Senha" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.password} onChange={handleChange} />
          <button type="submit" className={styles.primary} style={{ fontSize: 18, padding: '14px 0', borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
      </main>
    </div>
  );
}
