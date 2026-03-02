import { getCategories, getProductCategoryIds } from "@/actions/categories";
import { getProduct } from "@/actions/products";
import { ProductForm } from "@/components/produtos/ProductForm";
import { ToastContainer } from "@/components/ui/toast";
import { getUserRole } from "@/lib/roles.server";
import type { UserRole } from "@/lib/types/database";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarProdutoPage({ params }: PageProps) {
  const { id } = await params;
  const role: UserRole = await getUserRole();

  if (role === "fornecedor") {
    redirect("/fornecedor/dashboard");
  }

  let product;
  try {
    product = await getProduct(id);
  } catch {
    notFound();
  }

  const { categories } = await getCategories();
  const initialCategoryIds = await getProductCategoryIds(id);

  return (
    <>
      <ProductForm
        product={product}
        userRole={role}
        categories={categories}
        initialCategoryIds={initialCategoryIds}
      />
      <ToastContainer />
    </>
  );
}
