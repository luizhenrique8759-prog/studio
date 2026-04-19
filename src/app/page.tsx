
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Shield,
  Loader2
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData, isLoading: isLoadingDoc } = useDoc(userDocRef);

  const isAdmin = user?.email === HARDCODED_ADMIN_EMAIL;
  const isProfessional = userData?.role === 'professional';

  const renderAuthButton = (className?: string) => {
    if (isUserLoading || isLoadingDoc) return <Loader2 className="animate-spin h-5 w-5 text-primary" />;

    if (!user) {
      return (
        <div className="flex gap-4 items-center">
          <Link className="text-sm font-semibold hover:text-primary transition-colors" href="/auth">Entrar</Link>
          <Button asChild className={`rounded-full px-8 bg-primary hover:scale-105 transition-transform ${className}`}>
            <Link href="/booking">Agendar Agora</Link>
          </Button>
        </div>
      );
    }

    if (isAdmin) {
      return (
        <Button asChild className={`rounded-full px-6 bg-primary shadow-lg shadow-primary/20 ${className}`}>
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Portal Administrador
          </Link>
        </Button>
      );
    }

    if (isProfessional) {
      return (
        <Button asChild className={`rounded-full px-6 bg-accent text-white shadow-lg shadow-accent/20 ${className}`}>
          <Link href="/admin" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> Portal Colaborador
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild variant="outline" className={`rounded-full px-6 border-2 ${className}`}>
        <Link href="/dashboard">Meu Painel</Link>
      </Button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
            {renderAuthButton()}
          </nav>

          <div className="md:hidden">
             {renderAuthButton()}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.1),transparent_50%)]" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-8 z-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-current" /> Clínica Nº 1 em Tecnologia
                  </div>
                  <h1 className="text-5xl font-headline font-extrabold tracking-tight sm:text-6xl xl:text-7xl/none text-foreground leading-[1.1]">
                    O seu <span className="text-primary italic">sorriso</span> conectado ao futuro.
                  </h1>
                  <p className="max-w-[540px] text-muted-foreground text-lg md:text-xl font-body leading-relaxed">
                    Experimente o agendamento odontológico mais moderno do Brasil. Sem filas, sem espera, apenas excelência.
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
                </div>
              ))}
            </div>
          </div>
        </section>

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

        <section className="w-full py-24">
          <div className="container px-4 mx-auto">
            <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-primary-foreground relative overflow-hidden shadow-[0_40px_100px_rgba(var(--primary),0.3)]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-8">
                  <h2 className="text-4xl md:text-6xl font-headline font-bold">Pronto para transformar seu sorriso?</h2>
                  <p className="text-xl opacity-90 max-w-2xl mx-auto font-medium">Não deixe para amanhã. O padrão Sync de excelência está à sua espera no topo da página.</p>
               </div>
            </div>
          </div>
        </section>
      </main>

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
