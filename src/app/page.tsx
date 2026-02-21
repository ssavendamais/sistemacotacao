import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, FileText, Globe, Send, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-primary-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[40%] bg-info-100/20 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <nav className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-all">
              <Zap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black text-neutral-900 tracking-tighter">
              Venda Mais
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-bold text-neutral-500 hover:text-primary-600 transition-colors hidden sm:block"
            >
              Fazer Login
            </Link>
            <Link href="/cadastro">
              <Button size="sm" className="px-5 font-bold shadow-md shadow-primary-500/10 h-10">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8 animate-fade-in-up">
            <Sparkles className="h-4 w-4" />
            A Evolução das Cotações B2B
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black text-neutral-900 tracking-tight leading-[1.1] mb-8 max-w-4xl animate-fade-in-up [animation-delay:100ms]">
            Conecte seu Mercado aos <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">Melhores Fornecedores</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-neutral-500 max-w-2xl mb-12 leading-relaxed animate-fade-in-up [animation-delay:200ms]">
            Abandone os orçamentos manuais. publique suas demandas e receba propostas inteligentes, detalhadas e competitivas em uma única plataforma profissional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-fade-in-up [animation-delay:300ms]">
            <Link href="/cadastro" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-10 h-14 text-lg shadow-xl shadow-primary-500/20 group">
                Começar agora
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/fornecedores" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-10 h-14 text-lg border-2 border-neutral-100 hover:bg-neutral-50 font-bold">
                Para fornecedores
              </Button>
            </Link>
          </div>

          {/* Social Proof / Trusted By */}
          <div className="mt-20 pt-10 border-t border-neutral-100 w-full animate-fade-in [animation-delay:500ms]">
             <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mb-8">Utilizado por redes de destaque</p>
             <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="h-8 w-32 bg-neutral-400 rounded-md" />
                <div className="h-8 w-24 bg-neutral-400 rounded-md" />
                <div className="h-8 w-28 bg-neutral-400 rounded-md" />
                <div className="h-8 w-36 bg-neutral-400 rounded-md" />
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-3xl lg:text-5xl font-black text-neutral-900 tracking-tight">O que fazemos por você?</h2>
             <p className="text-neutral-500 text-lg max-w-xl mx-auto font-medium">
               Uma plataforma completa pensada para agilizar a rotina de compras e vendas do setor varejista.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Cotações Multinível",
                description: "Crie solicitações complexas em segundos, com suporte a múltiplos itens, unidades e observações técnicas detalhadas.",
                color: "text-primary-600",
                bg: "bg-primary-50"
              },
              {
                icon: Send,
                title: "Propostas Blindadas",
                description: "Fornecedores enviam orçamentos em uma interface padronizada, eliminando erros de interpretação e agilizando a leitura.",
                color: "text-info-600",
                bg: "bg-info-50"
              },
              {
                icon: Shield,
                title: "Comparador Inteligente",
                description: "Nossa tecnologia destaca as melhores ofertas automaticamente por item ou por lote total, garantindo a sua economia.",
                color: "text-success-600",
                bg: "bg-success-light"
              }
            ].map((feature, i) => (
              <Card key={i} className="group border-none shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white">
                <CardBody className="p-10 space-y-6">
                  <div className={`h-14 w-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-neutral-900">{feature.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed font-medium">
                      {feature.description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Social Narrative */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Workflow
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
                Do pedido à escolha final em minutos
              </h2>
              <div className="space-y-6">
                 {[
                   { step: "01", text: "O empresário publica sua lista de compras em segundos." },
                   { step: "02", text: "Sua base de fornecedores é notificada em tempo real." },
                   { step: "03", text: "Você recebe orçamentos organizados e prontos para comparar." },
                   { step: "04", text: "Escolha o ganhador e finalize o pedido com segurança." }
                 ].map((item, idx) => (
                   <div key={idx} className="flex items-start gap-4">
                      <span className="text-primary-500 font-black text-lg pt-1">{item.step}</span>
                      <p className="text-lg text-neutral-600 font-medium">{item.text}</p>
                   </div>
                 ))}
              </div>
              <div className="pt-4">
                 <Link href="/cadastro">
                   <Button variant="ghost" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-2 p-0 h-auto hover:bg-transparent">
                      Entenda por que somos líderes em eficiência
                      <ArrowRight className="h-4 w-4" />
                   </Button>
                 </Link>
              </div>
           </div>
           
           <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-info-50 rounded-[40px] rotate-3 relative overflow-hidden shadow-2xl">
                 <div className="absolute inset-8 bg-white/50 backdrop-blur-xl rounded-[32px] border border-white/40 p-8 flex flex-col justify-between shadow-inner">
                    <div className="space-y-4">
                       <div className="h-2 w-24 bg-primary-200 rounded-full" />
                       <div className="h-2 w-48 bg-neutral-100 rounded-full" />
                       <div className="h-2 w-32 bg-neutral-100 rounded-full" />
                    </div>
                    <div className="flex items-end justify-between">
                       <div className="space-y-3">
                          <div className="h-10 w-10 bg-success-500 rounded-full flex items-center justify-center text-white">
                             <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Aprovado</p>
                       </div>
                       <div className="text-right">
                          <p className="text-3xl font-black text-neutral-900">R$ 12.450</p>
                          <p className="text-[10px] text-neutral-400 font-bold">Melhor Proposta</p>
                       </div>
                    </div>
                 </div>
              </div>
              {/* Floating element */}
              <div className="absolute -bottom-6 -right-6 h-28 w-28 bg-white rounded-3xl shadow-2xl border border-neutral-100 flex flex-col items-center justify-center p-4 animate-bounce-slow">
                 <Globe className="h-8 w-8 text-primary-500 mb-2" />
                 <p className="text-[10px] font-bold text-neutral-400 uppercase text-center">+500 Fornecedores</p>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="bg-neutral-900 rounded-[48px] p-12 lg:p-20 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-20 opacity-10 blur-2xl bg-primary-500 rounded-full" />
           <div className="relative z-10 space-y-8">
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">Escale seu negócio agora</h2>
              <p className="text-neutral-400 text-lg lg:text-xl max-w-xl mx-auto font-medium leading-relaxed">
                Junte-se a centenas de empresários que já economizaram tempo e dinheiro com a Venda Mais.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/cadastro" className="w-full sm:w-auto">
                   <Button size="lg" className="w-full sm:w-auto px-12 h-16 shadow-xl shadow-primary-500/10">
                      Criar conta gratuita
                   </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                   <Button variant="secondary" size="lg" className="w-full sm:w-auto px-12 h-16 text-neutral-900 border-2 border-white/10 hover:bg-white/5 font-bold">
                      Acessar minha conta
                   </Button>
                </Link>
              </div>
              <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Sem cartão de crédito — Configuração em 2 minutos</p>
           </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-12 border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary-500 text-white flex items-center justify-center">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="text-lg font-black text-neutral-900 tracking-tighter">
              Venda Mais
            </span>
          </div>
          
          <div className="flex items-center gap-8 text-sm font-bold text-neutral-400">
            <Link href="#" className="hover:text-neutral-900 transition-colors">Termos</Link>
            <Link href="#" className="hover:text-neutral-900 transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-neutral-900 transition-colors">Suporte</Link>
          </div>
          
          <p className="text-xs font-bold text-neutral-300">© {new Date().getFullYear()} Venda Mais S.A.</p>
        </div>
      </footer>
    </div>
  );
}

