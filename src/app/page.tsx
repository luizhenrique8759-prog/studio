import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Users, 
  ChevronRight, 
  Stethoscope, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  Shield
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navbar Transparente com Blur */}
      <header className="px-4 lg:px-6 h-20 flex items-center border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-headline font-extrabold tracking-tight text-primary">Sync</span>
          </Link>
          
          <nav className="hidden md:flex gap-8 items-center">
            <Link className="text-sm font-semibold hover:text-primary transition-colors" href="#services">Serviços</Link>
            <Link className="text-sm font-semibold hover:text-primary transition-colors" href="#features">Tecnologia</Link>
            <Link className="text-sm font-semibold hover:text-primary transition-colors" href="#faq">Dúvidas</Link>
            <div className="h-6 w-px bg-border mx-2" />
            <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/auth">Entrar</Link>
            <Button asChild className="rounded-full px-8 bg-primary hover:scale-105 transition-transform">
              <Link href="/booking">Agendar Agora</Link>
            </Button>
          </nav>

          {/* Mobile Menu Trigger (Simplified) */}
          <div className="md:hidden">
             <Button variant="ghost" size="icon" asChild>
                <Link href="/auth"><Users className="h-6 w-6" /></Link>
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Seção Hero - Impacto Visual */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.1),transparent_50%)]" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-8 z-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider animate-bounce">
                    <Star className="h-3 w-3 fill-current" /> Clínica Nº 1 em Tecnologia
                  </div>
                  <h1 className="text-5xl font-headline font-extrabold tracking-tight sm:text-6xl xl:text-7xl/none text-foreground leading-[1.1]">
                    O seu <span className="text-primary italic">sorriso</span> conectado ao futuro.
                  </h1>
                  <p className="max-w-[540px] text-muted-foreground text-lg md:text-xl font-body leading-relaxed">
                    Experimente o agendamento odontológico mais moderno do Brasil. Sem filas, sem espera, apenas excelência.
                  </p>
                </div>
                <div className="flex flex-col gap-4 min-[400px]:flex-row">
                  <Button asChild size="lg" className="rounded-full px-10 h-16 text-xl font-bold shadow-2xl shadow-primary/30 hover:translate-y-[-2px] transition-all">
                    <Link href="/booking">Começar Agendamento <ArrowRight className="ml-2 h-6 w-6" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-10 h-16 text-xl border-2">
                    <Link href="/admin">Sou Dentista</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                        <img src={`https://picsum.photos/seed/face${i}/100/100`} alt="Paciente" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    <span className="text-foreground font-bold">+2.000</span> sorrisos transformados este mês
                  </p>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-[3rem] blur-2xl group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-white">
                  <img
                    src="https://picsum.photos/seed/dental-hero/800/800"
                    alt="Clínica Moderna"
                    className="object-cover w-full h-full scale-105 group-hover:scale-100 transition-transform duration-700"
                    data-ai-hint="dental office"
                  />
                  <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-2xl border shadow-xl">
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="text-xs font-bold text-primary uppercase">Próximo Horário</p>
                          <p className="text-xl font-bold">Hoje, às 14:30</p>
                       </div>
                       <div className="bg-accent h-12 w-12 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="text-white h-6 w-6" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção de Serviços */}
        <section id="services" className="w-full py-24 bg-secondary/20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">Especialidades de Ponta</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Oferecemos o que há de mais moderno em tratamentos odontológicos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Estética Avançada", desc: "Clareamento a laser e facetas em porcelana.", icon: Star },
                { title: "Ortodontia Digital", desc: "Alinhadores invisíveis e correções rápidas.", icon: Shield },
                { title: "Implantes", desc: "Reabilitação completa com tecnologia 3D.", icon: Stethoscope },
              ].map((s, i) => (
                <div key={i} className="group p-8 bg-white rounded-[2rem] border border-transparent hover:border-primary/20 hover:shadow-2xl transition-all duration-300">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <s.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{s.desc}</p>
                  <Link href="/booking" className="inline-flex items-center text-primary font-bold hover:gap-2 transition-all">
                    Saiba mais <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por que escolher o Sync? */}
        <section id="features" className="w-full py-24 border-t">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-4xl font-headline font-bold text-primary tracking-tighter">O Jeito Sync de Cuidar</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-xl/relaxed">
                Esqueça tudo o que você sabe sobre clínicas odontológicas. Nós reinventamos a jornada do paciente.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 p-8 rounded-3xl bg-white shadow-xl shadow-primary/5 hover:translate-y-[-5px] transition-transform">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Clock className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Reserva em 30s</h3>
                <p className="text-muted-foreground text-center">Agende sua consulta de qualquer lugar, 24 horas por dia, em tempo real.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 rounded-3xl bg-white shadow-xl shadow-primary/5 hover:translate-y-[-5px] transition-transform">
                <div className="p-4 bg-accent/10 rounded-full">
                  <ShieldCheck className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Check-in Digital</h3>
                <p className="text-muted-foreground text-center">Nada de papelada. Seu histórico e confirmações estão sempre na palma da mão.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-8 rounded-3xl bg-white shadow-xl shadow-primary/5 hover:translate-y-[-5px] transition-transform">
                <div className="p-4 bg-secondary/80 rounded-full">
                  <Users className="h-10 w-10 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Assistência com IA</h3>
                <p className="text-muted-foreground text-center">Utilizamos IA para gerar resumos de cuidados pós-procedimento e lembretes inteligentes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Acordeão */}
        <section id="faq" className="w-full py-24 bg-white">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <h2 className="text-4xl font-headline font-bold text-center mb-12 text-primary">Dúvidas Comuns</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b-2">
                <AccordionTrigger className="text-lg font-bold">Aceitam convênios?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Atendemos os principais convênios nacionais e oferecemos condições especiais para reembolsos e consultas particulares.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-b-2">
                <AccordionTrigger className="text-lg font-bold">Como funciona o agendamento online?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  É simples! Você escolhe o serviço, o dentista e o horário disponível em tempo real. Você recebe a confirmação na hora via e-mail e painel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-b-2">
                <AccordionTrigger className="text-lg font-bold">A clínica tem estacionamento?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sim, oferecemos estacionamento gratuito com manobrista para todos os nossos pacientes.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-24">
          <div className="container px-4 mx-auto">
            <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-primary-foreground relative overflow-hidden shadow-[0_40px_100px_rgba(var(--primary),0.3)]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-8">
                  <h2 className="text-4xl md:text-6xl font-headline font-bold">Pronto para transformar seu sorriso?</h2>
                  <p className="text-xl opacity-90 max-w-2xl mx-auto font-medium">Não deixe para amanhã. Agende sua avaliação gratuita hoje mesmo e descubra o padrão Sync de excelência.</p>
                  <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-secondary hover:scale-105 transition-all text-xl px-12 h-16 shadow-2xl font-bold">
                    <Link href="/booking">Agendar Agora <ChevronRight className="ml-2" /></Link>
                  </Button>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Elegante */}
      <footer className="w-full border-t bg-slate-50 py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <span className="text-xl font-headline font-bold text-primary tracking-tight">Sync</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Elevando o padrão da odontologia brasileira através de tecnologia e humanização.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Institucional</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Nossa Equipe</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contato</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Ouvidoria</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-widest">Redes Sociais</h4>
              <div className="flex gap-4">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border hover:border-primary cursor-pointer transition-all">📸</div>
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border hover:border-primary cursor-pointer transition-all">📘</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© 2024 Clínica Dental Sync. Todos os direitos reservados. CRO/SP 123.456</p>
            <div className="flex gap-6">
              <Link className="text-xs text-muted-foreground hover:underline" href="#">Termos</Link>
              <Link className="text-xs text-muted-foreground hover:underline" href="#">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
