
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientDashboard() {
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
    
    // Se logou mas é paciente, redireciona para a home com aviso
    if (!isUserLoading && !isLoadingUser && userData && userData.authorityLevel === 0) {
      // O middleware/auth page já deve lidar com isso, mas garantimos aqui
      if (auth) signOut(auth);
    }
  }, [user, isUserLoading, userData, isLoadingUser, router, auth]);

  if (isUserLoading || isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-6 bg-slate-50">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full space-y-6">
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-headline font-black">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Olá, <strong>{user?.displayName}</strong>. Sua conta está cadastrada como paciente. No momento, o acesso ao app é exclusivo para a equipe clínica.
        </p>
        <div className="pt-4 space-y-3">
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Entre em contato para agendamentos</p>
          <Button variant="outline" className="w-full rounded-xl h-12" onClick={() => auth && signOut(auth)}>
            <LogOut className="mr-2 h-4 w-4" /> Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
