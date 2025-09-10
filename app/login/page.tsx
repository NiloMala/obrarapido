"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import styles from "../page.module.css";

export default function LoginPage() {
  const params = useSearchParams();
  const role = params.get("role");
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.type]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: signInError, data } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (signInError) {
      let msg = signInError.message;
      if (msg && msg.toLowerCase().includes("email not confirmed")) {
        msg = "Email não confirmado. Verfique sua caixa de email.";
      } else if (msg && msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Credenciais de login inválidas";
      }
      setError(msg || "Erro ao fazer login.");
      setLoading(false);
      return;
    }
    // Busca perfil para saber o tipo de usuário
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_type")
      .eq("id", data.user?.id)
      .single();
    if (profileError || !profile) {
      setError("Erro ao buscar perfil do usuário.");
      setLoading(false);
      return;
    }
    // Redireciona para dashboard conforme tipo
    if (profile.user_type === "client") {
      router.push("/dashboard-client");
    } else if (profile.user_type === "professional") {
      router.push("/dashboard-professional");
    } else {
      setError("Tipo de usuário não reconhecido.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page} style={{ 
      backgroundImage: 'url(/sua-imagem-background.jpg)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <main style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        boxShadow: '0 4px 32px 0 rgba(80,120,200,0.08)',
        padding: '48px 32px',
        minWidth: 320,
        maxWidth: 360,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, color: '#1976d2', marginBottom: 8 }}>
          Login {role === "client" ? "Cliente" : role === "professional" ? "Profissional" : ""}
        </h2>
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="E-mail" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.email} onChange={handleChange} />
          <input name="password" type="password" placeholder="Senha" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.password} onChange={handleChange} />
          <button type="submit" className={styles.primary} style={{ fontSize: 18, padding: '14px 0', borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <div style={{ fontSize: 14, color: '#1976d2', marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => window.location.href = '/login/forgot-password'}>
          Esqueci minha senha
        </div>
        <div style={{ fontSize: 14, color: '#444', marginTop: 16 }}>
          Ainda não tem conta?{' '}
          <span
            style={{ color: '#1976d2', cursor: 'pointer' }}
            onClick={() => {
              if (role === 'client') {
                window.location.href = '/register-client';
              } else if (role === 'professional') {
                window.location.href = '/register-professional';
              }
            }}
          >
            Cadastre-se
          </span>
        </div>
      </main>
    </div>
  );
}
