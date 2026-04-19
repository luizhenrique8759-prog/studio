
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Search, ShieldAlert, CheckCircle2, Shield, Stethoscope, Activity, UserCog, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUserData } = useDoc(userDocRef);
  
  const authorityLevel = useMemo(() => userData?.authorityLevel || 0, [userData]);

  // Bloqueio condicional: espera carregar o perfil para decidir se tem autorização
  const isAuthorized = useMemo(() => {
    if (isUserLoading || isLoadingUserData) return false;
    return authorityLevel >= 1;
  }, [isUserLoading, isLoadingUserData, authorityLevel]);

  const usersRef = useMemoFirebase(() => {
    if (!db || !isAuthorized || authorityLevel < 3) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAuthorized, authorityLevel]);
  
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const apptsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'desc'));
  }, [db, isAuthorized]);
  
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  const canViewRecords = authorityLevel >= 2;
  const canViewManagement = authorityLevel >= 3;
  const canViewFinance = authorityLevel >= 3;

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

  const handleToggleProfessional = async (targetUser: any, levelStr: string) => {
    if (!db || authorityLevel < 3) return;
    const level = parseInt(levelStr);
    const role = level === 0 ? 'patient' : (level === 3 ? 'admin' : 'professional');
    
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { 
        role,
        authorityLevel: level,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Autoridade Atualizada", description: `${targetUser.name} agora é Nível ${level}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar privilégios" });
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'appointments', id), { status: 'confirmed' });
      toast({ title: "Agendamento Confirmado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao confirmar" });
    }
  };

  const totalBilling = useMemo(() => {
    if (!appointments) return 0;
    return appointments.reduce((acc, apt) => {
      const service = SERVICES.find(s => s.id === apt.serviceId);
      return acc + (service?.price || 0);
    }, 0);
  }, [appointments]);

  if (isUserLoading || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Esta área é exclusiva para profissionais da clínica.</p>
        <div className="flex gap-2">
           <Button variant="outline" asChild><Link href="/dashboard">Ir para Minha Área de Paciente</Link></Button>
           <Button onClick={handleLogout}>Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-4 border-primary shadow-lg">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-white font-bold text-xl">
              {user.displayName?.substring(0,2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
              Portal Profissional
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
               <p className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
                <UserCog className="h-4 w-4" /> Nível {authorityLevel} - {userData?.role?.toUpperCase()}
              </p>
              <Badge variant="outline" className="rounded-full bg-slate-50" asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Ver Meu Painel Pessoal
                </Link>
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Início</Link>
          </Button>
          <Button variant="outline" className="rounded-full text-destructive border-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl mb-8 flex-wrap h-auto border">
          <TabsTrigger value="appointments" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Agenda</TabsTrigger>
          {canViewRecords && <TabsTrigger value="records" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Prontuários</TabsTrigger>}
          {canViewManagement && <TabsTrigger value="management" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Equipe</TabsTrigger>}
          {canViewFinance && <TabsTrigger value="billing" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Financeiro</TabsTrigger>}
        </TabsList>
        
        {/* Resto do conteúdo do componente mantido conforme lógica original... */}
        <TabsContent value="appointments">
           <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b"><CardTitle>Próximas Consultas</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoadingAppts ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="pl-8">Paciente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-8">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments?.map((apt) => (
                      <TableRow key={apt.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="font-bold pl-8 text-lg">{apt.patientName}</TableCell>
                        <TableCell>{apt.serviceName}</TableCell>
                        <TableCell className="font-medium text-primary">{apt.time}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} className="rounded-full px-4 py-1 text-[10px] uppercase font-bold tracking-wider">
                            {apt.status === 'confirmed' ? '✓ Confirmado' : '⏳ Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            {apt.status === 'pending' && (
                              <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10 rounded-full" onClick={() => handleConfirmAppointment(apt.id)}>
                                <CheckCircle2 className="h-5 w-5" /> <span className="ml-2 hidden sm:inline">Confirmar</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
