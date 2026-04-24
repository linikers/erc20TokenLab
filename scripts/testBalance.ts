import { ethers } from "hardhat";

async function main() {
  try {
    console.log("--- Diagnóstico de Conexão ---");
    
    // 1. Validar Provider e Rede
    const network = await ethers.provider.getNetwork();
    console.log("Network Name:", network.name);
    console.log("Chain ID:", network.chainId.toString());
    
    // 2. Validar Signer
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
      console.error("Erro: Nenhum signer encontrado. Verifique a PRIVATE_KEY no .env");
      return;
    }
    
    const deployer = signers[0];
    console.log("Signer Address:", deployer.address);
    
    // 3. Validar Saldo
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceEth = ethers.formatEther(balance);
    
    console.log("Balance:", balanceEth, "ETH");
    
    if (parseFloat(balanceEth) === 0) {
      console.warn("Aviso: O saldo é 0. Verifique se o endereço acima é o mesmo que recebeu ETH do faucet.");
    } else {
      console.log("Sucesso: Conexão estabelecida e saldo detectado!");
    }
    
    console.log("------------------------------");
  } catch (error: any) {
    console.error("--- Erro no Diagnóstico ---");
    console.error("Mensagem:", error.message);
    if (error.message.includes("invalid hex string")) {
      console.error("Dica: A PRIVATE_KEY no .env parece estar com formato inválido (deve ser 64 caracteres hex).");
    }
    if (error.message.includes("could not detect network")) {
      console.error("Dica: SEPOLIA_RPC_URL pode estar incorreta ou o serviço (Infura) está offline.");
    }
    console.error("---------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
