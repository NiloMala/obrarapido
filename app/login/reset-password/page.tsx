"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import styles from "../../page.module.css";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message || "Erro ao atualizar senha.");
    } else {
      setSuccess("Senha atualizada com sucesso! Faça login novamente.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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
          Criar Nova Senha
        </h2>
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input name="password" type="password" placeholder="Nova senha" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={password} onChange={e => setPassword(e.target.value)} />
          <input name="confirmPassword" type="password" placeholder="Confirme a nova senha" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <button type="submit" className={styles.primary} style={{ fontSize: 18, padding: '14px 0', borderRadius: 10, marginTop: 8 }} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </button>
        </form>
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </main>
    </div>
  );
}
