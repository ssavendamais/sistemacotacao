export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 tracking-tight">
            Venda Mais
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Cotação inteligente para redes de mercados
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
