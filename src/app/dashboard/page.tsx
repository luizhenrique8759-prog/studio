
"use client";

import { useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICES } from "@/lib/mock-data";
import { Calendar as CalendarIcon, Clock, User, Stethoscope, LogOut, Loader2, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, where, doc } from 'firebase/firestore';

export default function PatientDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUser } = useDoc(userDocRef);
  const authorityLevel = userData?.authorityLevel || 0;

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'appointments'),
      where('patientId', '==', user.uid)
    );
  }, [db, user]);

  const { data: appointments, isLoading: isLoadingAppointments } = useCollection(appointmentsQuery);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao sair" });
    }
  };

  if (isUserLoading || isLoadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const roleNames = ["Paciente", "Recepção", "Auxiliar", "Administrativo", "Dentista"];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b bg-white h-16 sticky top-0 z-40">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-headline font-bold text-primary">Sync</span>
          </Link>
          <div className="flex items-center gap-4">
            {authorityLevel >= 1 && (
              <Button asChild variant="ghost" className="text-primary font-bold hidden md:flex items-center gap-2">
                <Link href="/admin"><ShieldCheck className="h-4 w-4" /> Portal de Gestão</Link>
              </Button>
            )}
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive"><LogOut className="h-5 w-5" /></Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-headline font-black text-primary">Minhas Consultas</h1>
            <p className="text-muted-foreground">{user.displayName}</p>
          </div>
          <Button asChild className="rounded-full shadow-lg">
            <Link href="/booking">Novo Agendamento</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {isLoadingAppointments ? (
              <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : appointments && appointments.length > 0 ? (
              appointments.map(apt => (
                <Card key={apt.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'}>{apt.status === 'confirmed' ? 'Confirmado' : 'Aguardando'}</Badge>
                        <h3 className="text-xl font-bold mt-2">{apt.serviceName}</h3>
                      </div>
                      <p className="text-lg font-black text-primary">R$ {SERVICES.find(s => s.id === apt.serviceId)?.price || '...'}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><User className="w-4 h-4" /> {apt.professionalName}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {apt.date} às {apt.time}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="p-20 text-center border-dashed border-2 rounded-[2rem]">
                <p className="text-muted-foreground font-medium">Você ainda não possui agendamentos ativos.</p>
                <Button asChild variant="link" className="mt-2 font-bold"><Link href="/booking">Marcar minha primeira consulta</Link></Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
             <Card className="rounded-3xl border-none shadow-md p-6 bg-white">
                <h3 className="font-bold mb-4">Suporte Sync</h3>
                <p className="text-sm text-muted-foreground mb-4">Em caso de dúvidas sobre seu tratamento ou necessidade de reagendamento urgente, entre em contato.</p>
                <Button className="w-full rounded-xl" variant="outline">Falar com Recepção</Button>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
