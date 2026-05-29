"use client";

import { useState, useEffect } from "react";
import { getTokenInfo } from "@/lib/contract";

interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  address: string;
}

export default function TokenPage() {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const data = await getTokenInfo();
        if (data) {
          setTokenData(data);
        } else {
          setError("Não foi possível carregar as informações do token.");
        }
      } catch (err) {
        setError("Erro de conexão com o contrato.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400">Buscando dados do contrato...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline underline-offset-4 text-neutral-400 hover:text-white"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent inline-block">
          Detalhes do Token
        </h1>
        <p className="text-neutral-400">Informações técnicas recuperadas diretamente da blockchain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identidade */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6 hover:bg-white/[0.07] transition-colors">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M11 7h.01M11 11h.01M11 15h.01M15 7h.01M15 11h.01M15 15h.01" />
            </svg>
            Identidade
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Nome do Token</p>
              <p className="text-2xl font-bold text-neutral-200">{tokenData?.name}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Símbolo</p>
              <p className="text-2xl font-bold text-purple-400">{tokenData?.symbol}</p>
            </div>
          </div>
        </div>

        {/* Emissão */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-6 hover:bg-white/[0.07] transition-colors">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Suprimento
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Total Supply</p>
              <p className="text-2xl font-bold text-neutral-200">
                {Number(tokenData?.totalSupply).toLocaleString()} <span className="text-sm font-normal text-neutral-500">{tokenData?.symbol}</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Decimais</p>
              <p className="text-2xl font-bold text-blue-400">{tokenData?.decimals}</p>
            </div>
          </div>
        </div>

        {/* Contrato */}
        <div className="md:col-span-2 p-8 bg-black/40 border border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Endereço do Contrato</h2>
            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded border border-green-500/20">VERIFICADO</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-black/60 rounded-xl group">
            <code className="text-blue-400 break-all text-sm md:text-base">{tokenData?.address}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(tokenData?.address || "")}
              className="ml-4 p-2 text-neutral-500 hover:text-white transition-all transform hover:scale-110"
              title="Copiar endereço"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
