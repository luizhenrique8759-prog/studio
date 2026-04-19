
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Configuração mestre para administradores
  const ADMIN_EMAILS: Record<string, { level: number, role: string }> = {
    "luizhenrique8759@gmail.com": { level: 3, role: 'admin' },
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
      
      let finalLevel = 0;

      if (!userSnap.exists()) {
        finalLevel = bootConfig ? bootConfig.level : 0;
        const newUserData = {
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: userEmail,
          role: bootConfig ? bootConfig.role : 'patient',
          authorityLevel: finalLevel,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newUserData);
      } else {
        const existingData = userSnap.data();
        finalLevel = existingData.authorityLevel || 0;
        
        const updatePayload: any = {
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          updatedAt: new Date().toISOString(),
        };

        // Garante que o administrador mestre sempre tenha seu nível
        if (bootConfig && finalLevel < bootConfig.level) {
          updatePayload.authorityLevel = bootConfig.level;
          updatePayload.role = bootConfig.role;
          finalLevel = bootConfig.level;
        }

        await updateDoc(userRef, updatePayload);
      }

      // Redirecionamento baseado na autoridade
      if (finalLevel >= 1) {
        toast({ title: "Bem-vindo ao Portal de Gestão" });
        router.push('/admin');
      } else {
        // Se for paciente, desloga e avisa que não tem acesso
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Acesso Restrito", 
          description: "Este sistema é de uso exclusivo da equipe Sync Dental." 
        });
        setIsLoggingIn(false);
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
            <Stethoscope className="h-10 w-10 text-primary" />
            <span className="text-4xl font-headline font-black text-primary tracking-tighter">Sync</span>
          </div>
          <h2 className="text-2xl font-bold">Portal da Equipe</h2>
          <p className="text-muted-foreground">Acesse as ferramentas clínicas e administrativas.</p>
        </div>

        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pt-10">
            <CardTitle>Entrar no Sistema</CardTitle>
            <CardDescription>Utilize seu e-mail corporativo Google</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoggingIn} 
              className="w-full h-16 rounded-2xl text-lg font-bold gap-4 shadow-lg"
            >
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "Login com Google"}
            </Button>
            
            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 items-start">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                Acesso restrito a colaboradores autorizados. Se você é um paciente, seus agendamentos são geridos exclusivamente pela nossa recepção.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
