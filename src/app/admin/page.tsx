
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, ShieldAlert, CheckCircle2, Users, TrendingUp, DollarSign, CalendarPlus, Bell, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [systemErrors, setSystemErrors] = useState<any[]>([]);

  useEffect(() => {
    const handleError = (error: any) => {
      setSystemErrors(prev => [{
        id: Date.now(),
        message: error.message || "Erro desconhecido",
        path: error.request?.path || "N/A",
        operation: error.request?.method || "unknown",
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10));
    };

    errorEmitter.on('permission-error', handleError);
    return () => errorEmitter.off('permission-error', handleError);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUserData } = useDoc(userDocRef);
  
  const authorityLevel = useMemo(() => {
    if (!user) return 0;
    const email = user.email;
    if (email === "luizhenrique8759@gmail.com") return 4;
    if (email === "luiz87596531@gmail.com") return 3;
    return userData?.authorityLevel || 0;
  }, [userData, user]);

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
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-bold text-primary/60 uppercase tracking-widest">Sincronizando...</p>
        </div>
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
           <Button variant="outline" asChild><Link href="/dashboard">Ir para Painel do Paciente</Link></Button>
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
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={`rounded-full relative ${systemErrors.length > 0 ? 'animate-pulse border-destructive text-destructive' : ''}`}>
                <Bell className="h-5 w-5" />
                {systemErrors.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {systemErrors.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-destructive/20" align="end">
              <div className="bg-destructive/5 p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Monitor de Sistema
                </h3>
                {systemErrors.length > 0 && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setSystemErrors([])}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[300px]">
                {systemErrors.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {systemErrors.map(err => (
                      <div key={err.id} className="p-3 bg-white border rounded-xl space-y-1 shadow-sm">
                        <div className="flex justify-between items-center">
                          <Badge variant="destructive" className="text-[8px] h-4 uppercase">{err.operation}</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{err.timestamp}</span>
                        </div>
                        <p className="text-xs font-bold line-clamp-2">{err.message}</p>
                        <p className="text-[9px] text-muted-foreground font-mono break-all bg-muted/30 p-1 rounded">Path: {err.path}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-accent/50" />
                    <p className="text-xs font-medium text-muted-foreground">Nenhum erro detectado no momento.</p>
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {authorityLevel >= 3 && (
            <Button asChild className="rounded-full bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg">
              <Link href="/booking"><CalendarPlus className="mr-2 h-5 w-5" /> Novo Agendamento</Link>
            </Button>
          )}
          <Button variant="outline" className="rounded-full text-destructive border-destructive font-bold" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
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
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Próximas Consultas</CardTitle>
                <CardDescription>Gerencie o fluxo de pacientes da clínica.</CardDescription>
              </div>
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
              <CardDescription>Defina as permissões de acesso da sua equipe.</CardDescription>
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
                          <Badge variant="outline" className="rounded-full">Nível {u.authorityLevel || 0} - {roleNames[u.authorityLevel || 0]}</Badge>
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
