"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro na confirmação:', error);
          router.push('/login?message=Erro na confirmação do email');
          return;
        }

        if (data.session) {
          // Usuário confirmado, buscar tipo de usuário
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("user_type")
            .eq("id", data.session.user.id)
            .single();

          if (profile?.user_type === "client") {
            router.push('/dashboard-client');
          } else if (profile?.user_type === "professional") {
            router.push('/dashboard-professional');
          } else {
            router.push('/select-role');
          }
        } else {
          router.push('/login?message=Email confirmado com sucesso! Faça login.');
        }
      } catch (error) {
        console.error('Erro:', error);
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: 16
    }}>
      <div>Confirmando seu email...</div>
      <div style={{ fontSize: 14, color: '#666' }}>
        Você será redirecionado em instantes.
      </div>
    </div>
  );
}
