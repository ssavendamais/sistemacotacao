import { getCategories } from "@/actions/categories";
import { ProductForm } from "@/components/produtos/ProductForm";
import { ToastContainer } from "@/components/ui/toast";
import { getUserRole } from "@/lib/roles.server";
import type { UserRole } from "@/lib/types/database";
import { redirect } from "next/navigation";

export default async function NovoProdutoPage() {
  const role: UserRole = await getUserRole();

  if (role === "fornecedor") {
    redirect("/fornecedor/dashboard");
  }

  if (role !== "admin" && role !== "moderador") {
    redirect("/empresario/produtos");
  }

  const { categories } = await getCategories();

  return (
    <>
      <ProductForm userRole={role} categories={categories} />
      <ToastContainer />
    </>
  );
}
