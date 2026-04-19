import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Calendar, ShieldCheck, Clock, Users, ChevronRight, Stethoscope } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="bg-primary p-1.5 rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-headline font-bold tracking-tight text-primary">Sync</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
            Funcionalidades
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/auth?type=login">
            Entrar
          </Link>
          <Button asChild size="sm" variant="default" className="rounded-full px-6">
            <Link href="/auth?type=register">Cadastrar</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Seu sorriso merece o melhor agendamento.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-body leading-relaxed">
                    A Clínica Dental Sync oferece uma experiência moderna de agendamento online, com disponibilidade em tempo real e profissionais de elite.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-lg shadow-lg shadow-primary/20">
                    <Link href="/booking">Agendar Consulta Agora <ChevronRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-lg">
                    <Link href="/admin">Portal Administrativo</Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video lg:aspect-square overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border">
                <img
                  src="https://picsum.photos/seed/dental1/800/800"
                  alt="Clínica Odontológica Moderna"
                  className="object-cover w-full h-full"
                  data-ai-hint="dental office"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl text-primary">Tecnologia ao serviço da sua saúde</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Desenvolvemos uma plataforma intuitiva para que você foque no que importa: seu bem-estar.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold">Agendamento 24/7</h3>
                <p className="text-muted-foreground text-center">Marque sua consulta a qualquer hora, de qualquer lugar, sem precisar ligar.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-accent/10 rounded-full">
                  <ShieldCheck className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-headline font-bold">Segurança de Dados</h3>
                <p className="text-muted-foreground text-center">Seus dados médicos e pessoais protegidos com os mais altos padrões de criptografia.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-secondary/80 rounded-full">
                  <Users className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-headline font-bold">Gestão Inteligente</h3>
                <p className="text-muted-foreground text-center">IA para resumos de faturamento e notificações personalizadas para você não esquecer.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-white py-12">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="text-lg font-headline font-bold text-primary">Clínica Dental Sync</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Clínica Dental Sync. Todos os direitos reservados.</p>
          <div className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">Termos de Serviço</Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}