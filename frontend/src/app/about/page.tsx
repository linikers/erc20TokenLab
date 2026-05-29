export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Sobre o Projeto</h1>
        <p className="text-neutral-400 text-lg leading-relaxed">
          O **ERC20 Token Lab** é uma iniciativa educacional focada em desmistificar o desenvolvimento de aplicações descentralizadas (DApps) 
          e contratos inteligentes na rede Ethereum.
        </p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6 text-neutral-300">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Objetivos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Fornecer uma interface intuitiva para interagir com o padrão ERC20.</li>
            <li>Demonstrar a integração entre Next.js e ethers.js.</li>
            <li>Servir como base para estudos de Web3 e desenvolvimento Full Stack.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Tecnologias Utilizadas</h2>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Next.js 15+</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Tailwind CSS v4</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">TypeScript</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Hardhat</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">Ethers.js</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">OpenZeppelin</span>
          </div>
        </section>
      </div>

      <div className="pt-8 border-t border-white/10">
        <p className="text-neutral-500 text-sm">
          Desenvolvido como projeto de portfólio para demonstrar habilidades em Engenharia de Software e Blockchain.
        </p>
      </div>
    </div>
  );
}
