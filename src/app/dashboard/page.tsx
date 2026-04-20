
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ShieldCheck, LogOut, Loader2, Clock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WelcomeWaitingPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUser } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
      return;
    }
    
    if (!isUserLoading && !isLoadingUser && userData && userData.authorityLevel >= 1) {
      router.push('/admin');
    }
  }, [user, isUserLoading, userData, isLoadingUser, router]);

  if (isUserLoading || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-6 bg-slate-50">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-500">
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <Clock className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-headline font-black text-primary">Quase lá, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground text-sm">
            Seu cadastro foi realizado com sucesso. Agora, um administrador precisa liberar seu acesso ao sistema clínico.
          </p>
        </div>
        
        <div className="p-4 bg-muted/30 rounded-2xl text-left space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Informações da Conta</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1">
              <p className="text-xs font-bold truncate">{user?.displayName}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button variant="outline" className="w-full rounded-xl h-12 gap-2" onClick={() => auth && signOut(auth)}>
            <LogOut className="h-4 w-4" /> Sair da Conta
          </Button>
          <p className="text-[9px] text-muted-foreground">
            Enquanto aguarda, você pode fechar esta página. Notificaremos quando seu acesso for liberado.
          </p>
        </div>
      </div>
    </div>
  );
}
