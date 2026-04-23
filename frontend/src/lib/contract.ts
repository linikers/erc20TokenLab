import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/constants";

/**
 * Retorna uma instância do provedor Web3 (MetaMask)
 */
export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error("MetaMask não detectada.");
};

/**
 * Retorna uma instância do contrato para leitura ou escrita
 */
export const getContract = async (withSigner = false) => {
  const provider = getProvider();
  
  if (withSigner) {
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

/**
 * Busca o saldo de tokens de um endereço específico
 */
export const getBalance = async (address: string): Promise<string> => {
  try {
    const contract = await getContract();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Erro ao buscar saldo:", error);
    return "0";
  }
};

/**
 * Realiza a transferência de tokens
 */
export const transferTokens = async (to: string, amount: string): Promise<ethers.ContractTransactionResponse> => {
  const contract = await getContract(true);
  const decimals = await contract.decimals();
  const amountInWei = ethers.parseUnits(amount, decimals);
  
  return await contract.transfer(to, amountInWei);
};

/**
 * Solicita a conexão da wallet e retorna o primeiro endereço
 */
export const connectWallet = async (): Promise<string | null> => {
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      return accounts[0];
    } catch (error) {
      console.error("Erro ao conectar wallet:", error);
      return null;
    }
  }
  return null;
};
