
"use client";

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Star, Stethoscope, Loader2, ArrowRight } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const heroImage = useMemo(() => 
    PlaceHolderImages.find(img => img.id === 'hero-landing') || PlaceHolderImages[0], 
  []);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData, isLoading: isLoadingDoc } = useDoc(userDocRef);

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
          <Link className="text-sm font-bold hover:text-primary transition-colors" href="/auth">Acesso Equipe</Link>
          <Button asChild className="rounded-full px-8 h-10 font-bold bg-primary shadow-lg">
            <Link href="/auth">Entrar</Link>
          </Button>
        </div>
      );
    }

    return (
      <Button asChild variant="outline" className="rounded-full">
        <Link href={(userData?.authorityLevel || 0) >= 1 ? "/admin" : "/dashboard"}>Ir para o Painel</Link>
      </Button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-20 flex items-center border-b bg-white/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <div className="bg-primary p-2 rounded-xl">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-headline font-black tracking-tighter text-primary">Sync</span>
          </Link>
          <nav className="flex gap-8 items-center">
            {renderAuthButtons()}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full py-20 lg:py-32 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                  <Star className="h-3 w-3 fill-current" /> Uso Interno Clínico
                </div>
                <h1 className="text-5xl md:text-7xl font-headline font-black text-foreground leading-[1.1]">
                  Gestão Odontológica em <span className="text-primary">Sincronia</span>.
                </h1>
                <p className="max-w-[500px] text-muted-foreground text-lg md:text-xl">
                  Centralize agendamentos, prontuários e faturamento em uma única plataforma para sua equipe.
                </p>
                <div className="flex gap-4">
                  <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg font-bold">
                    <Link href="/auth">Entrar no Sistema <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-200">
                  <img
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    className="object-cover w-full h-full"
                    data-ai-hint={heroImage.imageHint}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
