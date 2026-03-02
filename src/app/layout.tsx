import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venda Mais — Cotação Inteligente",
  description:
    "Plataforma de cotação inteligente para mercados e fornecedores. Crie cotações, receba propostas e compare preços com agilidade.",
  keywords: ["cotação", "fornecedores", "compras", "B2B", "SaaS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                const d = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && d)) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} antialiased bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 transition-colors`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
