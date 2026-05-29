"use client";

import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { getContract } from "@/lib/contract";
import { ethers } from "ethers";

export default function AdminPage() {
  const { account, isConnected, loading: web3Loading, error: web3Error, connect } = useWeb3();

  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);

  // Mint state
  const [mintAddress, setMintAddress] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintLoading, setMintLoading] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  // Burn state
  const [burnAddress, setBurnAddress] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [burnLoading, setBurnLoading] = useState(false);
  const [burnStatus, setBurnStatus] = useState<string | null>(null);
  const [burnError, setBurnError] = useState<string | null>(null);

  // Check owner on account change
  const checkOwner = useCallback(async () => {
    if (!account) {
      setIsOwner(null);
      setCheckingOwner(false);
      return;
    }

    setCheckingOwner(true);
    try {
      const contract = await getContract(false);
      const owner = await contract.owner();
      setOwnerAddress(owner);
      setIsOwner(account.toLowerCase() === owner.toLowerCase());
    } catch (err: any) {
      console.error("Error checking owner:", err);
      setIsOwner(false);
    } finally {
      setCheckingOwner(false);
    }
  }, [account]);

  useEffect(() => {
    if (!web3Loading) {
      checkOwner();
    }
  }, [checkOwner, web3Loading]);

  // Reset per-operation states when account changes
  useEffect(() => {
    setMintStatus(null);
    setMintError(null);
    setBurnStatus(null);
    setBurnError(null);
  }, [account]);

  const handleMint = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!mintAddress || !mintAmount) return;

      setMintLoading(true);
      setMintError(null);
      setMintStatus("Initiating mint...");

      try {
        const contract = await getContract(true);
        const amountInWei = ethers.parseUnits(mintAmount, 18);
        const tx = await contract.mint(mintAddress, amountInWei);
        setMintStatus("Transaction submitted! Waiting for confirmation...");

        await tx.wait();
        setMintStatus("Mint completed successfully! ✅");
        setMintAddress("");
        setMintAmount("");
      } catch (err: any) {
        console.error(err);
        setMintError(err.reason || err.message || "Error during mint.");
        setMintStatus(null);
      } finally {
        setMintLoading(false);
      }
    },
    [mintAddress, mintAmount],
  );

  const handleBurn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!burnAddress || !burnAmount) return;

      setBurnLoading(true);
      setBurnError(null);
      setBurnStatus("Initiating burn...");

      try {
        const contract = await getContract(true);
        const amountInWei = ethers.parseUnits(burnAmount, 18);
        const tx = await contract.adminBurn(burnAddress, amountInWei);
        setBurnStatus("Transaction submitted! Waiting for confirmation...");

        await tx.wait();
        setBurnStatus("Burn completed successfully! ✅");
        setBurnAddress("");
        setBurnAmount("");
      } catch (err: any) {
        console.error(err);
        setBurnError(err.reason || err.message || "Error during burn.");
        setBurnStatus(null);
      } finally {
        setBurnLoading(false);
      }
    },
    [burnAddress, burnAmount],
  );

  // Loading state
  if (web3Loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 animate-pulse">Checking connection...</p>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <p className="text-neutral-400">Mint and burn tokens as the contract owner.</p>
        </div>

        <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Wallet not connected</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            Connect your MetaMask to access the admin panel.
          </p>
          <button
            onClick={connect}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
          >
            Connect MetaMask
          </button>
          {web3Error && <p className="text-red-400 text-sm">{web3Error}</p>}
        </div>
      </div>
    );
  }

  // Checking owner state
  if (checkingOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-neutral-400 animate-pulse">Verifying ownership...</p>
      </div>
    );
  }

  // Not owner state
  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <p className="text-neutral-400">Mint and burn tokens as the contract owner.</p>
        </div>

        <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-neutral-400 max-w-md mx-auto">
            Only the contract owner can access this page.
          </p>
          {ownerAddress && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                Contract owner: <code className="text-yellow-300">{ownerAddress}</code>
              </p>
            </div>
          )}
          <div className="p-3 bg-neutral-800/50 rounded-lg">
            <p className="text-xs text-neutral-500">
              Your address: <code className="text-neutral-400">{account}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Owner — show admin panel
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Admin Panel</h1>
        <p className="text-neutral-400">
          Mint and burn tokens. Only the contract owner has access to these operations.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <p className="text-sm text-green-400 font-medium">Connected as contract owner</p>
        </div>
        <code className="text-xs text-green-300 truncate max-w-[280px]">{account}</code>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mint Form */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Mint Tokens</h2>
          </div>

          <form onSubmit={handleMint} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Recipient Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  step="any"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">
                  TOKEN
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={mintLoading || !mintAddress || !mintAmount}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              {mintLoading ? "Processing..." : "Mint Tokens"}
            </button>
          </form>

          {mintStatus && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <p className="text-sm text-blue-400 animate-pulse">{mintStatus}</p>
            </div>
          )}

          {mintError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <p className="text-sm text-red-400">{mintError}</p>
            </div>
          )}
        </div>

        {/* Admin Burn Form */}
        <div className="p-8 bg-white/5 border border-white/10 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Admin Burn</h2>
          </div>

          <form onSubmit={handleBurn} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Account Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={burnAddress}
                onChange={(e) => setBurnAddress(e.target.value)}
                className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-300">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.0"
                  step="any"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="w-full p-4 bg-neutral-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">
                  TOKEN
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={burnLoading || !burnAddress || !burnAmount}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 disabled:from-neutral-700 disabled:to-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/20 active:scale-[0.98] transition-all"
            >
              {burnLoading ? "Processing..." : "Burn Tokens"}
            </button>
          </form>

          {burnStatus && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <p className="text-sm text-blue-400 animate-pulse">{burnStatus}</p>
            </div>
          )}

          {burnError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
              <p className="text-sm text-red-400">{burnError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
