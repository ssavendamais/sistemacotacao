import { getCategories } from "@/actions/categories";
import { CategoriesTable } from "@/components/categorias/CategoriesTable";
import { ToastContainer } from "@/components/ui/toast";
import { getUserRole } from "@/lib/roles.server";
import type { UserRole } from "@/lib/types/database";
import { redirect } from "next/navigation";

export default async function CategoriasPage() {
  const role: UserRole = await getUserRole();

  if (role === "fornecedor") {
    redirect("/fornecedor/dashboard");
  }

  const { categories } = await getCategories();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Categorias
        </h1>
        <p className="text-gray-400 font-medium mt-1">
          Gerencie as categorias dos seus produtos. Organize e agrupe para
          facilitar cotações.
        </p>
      </div>

      <CategoriesTable categories={categories} />

      <ToastContainer />
    </div>
  );
}
