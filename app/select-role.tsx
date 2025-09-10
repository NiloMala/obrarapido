"use client";
import { useRouter } from "next/navigation";
import styles from "../app/page.module.css";

export default function SelectRole() {
  const router = useRouter();

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
        <h1 style={{ fontWeight: 800, fontSize: 36, marginBottom: 8, color: '#1976d2', letterSpacing: -1 }}>Mãos-a-Obra</h1>
        <p style={{ fontSize: 18, color: '#444', marginBottom: 0, textAlign: 'center', lineHeight: 1.5 }}>
          Conecte clientes e profissionais autônomos da construção civil.
        </p>
        <div style={{ display: 'flex', gap: 20, flexDirection: 'column', width: '100%', marginTop: 24 }}>
          <button className={styles.primary} style={{ fontSize: 18, padding: '16px 0', borderRadius: 12, background: 'linear-gradient(90deg, #1976d2 60%, #64b5f6 100%)', color: '#fff', fontWeight: 600, border: 'none', boxShadow: '0 2px 8px 0 #1976d220', transition: 'background 0.2s' }}
            onClick={() => router.push('/login?role=client')}
          >
            Sou Cliente
          </button>
          <button className={styles.secondary} style={{ fontSize: 18, padding: '16px 0', borderRadius: 12, border: '1.5px solid #90caf9', color: '#1976d2', background: '#e3f2fd', fontWeight: 600, boxShadow: '0 2px 8px 0 #90caf920', transition: 'background 0.2s' }}
            onClick={() => router.push('/login?role=professional')}
          >
            Sou Profissional
          </button>
        </div>
      </main>
    </div>
  );
}
