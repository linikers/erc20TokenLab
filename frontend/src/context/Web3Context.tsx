"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, NETWORK_NAME, CHAIN_ID } from "@/constants";
import { getBalance, connectWallet as connectWalletLib } from "@/lib/contract";

export interface Web3ContextType {
  account: string | null;
  balance: string;
  chainId: number;
  networkName: string;
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  provider: ethers.BrowserProvider | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [chainId, setChainId] = useState<number>(CHAIN_ID);
  const [networkName] = useState<string>(NETWORK_NAME);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!account) return;
    try {
      const bal = await getBalance(account);
      setBalance(bal);
    } catch {
      console.error("Erro ao buscar saldo");
    }
  }, [account]);

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setError(null);
      } else {
        setAccount(null);
        setBalance("0");
      }
    },
    [],
  );

  const handleChainChanged = useCallback(() => {
    // Recarregar a página ao trocar de rede (recomendação MetaMask)
    window.location.reload();
  }, []);

  // Setup provider + listen for account/chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      setLoading(false);
      return;
    }

    const ethProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(ethProvider);

    // Check if already connected
    ethProvider.listAccounts().then((accounts) => {
      if (accounts.length > 0) {
        const address = accounts[0].address;
        setAccount(address);
        getBalance(address).then(setBalance).catch(() => {});
      }
      setLoading(false);
    });

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged,
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const address = await connectWalletLib();
      if (address) {
        setAccount(address);
        const bal = await getBalance(address);
        setBalance(bal);
      } else {
        setError("Não foi possível conectar a carteira.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance("0");
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        networkName,
        isConnected: !!account,
        loading,
        error,
        connect,
        disconnect,
        refreshBalance,
        provider,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3(): Web3ContextType {
  const ctx = useContext(Web3Context);
  if (!ctx) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return ctx;
}
