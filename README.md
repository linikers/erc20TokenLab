# 🧪 ERC20 Token Lab

Um laboratório completo para desenvolvimento, deploy e interação com Smart Contracts ERC20 na rede Ethereum. Este projeto integra um ambiente de desenvolvimento robusto com Hardhat e uma interface moderna em Next.js.

![PlaceHolder para Screenshot do Projeto](https://via.placeholder.com/800x450.png?text=ERC20+Token+Lab+Interface)

## 🚀 Tecnologias Utilizadas

- **Solidity**: Linguagem para os Smart Contracts.
- **OpenZeppelin**: Biblioteca padrão para contratos seguros.
- **Hardhat**: Ambiente de desenvolvimento e testes para Ethereum.
- **Next.js (App Router)**: Framework React para o frontend.
- **Ethers.js**: Biblioteca para interagir com a Blockchain.
- **Tailwind CSS**: Estilização moderna e responsiva.

---

## 🛠️ Como Rodar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/linikers/erc20TokenLab.git
cd erc20TokenLab
```

### 2. Configurar o Ambiente Hardhat
```bash
# Instalar dependências da raiz
npm install

# Subir o nó local do Hardhat
npx hardhat node
```
*Mantenha este terminal aberto.*

### 3. Fazer o Deploy do Contrato
Em outro terminal:
```bash
npx hardhat run scripts/deployTestToken.ts --network localhost
```
*Anote o endereço do contrato exibido no console.*

### 4. Configurar e Rodar o Frontend
```bash
cd frontend

# Instalar dependências do frontend
npm install

# Rodar em modo de desenvolvimento
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🦊 Como Conectar a MetaMask

Para interagir com o projeto localmente, siga estes passos:

1. Abra a extensão da MetaMask.
2. Adicione uma nova rede manualmente:
   - **Nome**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Símbolo**: ETH
3. Importe uma conta de teste:
   - Copie uma das **Private Keys** exibidas no terminal do `npx hardhat node`.
   - Na MetaMask, vá em "Importar Conta" e cole a chave.

---

## ⛓️ Fluxo Web3 Simplificado

1. **Provider**: O frontend se conecta ao provedor injetado pela MetaMask (`window.ethereum`).
2. **ABI & Address**: O código usa a ABI (mapa das funções) e o endereço do contrato para criar uma instância local.
3. **Signer**: Para transferências, o usuário assina a transação via MetaMask.
4. **Blockchain**: A transação é enviada para a rede Hardhat, minerada, e o estado (saldos) é atualizado.

---

## 📂 Estrutura do Projeto

- `/contracts`: Contratos inteligentes em Solidity.
- `/scripts`: Scripts de deploy e automação.
- `/test`: Testes unitários dos contratos.
- `/frontend`: Aplicação Next.js completa.
  - `/src/lib/contract.ts`: Lógica centralizada de comunicação Web3.

---

### Desenvolvido por [Liniker](https://github.com/linikers)
Desenvolvido como parte de um estudo avançado em tecnologias descentralizadas.
