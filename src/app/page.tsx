
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
  Loader2,
  Activity
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
        <div className="flex gap-6 items-center">
          <Link className="text-sm font-bold hover:text-primary transition-colors tracking-tight uppercase" href="/auth">Entrar</Link>
          <Button asChild className={`rounded-full px-10 h-12 font-bold shadow-xl hover:scale-105 transition-all bg-primary ${className}`}>
            <Link href="/booking">Agendar Consulta</Link>
          </Button>
        </div>
      );
    }

    if (isAdmin) {
      return (
        <Button asChild className={`rounded-full px-8 h-12 bg-primary shadow-2xl shadow-primary/40 border-2 border-white/20 font-bold ${className}`}>
          <Link href="/admin" className="flex items-center gap-2">
            <Shield className="h-5 w-5 fill-current" /> Portal Administrador Blindado
          </Link>
        </Button>
      );
    }

    if (isProfessional) {
      return (
        <Button asChild className={`rounded-full px-8 h-12 bg-accent text-white shadow-2xl shadow-accent/40 font-bold ${className}`}>
          <Link href="/admin" className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" /> Portal Colaborador
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild variant="outline" className={`rounded-full px-8 h-12 border-2 font-bold hover:bg-primary/5 ${className}`}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Meu Painel do Paciente
        </Link>
      </Button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-24 flex items-center border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform duration-300 shadow-xl shadow-primary/30">
              <Stethoscope className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-headline font-black tracking-tighter text-primary leading-none">Sync</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Dental Care</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-10 items-center">
            <Link className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors" href="#services">Serviços</Link>
            <Link className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors" href="#features">Tecnologia</Link>
            <Link className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors" href="#faq">Dúvidas</Link>
            <div className="h-8 w-px bg-border mx-2" />
            {renderAuthButton()}
          </nav>

          <div className="md:hidden">
             {renderAuthButton()}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 md:py-36 lg:py-56 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.15),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
          
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-10 z-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    <Star className="h-4 w-4 fill-current" /> Clínica de Alta Tecnologia
                  </div>
                  <h1 className="text-6xl font-headline font-black tracking-tight sm:text-7xl xl:text-8xl/none text-foreground leading-[0.95]">
                    Seu <span className="text-primary italic">Sorriso</span> em Sincronia.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-xl md:text-2xl font-medium leading-relaxed">
                    Elevando a odontologia ao próximo nível com IA e atendimento personalizado.
                  </p>
                </div>
              </div>
              <div className="relative group perspective-1000">
                <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-[4rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative aspect-square overflow-hidden rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-[12px] border-white transform-gpu transition-all duration-700 hover:rotate-2 hover:scale-[1.02]">
                  <img
                    src="https://picsum.photos/seed/dental-modern/800/800"
                    alt="Clínica Moderna"
                    className="object-cover w-full h-full"
                    data-ai-hint="dental office"
                  />
                  <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/80 backdrop-blur-xl rounded-[2rem] border-2 border-white/50 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Disponibilidade</p>
                          <p className="text-2xl font-black">Próximo Horário: <span className="text-primary">Hoje</span></p>
                       </div>
                       <div className="bg-primary h-14 w-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                          <CheckCircle2 className="text-white h-8 w-8" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="w-full py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center space-y-4 mb-24">
              <h2 className="text-5xl font-headline font-black text-primary tracking-tighter">Excelência Clínica</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium">Tratamentos avançados para quem busca o melhor resultado.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { title: "Estética 4D", desc: "Planejamento digital e lentes de contato dental em alta definição.", icon: Star },
                { title: "Ortodontia Invisível", desc: "Alinhadores transparentes com escaneamento 3D intraoral.", icon: ShieldCheck },
                { title: "Implantes Biocêuticos", desc: "Tecnologia de osseointegração acelerada por laser.", icon: Stethoscope },
              ].map((s, i) => (
                <div key={i} className="group p-10 bg-white rounded-[3rem] border-2 border-transparent hover:border-primary/20 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500">
                  <div className="h-20 w-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <s.icon className="h-10 w-10 text-primary group-hover:text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight">{s.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-32 border-t bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-24">
              <Badge className="rounded-full bg-accent/10 text-accent font-black tracking-widest px-6 h-8">SISTEMA SYNC</Badge>
              <h2 className="text-5xl font-headline font-black text-primary tracking-tighter">O Futuro é Agora</h2>
              <p className="max-w-[800px] text-muted-foreground md:text-2xl font-medium">
                Desenvolvemos um ecossistema digital para que sua única preocupação seja sorrir.
              </p>
            </div>
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-6 p-10 rounded-[3rem] bg-slate-50 border transition-all hover:translate-y-[-10px] hover:shadow-2xl">
                <div className="p-6 bg-primary/10 rounded-full">
                  <Clock className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-3xl font-headline font-black">Agenda Inteligente</h3>
                <p className="text-muted-foreground text-center text-lg font-medium">Reserva instantânea em tempo real com confirmação automática via IA.</p>
              </div>
              <div className="flex flex-col items-center space-y-6 p-10 rounded-[3rem] bg-slate-50 border transition-all hover:translate-y-[-10px] hover:shadow-2xl">
                <div className="p-6 bg-accent/10 rounded-full">
                  <ShieldCheck className="h-12 w-12 text-accent" />
                </div>
                <h3 className="text-3xl font-headline font-black">Segurança Blindada</h3>
                <p className="text-muted-foreground text-center text-lg font-medium">Seus dados e prontuários protegidos com criptografia de ponta a ponta.</p>
              </div>
              <div className="flex flex-col items-center space-y-6 p-10 rounded-[3rem] bg-slate-50 border transition-all hover:translate-y-[-10px] hover:shadow-2xl">
                <div className="p-6 bg-secondary rounded-full">
                  <Activity className="h-12 w-12 text-secondary-foreground" />
                </div>
                <h3 className="text-3xl font-headline font-black">Prontuário Digital</h3>
                <p className="text-muted-foreground text-center text-lg font-medium">Acompanhe sua evolução clínica com resumos detalhados gerados por IA.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto max-w-4xl">
            <h2 className="text-5xl font-headline font-black text-center mb-16 text-primary tracking-tighter">Central de Dúvidas</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border-none bg-white rounded-[2rem] px-8 shadow-sm">
                <AccordionTrigger className="text-xl font-black hover:no-underline py-8">Como funciona o agendamento?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-8 leading-relaxed font-medium">
                  É totalmente online. Você escolhe o procedimento, o especialista e o horário. O sistema reserva na hora e você recebe os lembretes via painel.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-none bg-white rounded-[2rem] px-8 shadow-sm">
                <AccordionTrigger className="text-xl font-black hover:no-underline py-8">Quais as formas de pagamento?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-8 leading-relaxed font-medium">
                  Aceitamos cartões, PIX e oferecemos planos especiais para tratamentos estéticos e ortodônticos, além de nota fiscal para reembolso de convênios.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-none bg-white rounded-[2rem] px-8 shadow-sm">
                <AccordionTrigger className="text-xl font-black hover:no-underline py-8">Onde a clínica está localizada?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg pb-8 leading-relaxed font-medium">
                  Estamos localizados no coração da cidade, com estacionamento privativo e acesso facilitado para sua total conveniência.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-slate-100 py-20">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Stethoscope className="h-8 w-8 text-primary" />
                <span className="text-2xl font-headline font-black text-primary tracking-tighter">Sync</span>
              </div>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Elevando o padrão da odontologia através de inteligência e cuidado.
              </p>
            </div>
            <div>
              <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-primary">Navegação</h4>
              <ul className="space-y-3 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Quem Somos</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Especialidades</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog Clínico</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-primary">Suporte</h4>
              <ul className="space-y-3 text-sm font-bold text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Contato</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Ouvidoria</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Agendamento</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-6 uppercase text-[10px] tracking-[0.3em] text-primary">Social</h4>
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border-2 hover:border-primary cursor-pointer transition-all shadow-sm">📸</div>
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border-2 hover:border-primary cursor-pointer transition-all shadow-sm">📘</div>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">© 2024 Sync Dental Group. CRO/SP 123.456</p>
            <div className="flex gap-8">
              <Link className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary" href="#">Privacidade</Link>
              <Link className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary" href="#">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
