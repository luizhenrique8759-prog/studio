
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

  const MASTER_ADMIN_EMAILS = ["luizhenrique8759@gmail.com", "luiz88955548@gmail.com"];

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
      
      const isMaster = MASTER_ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
      let finalLevel = 0;

      if (!userSnap.exists()) {
        // Verifica se há um convite pendente por e-mail
        // Agora as regras permitem que qualquer logado faça essa consulta
        const q = query(collection(db, 'users'), where('email', '==', userEmail), limit(1));
        const emailSnap = await getDocs(q);
        
        if (!emailSnap.empty) {
          const pendingDoc = emailSnap.docs[0];
          const pendingData = pendingDoc.data();
          finalLevel = pendingData.authorityLevel || 0;
          
          // Cria o documento oficial com o UID do Firebase
          await setDoc(userRef, {
            ...pendingData,
            id: user.uid,
            name: user.displayName || pendingData.name,
            photoURL: user.photoURL,
            status: 'active',
            updatedAt: new Date().toISOString()
          });
          
          // Remove o convite antigo que usava ID aleatório
          if (pendingDoc.id !== user.uid) {
            try { await deleteDoc(doc(db, 'users', pendingDoc.id)); } catch (e) {
              console.warn("Could not delete invitation doc, it might not be necessary.", e);
            }
          }
        } else {
          // Novo usuário padrão sem convite
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

        // Garante que o Master Admin sempre tenha nível 4 se logar
        if (isMaster && finalLevel < 4) {
          updatePayload.authorityLevel = 4;
          updatePayload.role = 'dentist';
          finalLevel = 4;
        }

        await updateDoc(userRef, updatePayload);
      }

      // Redirecionamento baseado no nível
      if (finalLevel >= 1) {
        toast({ title: "Bem-vindo!", description: `Acesso autorizado ao Portal Sync.` });
        router.push('/admin');
      } else {
        toast({ title: "Login Realizado", description: "Seu acesso está em análise. Fale com o administrador." });
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
          <h2 className="text-2xl font-bold text-slate-800">Acesso à Plataforma</h2>
          <p className="text-muted-foreground text-sm">Faça login com sua conta Google para continuar.</p>
        </div>

        <Card className="shadow-2xl border-none rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="text-center pt-10">
            <CardTitle className="text-xl">Portal Interno</CardTitle>
            <CardDescription>Acesso restrito para equipe e pacientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="p-10 space-y-6">
            <Button 
              onClick={handleGoogleSignIn} 
              disabled={isLoggingIn} 
              className="w-full h-16 rounded-2xl text-lg font-bold gap-4 shadow-xl transition-all hover:scale-[1.02]"
            >
              {isLoggingIn ? <Loader2 className="animate-spin h-6 w-6" /> : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Login com Google
                </>
              )}
            </Button>
            
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3 items-start">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                Sua conta será analisada automaticamente. Após o login, aguarde a liberação do administrador para acessar as ferramentas clínicas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
