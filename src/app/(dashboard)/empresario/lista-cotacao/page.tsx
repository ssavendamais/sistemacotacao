import { DraftListClient } from "@/components/cotacoes/DraftListClient";

export const metadata = {
  title: "Lista de Cotação | Venda Mais",
  description: "Monte sua lista de cotação e envie aos fornecedores.",
};

export default function ListaCotacaoPage() {
  return <DraftListClient />;
}
