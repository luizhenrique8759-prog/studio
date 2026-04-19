"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Github, Mail } from "lucide-react";
import Link from 'next/link';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'login';
  const isLogin = type === 'login';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, handle auth here. For now, redirect to dashboard.
    router.push('/dashboard');
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
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-muted-foreground">
            {isLogin ? 'Entre para gerenciar seus agendamentos' : 'Comece a cuidar do seu sorriso hoje mesmo'}
          </p>
        </div>

        <Card className="shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Acesso</CardTitle>
            <CardDescription>Use seu e-mail ou uma conta social</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="rounded-lg">
                <Github className="mr-2 h-4 w-4" /> Github
              </Button>
              <Button variant="outline" className="rounded-lg">
                <Mail className="mr-2 h-4 w-4" /> Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="nome@exemplo.com" required className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {isLogin && <Link href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>}
                </div>
                <Input id="password" type="password" required className="rounded-lg" />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input id="confirm-password" type="password" required className="rounded-lg" />
                </div>
              )}
              <Button type="submit" className="w-full rounded-lg h-11 text-lg shadow-lg">
                {isLogin ? 'Entrar' : 'Registrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center w-full text-sm text-muted-foreground">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <Link 
                href={isLogin ? '/auth?type=register' : '/auth?type=login'} 
                className="ml-1 text-primary font-bold hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}