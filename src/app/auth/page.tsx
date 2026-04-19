
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Stethoscope, Loader2, Shield } from "lucide-react";
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verificar ou criar perfil do usuário
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let role = user.email === HARDCODED_ADMIN_EMAIL ? 'admin' : 'patient';

      if (!userSnap.exists()) {
        // Primeiro acesso: Criar perfil
        const newUserData = {
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email,
          role: role,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newUserData);
        
        // Se for admin blindado, também garantir a role no documento de permissão
        if (user.email === HARDCODED_ADMIN_EMAIL) {
          const roleRef = doc(db, 'app_roles', 'admin', 'users', user.uid);
          await setDoc(roleRef, { active: true, assignedAt: new Date().toISOString() });
        }
      } else {
        // Se o email é o blindado, forçar o role admin na memória para o redirecionamento
        if (user.email === HARDCODED_ADMIN_EMAIL) {
          role = 'admin';
        } else {
          role = userSnap.data().role;
        }
      }

      toast({
        title: user.email === HARDCODED_ADMIN_EMAIL ? "Acesso Blindado Confirmado" : "Acesso Autorizado",
        description: `Bem-vindo, ${user.displayName}!`,
      });

      // Redirecionamento baseado no papel
      if (user.email === HARDCODED_ADMIN_EMAIL || role === 'professional' || role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Falha na Autenticação",
        description: "Acesse com sua conta Google vinculada à clínica.",
      });
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="bg-primary p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-2xl shadow-primary/30">
              <Stethoscope className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-4xl font-headline font-black tracking-tighter text-primary leading-none">Sync</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Dental Group</span>
            </div>
          </Link>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-black tracking-tight text-foreground">
              Acesso Seguro
            </h2>
            <p className="text-muted-foreground font-medium">
              Utilizamos Google Identity para proteção de prontuários.
            </p>
          </div>
        </div>

        <Card className="shadow-[0_40px_80px_rgba(0,0,0,0.1)] border-none rounded-[3rem] overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardHeader className="space-y-2 pt-10 text-center">
            <CardTitle className="text-2xl font-black">Entrar na Clínica</CardTitle>
            <CardDescription className="font-medium">Contas corporativas ou pessoais Google</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-10">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoggingIn}
              variant="outline" 
              className="w-full h-16 gap-4 rounded-2xl border-2 hover:bg-muted/50 transition-all font-black text-xl shadow-lg"
            >
              {isLoggingIn ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Login com Google
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 justify-center py-2 bg-slate-50 rounded-xl border border-dashed">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conexão 256-bit SSL</span>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-8">
            <p className="text-center w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-relaxed px-6">
              Acesso administrativo blindado para <span className="text-primary">{HARDCODED_ADMIN_EMAIL}</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
