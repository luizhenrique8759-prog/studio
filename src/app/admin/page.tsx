
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Search, ShieldAlert, CheckCircle2, Shield, Stethoscope, Activity, UserCog, Users, TrendingUp, DollarSign } from "lucide-react";
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
  
  const authorityLevel = useMemo(() => {
    if (user?.email === "luizhenrique8759@gmail.com") return 4;
    return userData?.authorityLevel || 0;
  }, [userData, user]);

  const isAuthorized = useMemo(() => {
    if (isUserLoading) return false;
    return authorityLevel >= 1;
  }, [isUserLoading, authorityLevel]);

  // Coleções filtradas pela autoridade
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

  const handleUpdateLevel = async (targetUser: any, levelStr: string) => {
    if (!db || authorityLevel < 3) return;
    const level = parseInt(levelStr);
    let role = 'patient';
    if (level === 1) role = 'reception';
    if (level === 2) role = 'assistant';
    if (level === 3) role = 'admin';
    if (level === 4) role = 'dentist';
    
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { 
        role,
        authorityLevel: level,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Nível Atualizado", description: `${targetUser.name} agora é Nível ${level}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar" });
    }
  };

  const handleConfirmAppointment = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'appointments', id), { status: 'confirmed' });
      toast({ title: "Confirmado com sucesso" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao confirmar" });
    }
  };

  if (isUserLoading || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        <div className="flex gap-2">
           <Button variant="outline" asChild><Link href="/dashboard">Meu Painel de Paciente</Link></Button>
           <Button onClick={handleLogout}>Sair</Button>
        </div>
      </div>
    );
  }

  const roleNames = ["Paciente", "Recepção", "Auxiliar", "Administrativo", "Dentista"];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-4 border-primary shadow-xl">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-white font-bold text-xl">
              {user.displayName?.substring(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-black text-primary tracking-tighter">Portal Sync</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4">
                Lvl {authorityLevel} - {roleNames[authorityLevel]}
              </Badge>
              <Button variant="link" asChild className="text-xs h-auto p-0 font-bold uppercase tracking-widest">
                <Link href="/dashboard">Acessar Área do Paciente</Link>
              </Button>
            </div>
          </div>
        </div>
        <Button variant="outline" className="rounded-full text-destructive border-destructive font-bold" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair do Sistema
        </Button>
      </header>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8 flex-wrap h-auto gap-1">
          <TabsTrigger value="appointments" className="rounded-xl px-8 font-bold data-[state=active]:bg-white">Agenda</TabsTrigger>
          {authorityLevel >= 2 && <TabsTrigger value="records" className="rounded-xl px-8 font-bold data-[state=active]:bg-white">Prontuários</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="management" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Equipe</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="finance" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Financeiro</TabsTrigger>}
        </TabsList>

        <TabsContent value="appointments">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Próximas Consultas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAppts ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5">
                      <TableHead className="pl-8">Paciente</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-8">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments?.map((apt) => (
                      <TableRow key={apt.id} className="hover:bg-muted/5">
                        <TableCell className="font-bold pl-8">{apt.patientName}</TableCell>
                        <TableCell>{apt.serviceName}</TableCell>
                        <TableCell className="font-medium text-primary">{apt.date} às {apt.time}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} className="rounded-full">
                            {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          {apt.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10 font-bold" onClick={() => handleConfirmAppointment(apt.id)}>
                              Confirmar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {appointments?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">Nenhuma consulta agendada.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management">
          <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
             <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Gestão de Colaboradores</CardTitle>
              <CardDescription>Apenas Administradores (Nível 3+) podem gerenciar permissões.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingUsers ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5">
                      <TableHead className="pl-8">Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Nível Atual</TableHead>
                      <TableHead className="text-right pr-8">Alterar Nível</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-bold pl-8">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">Nível {u.authorityLevel || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <select 
                            className="bg-background border rounded-lg p-1 text-sm font-bold"
                            value={u.authorityLevel || 0}
                            onChange={(e) => handleUpdateLevel(u, e.target.value)}
                          >
                            <option value="0">Paciente (0)</option>
                            <option value="1">Recepção (1)</option>
                            <option value="2">Auxiliar (2)</option>
                            <option value="3">Admin (3)</option>
                            <option value="4">Dentista (4)</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-xl bg-primary text-white">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Faturamento Estimado</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-black">R$ {appointments?.reduce((acc, a) => acc + (SERVICES.find(s => s.id === a.serviceId)?.price || 0), 0).toLocaleString('pt-BR')}</p>
                <p className="text-sm opacity-70 mt-2">Baseado em consultas agendadas</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-none shadow-xl bg-white">
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-accent" /> Ticket Médio</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-primary">R$ {(appointments && appointments.length > 0 ? (appointments.reduce((acc, a) => acc + (SERVICES.find(s => s.id === a.serviceId)?.price || 0), 0) / appointments.length) : 0).toLocaleString('pt-BR')}</p>
                <p className="text-sm text-muted-foreground mt-2">Média por procedimento</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
