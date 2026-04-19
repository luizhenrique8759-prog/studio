
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, ShieldAlert, CheckCircle2, Users, TrendingUp, DollarSign, CalendarPlus, Bell, AlertTriangle, Trash2, UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, doc, updateDoc, query, orderBy, addDoc, where } from 'firebase/firestore';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  useEffect(() => {
    const handleError = (error: any) => {
      setSystemErrors(prev => [{
        id: Date.now(),
        message: error.message || "Erro de Permissão",
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
  
  const authorityLevel = userData?.authorityLevel || 0;

  const isAuthorized = useMemo(() => {
    if (isUserLoading || isLoadingUserData) return false;
    return authorityLevel >= 1;
  }, [isUserLoading, isLoadingUserData, authorityLevel]);

  const usersRef = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAuthorized]);
  
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const patients = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => u.role === 'patient');
  }, [allUsers]);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => 
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.email?.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [patients, patientSearch]);

  const apptsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'desc'));
  }, [db, isAuthorized]);
  
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/auth');
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

  const handleRegisterPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const age = parseInt(formData.get('age') as string);
    const email = (formData.get('email') as string) || null;

    try {
      // Criamos apenas o documento do usuário. Se o e-mail for usado para login, 
      // o AuthPage sincronizará os dados existentes.
      await addDoc(collection(db, 'users'), {
        name,
        age,
        email,
        role: 'patient',
        authorityLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Paciente Cadastrado", description: `${name} foi adicionado ao sistema.` });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: "Verifique suas permissões de administrador." });
    } finally {
      setIsRegistering(false);
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
        <p className="text-muted-foreground">Área exclusiva para colaboradores Sync Dental.</p>
        <div className="flex gap-2">
           <Button onClick={handleLogout}>Sair do Sistema</Button>
        </div>
      </div>
    );
  }

  const roleNames = ["Paciente", "Recepção", "Auxiliar", "Administrativo", "Dentista"];

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback>{user.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-headline font-black text-primary">Portal Sync</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20">{roleNames[authorityLevel]}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-full shadow-lg gap-2">
            <Link href="/booking"><CalendarPlus className="h-4 w-4" /> Novo Agendamento</Link>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={`rounded-full relative ${systemErrors.length > 0 ? 'border-destructive text-destructive' : ''}`}>
                <Bell className="h-5 w-5" />
                {systemErrors.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center">{systemErrors.length}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl" align="end">
              <div className="bg-muted/50 p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-sm">Alertas de Sistema</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSystemErrors([])}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <ScrollArea className="h-[250px]">
                {systemErrors.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {systemErrors.map(err => (
                      <div key={err.id} className="p-2 border rounded-lg bg-white">
                        <p className="text-[10px] font-bold text-destructive uppercase">{err.operation}</p>
                        <p className="text-xs font-medium">{err.message}</p>
                        <p className="text-[9px] text-muted-foreground font-mono mt-1">Path: {err.path}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground text-xs">Nenhum erro detectado.</div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full text-destructive border-destructive"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>
      </header>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 mb-6 h-auto p-1 rounded-xl flex-wrap justify-start">
          <TabsTrigger value="appointments" className="rounded-lg font-bold">Agenda</TabsTrigger>
          <TabsTrigger value="patients" className="rounded-lg font-bold">Pacientes</TabsTrigger>
          {authorityLevel >= 2 && <TabsTrigger value="records" className="rounded-lg font-bold">Prontuários</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="management" className="rounded-lg font-bold">Equipe</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="finance" className="rounded-lg font-bold">Financeiro</TabsTrigger>}
        </TabsList>

        <TabsContent value="appointments">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b">
              <CardTitle className="text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Agenda da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingAppts ? (
                <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Paciente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments?.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-bold pl-6">{apt.patientName}</TableCell>
                        <TableCell>{apt.serviceName}</TableCell>
                        <TableCell className="text-primary font-medium">{apt.date} às {apt.time}</TableCell>
                        <TableCell><Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'}>{apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          {apt.status === 'pending' && <Button size="sm" onClick={() => handleConfirmAppointment(apt.id)}>Confirmar</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {appointments?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum agendamento encontrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar paciente..." 
                  className="pl-10 h-11 rounded-xl"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 w-full md:w-auto"><UserPlus className="h-4 w-4" /> Cadastrar Novo Paciente</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle>Cadastro de Paciente</DialogTitle>
                    <DialogDescription>As informações do paciente serão usadas para agendamentos e prontuários.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterPatient} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" name="name" required placeholder="João da Silva" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (Opcional)</Label>
                      <Input id="email" name="email" type="email" placeholder="exemplo@gmail.com" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Idade</Label>
                      <Input id="age" name="age" type="number" required placeholder="Ex: 25" className="rounded-xl h-11" />
                    </div>
                    <Button type="submit" disabled={isRegistering} className="w-full h-12 rounded-xl mt-4">
                      {isRegistering ? <Loader2 className="animate-spin" /> : "Salvar Paciente"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead className="pl-6">Nome</TableHead><TableHead>Idade</TableHead><TableHead>E-mail</TableHead><TableHead className="text-right pr-6">Cadastro</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredPatients?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold pl-6">{p.name}</TableCell>
                        <TableCell>{p.age || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{p.email || 'Não informado'}</TableCell>
                        <TableCell className="text-right pr-6 text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPatients?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhum paciente encontrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b">
              <CardTitle className="text-xl">Gestão de Equipe e Permissões</CardTitle>
              <CardDescription>Apenas administradores podem alterar níveis de autoridade.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="pl-6">Usuário</TableHead><TableHead>E-mail</TableHead><TableHead>Cargo Atual</TableHead><TableHead className="text-right pr-6">Alterar Nível</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allUsers?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold pl-6">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.authorityLevel > 0 ? "secondary" : "outline"}>
                          {roleNames[u.authorityLevel || 0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <select 
                          className="border rounded-lg p-1 text-xs bg-white h-8" 
                          value={u.authorityLevel || 0} 
                          onChange={(e) => handleUpdateLevel(u, e.target.value)}
                          disabled={authorityLevel < 3 || u.email === "luizhenrique8759@gmail.com"}
                        >
                          {roleNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="rounded-3xl bg-primary text-white border-none shadow-lg">
              <CardHeader><CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Faturamento Total</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-black">R$ {appointments?.reduce((acc, a) => acc + (SERVICES.find(s => s.id === a.serviceId)?.price || 0), 0).toLocaleString('pt-BR')}</p></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
