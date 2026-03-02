import { getDashboardFornecedor } from "@/actions/dashboard"
import { FornecedorDashboardContent } from "./dashboard-content"

export default async function FornecedorDashboardPage() {
  const data = await getDashboardFornecedor()

  return <FornecedorDashboardContent data={data} />
}
