import { getDashboardEmpresario } from "@/actions/dashboard";
import { EmpresarioDashboardContent } from "./dashboard-content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EmpresarioDashboardPage() {
  const data = await getDashboardEmpresario()

  return <EmpresarioDashboardContent data={data} />
}
