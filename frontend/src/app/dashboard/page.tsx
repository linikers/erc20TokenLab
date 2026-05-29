"use client";

import { useWeb3 } from "@/context/Web3Context";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { EXPLORERS } from "@/constants";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  if (diffHour < 24) return `Há ${diffHour}h`;
  if (diffDay < 7) return `Há ${diffDay}d`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function EmptyState() {
  return (
    <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 rounded-full mb-4">
        <svg
          className="w-10 h-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold">Carteira não conectada</h2>
      <p className="text-neutral-400 max-w-md mx-auto">
        Para acessar seu dashboard e interagir com o ERC20 Token Lab, você
        precisa conectar sua carteira MetaMask.
      </p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-neutral-400 animate-pulse">
        Verificando conexão com a blockchain...
      </p>
    </div>
  );
}

function WalletInfo({
  account,
  balance,
  networkName,
  chainId,
  connect,
  error,
}: {
  account: string;
  balance: string;
  networkName: string;
  chainId: number;
  connect: () => void;
  error: string | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Sua Conta
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">
                Endereço da Wallet
              </p>
              <div className="flex items-center justify-between p-3 bg-black/40 rounded-lg">
                <code className="text-sm text-blue-400 break-all">
                  {account}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(account)}
                  className="ml-4 p-2 text-neutral-400 hover:text-white transition-colors"
                  title="Copiar endereço"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Seu Saldo
                </p>
                <p className="text-2xl font-bold">
                  {balance}{" "}
                  <span className="text-sm text-neutral-400">TOKEN</span>
                </p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">
                  Status Rede
                </p>
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  {networkName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-blue-600/10 border border-blue-600/20 rounded-2xl">
          <h3 className="text-lg font-bold mb-2">Próximos Passos</h3>
          <p className="text-neutral-400 text-sm mb-4">
            Agora que você está conectado, você pode transferir tokens ou
            visualizar detalhes avançados do seu contrato.
          </p>
          <div className="flex gap-4">
            <a
              href="/transfer"
              className="text-sm font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors"
            >
              Fazer uma Transferência &rarr;
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h4 className="text-sm font-bold uppercase text-neutral-500 mb-4">
            Atividade Recente
          </h4>
          <TransactionTimeline chainId={chainId} />
        </div>

        <div className="p-6 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-2">Dica Pro</h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Você pode alternar entre contas no MetaMask para ver saldos
            diferentes instantaneamente aqui no dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

function TransactionTimeline({ chainId }: { chainId: number }) {
  const { transactions } = useTransactionHistory();
  const explorerBase = EXPLORERS[chainId] || "";

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-neutral-500 italic text-center py-8">
        Nenhuma transação recente encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 10).map((tx, idx) => (
        <div
          key={tx.hash}
          className="relative pl-5 pb-3 border-l border-white/10 last:border-l-transparent last:pb-0"
        >
          {/* Timeline dot */}
          <span className="absolute left-0 top-1 w-2.5 h-2.5 -translate-x-1/2 rounded-full bg-blue-500 border-2 border-neutral-950" />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {explorerBase ? (
                <a
                  href={`${explorerBase}tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                >
                  {shortenAddress(tx.hash)}
                </a>
              ) : (
                <span className="text-xs font-mono text-blue-400">
                  {shortenAddress(tx.hash)}
                </span>
              )}
              <span className="text-[10px] text-neutral-500">
                {formatTimestamp(tx.timestamp)}
              </span>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-1">
              <span>
                {tx.amount} {tx.symbol}
              </span>
              {tx.network && (
                <>
                  <span className="text-neutral-600">&middot;</span>
                  <span>{tx.network}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const {
    account,
    balance,
    loading,
    error,
    isConnected,
    connect,
    networkName,
    chainId,
  } = useWeb3();

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-neutral-400">
            Acompanhe seu saldo e informações da carteira conectada.
          </p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-neutral-400">
          Acompanhe seu saldo e informações da carteira conectada.
        </p>
      </div>

      {!isConnected ? (
        <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
          <EmptyState />
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
          <button
            onClick={connect}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Conectar MetaMask
          </button>
        </div>
      ) : (
        <WalletInfo
          account={account!}
          balance={balance}
          networkName={networkName}
          chainId={chainId}
          connect={connect}
          error={error}
        />
      )}
    </div>
  );
}
