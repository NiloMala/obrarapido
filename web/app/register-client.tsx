"use client";

export default function RegisterClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    neighborhood: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    if (signUpError || !data.user) {
      setError(signUpError?.message || "Erro ao criar usuário.");
      setLoading(false);
      return;
    }
    // 2. Cria perfil na tabela user_profiles
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: data.user.id,
      name: form.name,
      phone: form.phone,
      city: form.city,
      neighborhood: form.neighborhood,
      user_type: "client",
    });
    if (profileError) {
      setError("Usuário criado, mas erro ao salvar perfil: " + profileError.message);
      setLoading(false);
      return;
    }
    setSuccess("Cadastro realizado com sucesso! Redirecionando para login...");
    setLoading(false);
    setTimeout(() => {
      router.push("/login?role=client");
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
          Cadastro Cliente
        </h2>
        <form style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={handleSubmit}>
          <input name="name" type="text" placeholder="Nome completo" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.name} onChange={handleChange} />
          <input name="phone" type="text" placeholder="Telefone" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.phone} onChange={handleChange} />
          <input name="city" type="text" placeholder="Cidade" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.city} onChange={handleChange} />
          <input name="neighborhood" type="text" placeholder="Bairro" required style={{ padding: 12, borderRadius: 8, border: '1px solid #90caf9', fontSize: 16 }} value={form.neighborhood} onChange={handleChange} />
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
