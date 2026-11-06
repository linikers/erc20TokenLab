import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CursoView from "@/components/CursoView";
import { PRODUTOS } from "@/lib/catalogo";

const SLUGS = PRODUTOS.filter((p) => p.slug !== "curso-erc20").map((p) => p.slug);

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const produto = PRODUTOS.find((p) => p.slug === slug);
  if (!produto) return { title: "Curso não encontrado | ERC20 Token Lab" };

  const preco = (produto.precoCentavos / 100).toFixed(0);
  const titulo = `${produto.nome} | ERC20 Token Lab`;
  return {
    title: titulo,
    description: `${produto.chamada} ${produto.modulos} módulos, R$ ${preco}, acesso vitalício.`,
    openGraph: {
      title: titulo,
      description: produto.chamada,
      type: "article",
    },
    alternates: { canonical: `/curso/${produto.slug}` },
  };
}

export default async function CursoProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const produto = PRODUTOS.find((p) => p.slug === slug);
  if (!produto) notFound();

  // Dados estruturados do curso: é o que o Google usa para rich result de curso.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: produto.nome,
    description: produto.chamada,
    provider: {
      "@type": "Organization",
      name: "ERC20 Token Lab",
      sameAs: "https://ecr20ttk.vercel.app",
    },
    offers: {
      "@type": "Offer",
      price: (produto.precoCentavos / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${Math.round(produto.minutos / 60)}H`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CursoView slug={produto.slug} />
    </>
  );
}
