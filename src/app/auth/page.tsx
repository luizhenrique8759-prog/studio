
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Sucesso!",
        description: "Você entrou com sua conta Google.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na autenticação",
        description: "Não foi possível entrar com o Google. Tente novamente.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-primary p-2 rounded-xl">
              <Stethoscope className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-headline font-bold text-primary tracking-tight">Sync</span>
          </Link>
          <h2 className="text-2xl font-headline font-bold tracking-tight">
            Acesso à Clínica
          </h2>
          <p className="text-muted-foreground">
            Entre exclusivamente com sua conta Google para segurança.
          </p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">Entrar</CardTitle>
            <CardDescription className="text-center">Utilize sua conta institucional ou pessoal Google</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button 
              onClick={handleGoogleSignIn} 
              variant="outline" 
              className="w-full h-12 gap-3 rounded-xl border-2 hover:bg-muted/50 transition-all font-bold text-lg"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              Continuar com Google
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-center w-full text-xs text-muted-foreground px-6">
              O Sync utiliza autenticação segura via Google Identity Services.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
