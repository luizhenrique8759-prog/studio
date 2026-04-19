
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Stethoscope, Loader2, Shield } from "lucide-react";
import Link from 'next/link';
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

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const newUserData = {
          id: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email,
          role: 'patient',
          authorityLevel: 0,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, newUserData);
        toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso." });
        router.push('/dashboard');
      } else {
        const existingData = userSnap.data();
        await updateDoc(userRef, {
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          updatedAt: new Date().toISOString(),
        });
        
        toast({ title: "Login realizado", description: `Bem-vindo de volta, ${user.displayName}!` });
        
        // Redirecionamento baseado no nível de autoridade real do banco
        if (existingData.authorityLevel >= 1) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Falha na Autenticação",
        description: "Ocorreu um erro ao tentar entrar.",
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
            <h2 className="text-3xl font-headline font-black tracking-tight text-foreground">Acesso Sincronizado</h2>
            <p className="text-muted-foreground font-medium">Sua identidade digital na Sync Dental.</p>
          </div>
        </div>

        <Card className="shadow-2xl border-none rounded-[3rem] overflow-hidden">
          <div className="bg-primary h-2 w-full" />
          <CardHeader className="space-y-2 pt-10 text-center">
            <CardTitle className="text-2xl font-black">Entrar</CardTitle>
            <CardDescription>Login seguro via Google</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 p-10">
            <Button onClick={handleGoogleSignIn} disabled={isLoggingIn} variant="outline" className="w-full h-16 gap-4 rounded-2xl border-2 font-black text-xl shadow-lg">
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "Login com Google"}
            </Button>
            <div className="flex items-center gap-2 justify-center py-2 bg-slate-50 rounded-xl border border-dashed">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Segurança Biométrica Digital</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
