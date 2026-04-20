
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const MASTER_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = (user.email || "").toLowerCase().trim();

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      const isMaster = userEmail === MASTER_ADMIN_EMAIL;
      let finalLevel = 0;

      if (!userSnap.exists()) {
        // Busca convite pendente por email (limitada a 1 para cumprir regras de segurança)
        const q = query(collection(db, 'users'), where('email', '==', userEmail), limit(1));
        const emailSnap = await getDocs(q);
        
        if (!emailSnap.empty) {
          const pendingDoc = emailSnap.docs[0];
          const pendingData = pendingDoc.data();
          finalLevel = pendingData.authorityLevel || 0;
          
          await setDoc(userRef, {
            ...pendingData,
            id: user.uid,
            name: user.displayName || pendingData.name,
            photoURL: user.photoURL,
            status: 'active',
            updatedAt: new Date().toISOString()
          });
          
          if (pendingDoc.id !== user.uid) {
            try { await deleteDoc(doc(db, 'users', pendingDoc.id)); } catch (e) {}
          }
        } else {
          // Novo usuário sem convite
          finalLevel = isMaster ? 4 : 0;
          const newUserData = {
            id: user.uid,
            name: user.displayName || 'Novo Usuário',
            email: userEmail,
            role: isMaster ? 'dentist' : 'patient',
            authorityLevel: finalLevel,
            photoURL: user.photoURL,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await setDoc(userRef, newUserData);
        }
      } else {
        const existingData = userSnap.data();
        finalLevel = existingData.authorityLevel || 0;
        
        const updatePayload: any = {
          name: user.displayName || existingData.name,
          photoURL: user.photoURL || existingData.photoURL,
          updatedAt: new Date().toISOString(),
        };

        // Garante que o Master Admin sempre tenha nível 4
        if (isMaster && finalLevel < 4) {
          updatePayload.authorityLevel = 4;
          updatePayload.role = 'dentist';
          finalLevel = 4;
        }

        await updateDoc(userRef, updatePayload);
      }

      if (finalLevel >= 1) {
        toast({ title: "Bem-vindo!", description: `Acesso autorizado ao Portal Sync.` });
        router.push('/admin');
      } else {
        toast({ title: "Login Realizado", description: "Aguarde a liberação do seu acesso por um administrador." });
        router.push('/dashboard');
      }
      
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro na autenticação", 
        description: "Verifique sua conexão ou tente novamente." 
      });
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
          <h2 className="text-2xl font-bold">Acesso à Plataforma</h2>
          <p className="text-muted-foreground text-sm">Faça login para entrar ou solicitar acesso à equipe.</p>
        </div>

        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden">
          <CardHeader className="text-center pt-10">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Utilize sua conta Google</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoggingIn} 
              className="w-full h-16 rounded-2xl text-lg font-bold gap-4 shadow-lg"
            >
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : "Login com Google"}
            </Button>
            
            <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Todos os novos cadastros são direcionados para uma sala de espera. Fale com o administrador da clínica para liberar seu acesso às ferramentas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
