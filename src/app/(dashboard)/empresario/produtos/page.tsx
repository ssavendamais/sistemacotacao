import { getProducts } from "@/actions/products";
import { ProductsTable } from "@/components/produtos/ProductsTable";
import { ToastContainer } from "@/components/ui/toast";
import { getUserRole } from "@/lib/roles.server";
import type { UserRole } from "@/lib/types/database";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    barcode?: string;
    dateFrom?: string;
    dateTo?: string;
    priceMin?: string;
    priceMax?: string;
    page?: string;
  }>;
}

export default async function ProdutosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role: UserRole = await getUserRole();

  // Block fornecedor from accessing
  if (role === "fornecedor") {
    redirect("/fornecedor/dashboard");
  }

  const page = params.page ? parseInt(params.page, 10) : 1;
  const perPage = 20;

  const { products, total, categories } = await getProducts({
    search: params.search,
    category: params.category,
    barcode: params.barcode,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    page,
    perPage,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Produtos
        </h1>
        <p className="text-gray-400 font-medium mt-1">
          Gerencie seu catálogo de produtos, cotações e códigos de barras.
        </p>
      </div>

      <ProductsTable
        products={products}
        total={total}
        categories={categories}
        userRole={role}
        currentPage={page}
        perPage={perPage}
        filters={{
          search: params.search,
          category: params.category,
          barcode: params.barcode,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          priceMin: params.priceMin,
          priceMax: params.priceMax,
        }}
      />

      <ToastContainer />
    </div>
  );
}
