
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2, Shield } from "lucide-react";
import Link from 'link';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Configuração mestre para garantir acesso aos e-mails específicos
  const ADMIN_EMAILS: Record<string, { level: number, role: string }> = {
    "luizhenrique8759@gmail.com": { level: 4, role: 'dentist' },
    "luiz87596531@gmail.com": { level: 3, role: 'admin' }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email || "";

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const bootConfig = ADMIN_EMAILS[userEmail];
      
      if (!userSnap.exists()) {
        const authorityLevel = bootConfig ? bootConfig.level : 0;
        const newUserData = {
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: userEmail,
          role: bootConfig ? bootConfig.role : 'patient',
          authorityLevel: authorityLevel,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newUserData);
      } else {
        const existingData = userSnap.data();
        const updatePayload: any = {
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          updatedAt: new Date().toISOString(),
        };

        if (bootConfig && (existingData.authorityLevel || 0) < bootConfig.level) {
          updatePayload.authorityLevel = bootConfig.level;
          updatePayload.role = bootConfig.role;
        }

        await updateDoc(userRef, updatePayload);
      }

      toast({ title: "Login realizado com sucesso" });
      
      // Redirecionamento imediato após login
      const finalLevel = bootConfig ? bootConfig.level : (userSnap.exists() ? userSnap.data().authorityLevel : 0);
      if (finalLevel >= 1) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na autenticação" });
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-3xl font-headline font-black text-primary">Sync</span>
          </div>
          <h2 className="text-2xl font-bold">Bem-vindo à Sync Dental</h2>
          <p className="text-muted-foreground">Sincronize sua saúde bucal conosco.</p>
        </div>

        <Card className="shadow-2xl border-none rounded-3xl overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta com o Google</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Button onClick={handleGoogleSignIn} disabled={isLoggingIn} className="w-full h-14 rounded-2xl text-lg font-bold gap-4">
              {isLoggingIn ? <Loader2 className="animate-spin h-5 w-5" /> : "Login com Google"}
            </Button>
            <div className="mt-6 flex items-center gap-2 justify-center text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              <Shield className="h-3 w-3" /> Proteção de Dados Sync
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
