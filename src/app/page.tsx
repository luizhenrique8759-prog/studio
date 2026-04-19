
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { 
  Star, 
  Stethoscope, 
  Activity, 
  Shield, 
  Loader2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData, isLoading: isLoadingDoc } = useDoc(userDocRef);

  // Redirecionamento automático se já estiver logado
  useEffect(() => {
    if (!isUserLoading && !isLoadingDoc && user && userData) {
      if (userData.authorityLevel >= 1) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, userData, isUserLoading, isLoadingDoc, router]);

  const renderAuthButtons = () => {
    if (isUserLoading || isLoadingDoc) return <Loader2 className="animate-spin h-5 w-5 text-primary" />;

    if (!user) {
      return (
        <div className="flex gap-4 items-center">
          <Link className="text-sm font-bold hover:text-primary transition-colors tracking-tight uppercase" href="/auth">Entrar</Link>
          <Button asChild className="rounded-full px-8 h-12 font-bold shadow-xl bg-primary">
            <Link href="/booking">Agendar Agora</Link>
          </Button>
        </div>
      );
    }

    return null; // O useEffect cuidará do redirecionamento
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-24 flex items-center border-b bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="/">
            <div className="bg-primary p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl shadow-primary/30">
              <Stethoscope className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-headline font-black tracking-tighter text-primary leading-none">Sync</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Dental Care</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-10 items-center">
            <Link className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors" href="#services">Serviços</Link>
            {renderAuthButtons()}
          </nav>

          <div className="md:hidden">
             {renderAuthButtons()}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-24 md:py-36 lg:py-56 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.15),transparent_60%)]" />
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="flex flex-col justify-center space-y-10 z-10">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                    <Star className="h-4 w-4 fill-current" /> Excelência em Odontologia Digital
                  </div>
                  <h1 className="text-6xl font-headline font-black tracking-tight sm:text-7xl xl:text-8xl/none text-foreground leading-[0.95]">
                    Sincronize seu <span className="text-primary italic">Sorriso</span>.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground text-xl md:text-2xl font-medium leading-relaxed">
                    Sua saúde bucal gerida pelos melhores profissionais.
                  </p>
                  <Button asChild size="lg" className="rounded-full px-12 h-16 text-xl font-bold shadow-2xl hover:scale-105 transition-all">
                    <Link href="/booking">Agendar Consulta <ArrowRight className="ml-2 h-6 w-6" /></Link>
                  </Button>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-[4rem] blur-3xl opacity-50" />
                <div className="relative aspect-square overflow-hidden rounded-[3rem] shadow-2xl border-[12px] border-white transform transition-all hover:scale-[1.02]">
                  <img
                    src="https://picsum.photos/seed/dental-modern/800/800"
                    alt="Clínica Moderna"
                    className="object-cover w-full h-full"
                    data-ai-hint="dental office"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="w-full py-32 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-5xl font-headline font-black text-primary tracking-tighter mb-16">Especialidades Sync</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { title: "Estética Avançada", desc: "Lentes de contato e facetas com planejamento digital.", icon: Star },
                { title: "Invisalign", desc: "Alinhadores invisíveis para correção ortodôntica discreta.", icon: ShieldCheck },
                { title: "Implantes", desc: "Recupere seu sorriso em tempo recorde.", icon: Stethoscope },
              ].map((s, i) => (
                <div key={i} className="group p-10 bg-white rounded-[3rem] border-2 border-transparent hover:border-primary/20 hover:shadow-2xl transition-all">
                  <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:bg-primary group-hover:text-white transition-all">
                    <s.icon className="h-8 w-8 text-primary group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t bg-slate-100 py-10">
        <div className="container px-4 md:px-6 mx-auto text-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">© 2024 Sync Dental Group. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
