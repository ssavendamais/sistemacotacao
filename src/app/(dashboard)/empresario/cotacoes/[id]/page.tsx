import { CotacaoDetalhesClient } from "@/components/cotacoes/cotacao-detalhes-client";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function CotacaoDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: cotacao } = await supabase
    .from("cotacoes")
    .select(
      `
      *,
      cotacao_itens (*),
      propostas (
        *,
        profiles:fornecedor_id (nome, empresa),
        proposta_itens (*)
      )
    `
    )
    .eq("id", id)
    .single();

  if (!cotacao) notFound();

  return <CotacaoDetalhesClient cotacao={cotacao} />;
}
