export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Bem-vindo ao <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">ERC20 Token Lab</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Crie, gerencie e transfira seus próprios tokens ERC20 com facilidade e segurança. 
          Uma plataforma completa para experimentar o ecossistema Web3.
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        <a 
          href="/token" 
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
        >
          Criar Token
        </a>
        <a 
          href="/how-to-use" 
          className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-lg transition-all"
        >
          Como Funciona
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-lg font-bold mb-2 text-blue-400">Gerenciamento</h3>
          <p className="text-neutral-400 text-sm">Visualize o saldo e informações principais do seu token em tempo real.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-lg font-bold mb-2 text-purple-400">Transferência</h3>
          <p className="text-neutral-400 text-sm">Envie tokens para qualquer endereço com apenas alguns cliques.</p>
        </div>
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-lg font-bold mb-2 text-green-400">Seguro</h3>
          <p className="text-neutral-400 text-sm">Integração direta com MetaMask para transações seguras na blockchain.</p>
        </div>
      </div>
    </div>
  );
}
