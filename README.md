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

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas chaves (veja a seção [Deploy na Sepolia](#-deploy-na-testnet-sepolia) para detalhes).

### 3. Configurar o Ambiente Hardhat

```bash
# Instalar dependências da raiz
npm install

# Subir o nó local do Hardhat
npx hardhat node
```

_Mantenha este terminal aberto._

### 4. Fazer o Deploy do Contrato

Em outro terminal:

```bash
npx hardhat run scripts/deployTestToken.ts --network localhost
```

_Anote o endereço do contrato exibido no console._

### 5. Configurar e Rodar o Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 🦊 Como Conectar a MetaMask

### Rede Local (Hardhat)
1. Abra a extensão da MetaMask.
2. Adicione uma nova rede manualmente:
   - **Nome**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Símbolo**: ETH
3. Importe uma conta de teste:
   - Copie uma das **Private Keys** exibidas no terminal do `npx hardhat node`.
   - Na MetaMask, vá em "Importar Conta" e cole a chave.

### Rede Sepolia (Testnet)
1. Na MetaMask, ative redes de teste em **Configurações > Avançado**.
2. Selecione a rede **Sepolia** no seletor de redes.
3. Obtenha SepoliaETH de um faucet: [sepoliafaucet.com](https://sepoliafaucet.com)

---

## 🌐 Deploy na Testnet Sepolia

### Pré-requisitos
1. Uma conta no [Infura](https://infura.io) ou [Alchemy](https://alchemy.com) para obter um RPC URL.
2. Uma carteira com SepoliaETH para pagar o gas do deploy.
3. A Private Key desta carteira (⚠️ use uma carteira **exclusiva para desenvolvimento**).

### Configuração

Edite o arquivo `.env` na raiz do projeto:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/SUA_CHAVE_AQUI
PRIVATE_KEY=sua_private_key_de_64_caracteres_hex
```

> ⚠️ **Nunca commite o arquivo `.env`**. Ele já está protegido pelo `.gitignore`.

### Executar o Deploy

```bash
npx hardhat run scripts/deployTestToken.ts --network sepolia
```

O console exibirá:
```
Deploying TestToken with the account: 0xSeuEndereço...
TestToken deployed to: 0xEndereçoDoContrato...
```

Após o deploy, você pode verificar o contrato no [Sepolia Etherscan](https://sepolia.etherscan.io) buscando pelo endereço exibido.

---

## ⛓️ Como Funciona a Conexão com a Rede

```
┌─────────────┐     eth_requestAccounts     ┌───────────┐
│   Frontend   │ ─────────────────────────▶ │  MetaMask  │
│  (Next.js)   │ ◀───────────────────────── │ (Signer)   │
└──────┬───────┘     endereço da wallet      └─────┬─────┘
       │                                           │
       │  balanceOf(address)                       │  assina TX
       │  transfer(to, amount)                     │
       ▼                                           ▼
┌──────────────┐                           ┌──────────────┐
│  Ethers.js   │ ── JSON-RPC ───────────▶  │   Rede ETH   │
│  (Contract)  │ ◀──────────────────────── │  (Hardhat /   │
└──────────────┘     resultado / receipt    │   Sepolia)   │
                                           └──────────────┘
```

1. **Provider** — O frontend usa `window.ethereum` (injetado pela MetaMask) para criar um `BrowserProvider` do ethers.js.
2. **ABI & Address** — O código combina a ABI (mapa das funções do contrato) com o endereço deployado para criar uma instância do contrato.
3. **Leitura (view)** — Funções como `balanceOf` e `name` são gratuitas e não precisam de assinatura.
4. **Escrita (state change)** — Funções como `transfer` exigem um `Signer`. O MetaMask abre um popup pedindo aprovação do usuário.
5. **Confirmação** — Após a assinatura, a transação é enviada via JSON-RPC para a rede, minerada, e o frontend usa `tx.wait()` para aguardar a confirmação.

---

## 📂 Estrutura do Projeto

```
erc20TokenLab/
├── contracts/           # Smart Contracts em Solidity
│   ├── MyToken.sol
│   └── TestToken.sol    # ERC20 com OpenZeppelin
├── scripts/             # Scripts de deploy
│   ├── deploy.ts
│   └── deployTestToken.ts
├── test/                # Testes unitários
│   ├── MyToken.ts
│   └── TestToken.ts
├── frontend/            # Aplicação Next.js
│   └── src/
│       ├── app/         # Páginas (Home, Dashboard, Transfer, Admin, Approve, etc.)
│       ├── context/     # Web3Context global
│       ├── hooks/       # Hooks customizados (transaction history)
│       ├── components/  # Navbar e componentes compartilhados
│       ├── lib/contract.ts # Lógica Web3 centralizada
│       └── constants/   # ABI e endereço do contrato
├── hardhat.config.ts    # Config Hardhat (local + Sepolia)
├── .env.example         # Template de variáveis de ambiente
└── README.md
```

---

### Desenvolvido por [Liniker](https://github.com/linikers)

Projeto construído como estudo prático em desenvolvimento de Smart Contracts e integração Web3 fullstack.

[linikerS Portfolio](https://linikers-portfolio.vercel.app/)
