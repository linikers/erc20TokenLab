"use client";

import { useState, useEffect } from "react";

interface Purchase {
  id: string;
  email: string;
  name: string;
  product: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  created_at: string;
}

interface SalesData {
  purchases: Purchase[];
  total: number;
  revenue: number;
}

const ADMIN_KEY = "ecr20_admin_token";

export default function AdminCommercePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual add state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null;

  useEffect(() => {
    if (token) setLoggedIn(true);
    else setLoading(false);
  }, []);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases?password=${encodeURIComponent(token)}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setLoggedIn(false);
        localStorage.removeItem(ADMIN_KEY);
      } else {
        setData(json);
      }
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) fetchData();
  }, [loggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(false);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.valid) {
        localStorage.setItem(ADMIN_KEY, password);
        setLoggedIn(true);
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleApprove = async (purchaseId: string) => {
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: token, purchase_id: purchaseId, action: "approve" }),
    });
    const json = await res.json();
    if (json.success) fetchData();
  };

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setAddLoading(true);
    setAddStatus(null);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, password: token }),
      });
      const json = await res.json();
      if (json.success) {
        setAddStatus("Acesso liberado com sucesso! ✅");
        setNewEmail("");
        setNewName("");
        fetchData();
      } else {
        setAddStatus("Erro: " + (json.error || "desconhecido"));
      }
    } catch {
      setAddStatus("Erro de conexão");
    } finally {
      setAddLoading(false);
    }
  };

  const pendingPurchases = data?.purchases?.filter((p) => p.status === "pending") || [];
  const approvedPurchases = data?.purchases?.filter((p) => p.status === "approved") || [];

  // Login screen
  if (!loggedIn) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <h1 className="text-2xl font-bold text-center">Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Senha de admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={loginLoading || !password}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          {loginError && (
            <p className="text-red-400 text-sm text-center">Senha incorreta</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Vendas
            </span>
          </h1>
        </div>
        <button
          onClick={() => { localStorage.removeItem(ADMIN_KEY); setLoggedIn(false); }}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-400 rounded-xl transition-all"
        >
          Sair
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Vendas</p>
          <p className="text-3xl font-bold">{loading ? "..." : approvedPurchases.length}</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Receita</p>
          <p className="text-3xl font-bold text-emerald-400">
            {loading ? "..." : `R$ ${(data?.revenue || 0).toFixed(2).replace(".", ",")}`}
          </p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Pendentes</p>
          <p className="text-3xl font-bold text-amber-400">{loading ? "..." : pendingPurchases.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liberar Acesso Manual */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold">Liberar Acesso Manual</h2>
            <p className="text-xs text-neutral-500">Libera o curso manualmente pra alguém.</p>
            <form onSubmit={handleAddPurchase} className="space-y-3">
              <input
                type="text"
                placeholder="Nome (opcional)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <input
                type="email"
                required
                placeholder="Email do comprador"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                disabled={addLoading || !newEmail}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-sm"
              >
                {addLoading ? "Liberando..." : "Liberar Acesso"}
              </button>
            </form>
            {addStatus && <p className="text-sm text-center text-emerald-400">{addStatus}</p>}
          </div>
        </div>

        {/* Tabelas */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pendentes */}
          {pendingPurchases.length > 0 && (
            <div className="p-6 bg-white/5 border border-amber-500/20 rounded-2xl">
              <h2 className="text-lg font-bold text-amber-400 mb-4">
                🔄 Pendentes ({pendingPurchases.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-500 uppercase text-xs">
                      <th className="text-left pb-3 pr-4">Data</th>
                      <th className="text-left pb-3 pr-4">Nome</th>
                      <th className="text-left pb-3 pr-4">Email</th>
                      <th className="text-left pb-3 pr-4">Método</th>
                      <th className="text-right pb-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPurchases.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 pr-4 text-neutral-400 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 pr-4 text-white">{p.name || "—"}</td>
                        <td className="py-3 pr-4 text-neutral-300">{p.email}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 text-xs rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all"
                          >
                            ✅ Aprovar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Aprovadas */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-bold mb-4">
              Histórico {approvedPurchases.length > 0 && `(${approvedPurchases.length})`}
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <p className="text-red-400 text-center py-8">{error}</p>
            ) : !approvedPurchases.length ? (
              <p className="text-neutral-500 text-center py-8 italic">Nenhuma venda ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-500 uppercase text-xs">
                      <th className="text-left pb-3 pr-4">Data</th>
                      <th className="text-left pb-3 pr-4">Nome</th>
                      <th className="text-left pb-3 pr-4">Email</th>
                      <th className="text-left pb-3 pr-4">Pagamento</th>
                      <th className="text-right pb-3">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedPurchases.map((p) => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 pr-4 text-neutral-400 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 pr-4 text-white">{p.name || "—"}</td>
                        <td className="py-3 pr-4 text-neutral-300">{p.email}</td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                            {p.payment_method === "demo" ? "Demo" : p.payment_method === "manual" ? "Manual" : p.payment_method}
                          </span>
                        </td>
                        <td className="py-3 text-right text-white font-medium">
                          R$ {p.amount.toFixed(2).replace(".", ",")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
