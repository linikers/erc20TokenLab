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

export default function AdminCommercePage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manual add state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    setAddLoading(true);
    setAddStatus(null);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName }),
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">
          <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Comércio
          </span>
        </h1>
        <p className="text-neutral-400">
          Gerencie vendas do curso, veja receitas e libere acessos manuais.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">
            Total de Vendas
          </p>
          <p className="text-3xl font-bold text-white">
            {loading ? "..." : data?.total || 0}
          </p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">
            Receita Total
          </p>
          <p className="text-3xl font-bold text-emerald-400">
            {loading
              ? "..."
              : `R$ ${(data?.revenue || 0).toFixed(2).replace(".", ",")}`}
          </p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <p className="text-sm text-neutral-500 uppercase tracking-wider mb-1">
            Ticket Médio
          </p>
          <p className="text-3xl font-bold text-blue-400">
            {loading || !data?.total
              ? "R$ 0,00"
              : `R$ ${(data.revenue / data.total).toFixed(2).replace(".", ",")}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liberar Acesso Manual */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold">Liberar Acesso Manual</h2>
            <p className="text-xs text-neutral-500">
              Use para liberar o curso manualmente para alguém.
            </p>
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
            {addStatus && (
              <p className="text-sm text-center text-emerald-400">
                {addStatus}
              </p>
            )}
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-bold mb-4">Histórico de Vendas</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <p className="text-red-400 text-center py-8">{error}</p>
            ) : !data?.purchases?.length ? (
              <p className="text-neutral-500 text-center py-8 italic">
                Nenhuma venda ainda. Compartilhe o curso!
              </p>
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
                    {data.purchases.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4 text-neutral-400 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-3 pr-4 text-white">
                          {p.name || "—"}
                        </td>
                        <td className="py-3 pr-4 text-neutral-300">
                          {p.email}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                            {p.payment_method === "demo"
                              ? "Demo"
                              : p.payment_method === "manual"
                                ? "Manual"
                                : p.payment_method}
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

      {/* Como usar */}
      <div className="p-6 bg-blue-600/10 border border-blue-600/20 rounded-2xl space-y-3">
        <h3 className="text-lg font-bold text-blue-400">
          🚀 Configurar pagamento real
        </h3>
        <p className="text-sm text-neutral-400">
          Atualmente em <strong>modo demo</strong> — as compras são aprovadas
          automaticamente.
        </p>
        <ol className="text-sm text-neutral-400 space-y-1 list-decimal pl-5">
          <li>
            Crie uma conta no{" "}
            <a
              href="https://www.mercadopago.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Mercado Pago
            </a>
          </li>
          <li>
            Vá em{" "}
            <strong>
              Seu negócio {'>'} Integrações {'>'} Credenciais
            </strong>
          </li>
          <li>
            Copie o <code className="text-blue-300">Access Token</code> de
            produção
          </li>
          <li>
            Adicione no arquivo{" "}
            <code className="text-blue-300">frontend/.env.local</code>:
          </li>
        </ol>
        <pre className="p-3 bg-black/60 rounded-lg text-sm text-blue-300 font-mono">
          MP_ACCESS_TOKEN=seu_token_aqui
        </pre>
      </div>
    </div>
  );
}
