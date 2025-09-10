"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import styles from "../../page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`,
    });
    if (error) {
      setError(error.message || "Erro ao enviar e-mail de recuperação.");
    } else {
      setSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.page} style={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #f8fafc 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{
        background: '#fff',
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
        <h2 style={{ fontWeight: 700, fontSize: 24, color: '#1976d2', marginBottom: 8 }}>
          Recuperar Senha
        </h2>
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input name="email" type="email" placeholder="E-mail" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={email} onChange={e => setEmail(e.target.value)} />
          <button type="submit" className={styles.primary} style={{ fontSize: 18, padding: '14px 0', borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </main>
    </div>
  );
}
