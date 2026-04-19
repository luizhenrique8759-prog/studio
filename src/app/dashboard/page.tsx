
"use client";

import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/lib/mock-data";
import { Calendar as CalendarIcon, Clock, User, Stethoscope, ChevronRight, LogOut, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, where, orderBy } from 'firebase/firestore';

export default function PatientDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  // Simplificamos a query para garantir permissões e performance sem depender de múltiplos índices complexos
  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'appointments'),
      where('patientId', '==', user.uid)
    );
  }, [db, user]);

  const { data: appointments, isLoading: isLoadingAppointments, error } = useCollection(appointmentsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Sessão encerrada" });
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao sair" });
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const userInitials = user.displayName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1 rounded-lg">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold text-primary">Sync</span>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-accent text-white font-bold">{userInitials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Painel Pessoal</h1>
            <p className="text-muted-foreground">{user.displayName || 'Paciente'}</p>
          </div>
          <Button asChild className="rounded-full px-8 shadow-lg">
            <Link href="/booking">Novo Agendamento</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
              <CalendarIcon className="text-primary h-5 w-5" /> Minha Agenda
            </h2>
            
            {isLoadingAppointments ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : appointments && appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map(apt => {
                  const service = SERVICES.find(s => s.id === apt.serviceId);
                  return (
                    <Card key={apt.id} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'}>
                                {apt.status === 'confirmed' ? 'Confirmado' : 'Em Análise'}
                              </Badge>
                              <h3 className="text-xl font-bold mt-2">{apt.serviceName || service?.name}</h3>
                            </div>
                            <p className="text-lg font-bold text-primary">R$ {service?.price || '...'}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><User className="w-4 h-4" /> {apt.professionalName}</div>
                            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {apt.date} às {apt.time}</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center space-y-4 border-dashed border-2">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-bold">Nenhum agendamento ativo.</p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/booking">Marcar Agora</Link>
                </Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-headline font-bold">Documentação</h2>
            <div className="grid gap-3">
              <Card className="border-none shadow-sm p-4 bg-muted/20">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Histórico Clínico</p>
                <p className="text-sm">Para visualizar seu prontuário detalhado, solicite acesso ao seu dentista durante a consulta.</p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
