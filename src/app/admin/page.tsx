
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES, TIME_SLOTS } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Plus, Search, ShieldAlert, CheckCircle2, Calendar as CalendarIcon, Clock, Users, DollarSign, Shield, Stethoscope, Activity, UserCog, User } from "lucide-react";
import { generateClinicalSummary } from "@/ai/flows/generate-clinical-summary";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { format, addDays, isSunday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from 'next/link';

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isMasterAdmin = user?.email === HARDCODED_ADMIN_EMAIL;

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUserData } = useDoc(userDocRef);
  
  const authorityLevel = useMemo(() => {
    if (isMasterAdmin) return 3;
    return userData?.authorityLevel || 0;
  }, [isMasterAdmin, userData]);

  const isAuthorized = useMemo(() => {
    if (isUserLoading || isLoadingUserData) return false;
    if (isMasterAdmin) return true;
    return authorityLevel >= 1;
  }, [isMasterAdmin, isLoadingUserData, authorityLevel, isUserLoading]);

  // Consultas baseadas na autoridade carregada
  const usersRef = useMemoFirebase(() => {
    if (!db || !isAuthorized || (authorityLevel < 3 && !isMasterAdmin)) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAuthorized, authorityLevel, isMasterAdmin]);
  
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const apptsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized || (authorityLevel < 1 && !isMasterAdmin)) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'asc'));
  }, [db, isAuthorized, authorityLevel, isMasterAdmin]);
  
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const [loading, setLoading] = useState<string | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<{id: string, name: string} | null>(null);
  const [newNote, setNewNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  const canViewRecords = isMasterAdmin || authorityLevel === 2 || authorityLevel === 3 || authorityLevel === 4;
  const canUseIA = isMasterAdmin || authorityLevel === 4; 
  const canViewManagement = isMasterAdmin || authorityLevel === 3;
  const canViewFinance = isMasterAdmin || authorityLevel === 3;

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

  const handleToggleProfessional = async (targetUser: any, level: string) => {
    if (!db || !isMasterAdmin) return;
    const newLevel = parseInt(level);
    const newRole = newLevel === 0 ? 'patient' : (newLevel === 3 ? 'admin' : 'professional');
    
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { 
        role: newRole,
        authorityLevel: newLevel,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Autoridade Atualizada", description: `${targetUser.name} agora é Nível ${newLevel}.` });
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

  const analyzeClinicalNote = async () => {
    if (!newNote || !selectedPatientRecord) return;
    setLoading('ai-analysis');
    try {
      const result = await generateClinicalSummary({
        patientName: selectedPatientRecord.name,
        dentistNotes: newNote
      });
      setAiAnalysis(result);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA" });
    } finally {
      setLoading(null);
    }
  };

  if (isUserLoading || isLoadingUserData) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Esta área é exclusiva para colaboradores autorizados.</p>
        <Button onClick={handleLogout}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className={`h-14 w-14 border-4 ${isMasterAdmin ? 'border-primary shadow-lg' : 'border-accent'}`}>
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className={`${isMasterAdmin ? 'bg-primary' : 'bg-accent'} text-white font-bold text-xl`}>
              {user.displayName?.substring(0,2).toUpperCase() || 'AD'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
              Portal Administrador
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
               <p className="text-muted-foreground flex items-center gap-2 font-medium text-sm">
                {isMasterAdmin ? <Shield className="h-4 w-4 text-primary" /> : <UserCog className="h-4 w-4" />} {user.email} (Nível {authorityLevel})
              </p>
              <Badge variant="outline" className="rounded-full bg-slate-50 cursor-pointer hover:bg-slate-100" asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Acessar Área do Paciente
                </Link>
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/">Voltar ao Início</Link>
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
        
        <TabsContent value="appointments">
          <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b"><CardTitle>Atendimentos da Clínica</CardTitle></CardHeader>
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
                    {!isLoadingAppts && appointments?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum agendamento ativo.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canViewManagement && (
          <TabsContent value="management">
            <Card className="border-none shadow-2xl rounded-[2rem]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl"><Users className="h-6 w-6 text-primary" /> Gestão de Colaboradores</CardTitle>
                <CardDescription>Defina o nível de acesso para cada profissional.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingUsers ? <Loader2 className="animate-spin text-primary" /> : allUsers?.map(u => (
                    <div key={u.id} className="p-6 border rounded-[2rem] hover:shadow-lg transition-all space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{u.name.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Privilégio</p>
                        <Select 
                          defaultValue={u.authorityLevel?.toString() || "0"} 
                          onValueChange={(val) => handleToggleProfessional(u, val)}
                          disabled={!isMasterAdmin || u.email === HARDCODED_ADMIN_EMAIL}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Nível" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="0">Paciente</SelectItem>
                            <SelectItem value="1">Nível 1 - Recepção (Agenda)</SelectItem>
                            <SelectItem value="2">Nível 2 - Auxiliar (Agenda + Prontuário)</SelectItem>
                            <SelectItem value="3">Nível 3 - Administrativo (Total)</SelectItem>
                            <SelectItem value="4">Nível 4 - Dentista (Agenda + Prontuário + IA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewFinance && (
          <TabsContent value="billing">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-primary text-white border-none shadow-xl rounded-[2rem] p-8">
                <p className="text-xs uppercase font-black opacity-60 mb-2 tracking-widest">Faturamento Estimado</p>
                <p className="text-5xl font-black">R$ {totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </Card>
              <Card className="bg-muted border-none shadow-xl rounded-[2rem] p-8">
                <p className="text-xs uppercase font-black text-muted-foreground mb-2 tracking-widest">Atendimentos Totais</p>
                <p className="text-5xl font-black">{appointments?.length || 0}</p>
              </Card>
              <Card className="bg-accent text-white border-none shadow-xl rounded-[2rem] p-8">
                <p className="text-xs uppercase font-black opacity-60 mb-2 tracking-widest">Novos Pacientes</p>
                <p className="text-5xl font-black">{allUsers?.filter(u => u.role === 'patient').length || 0}</p>
              </Card>
            </div>
          </TabsContent>
        )}

        {canViewRecords && (
          <TabsContent value="records">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-1 border-none shadow-2xl rounded-[2rem] h-[600px] flex flex-col">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Filtrar por nome..." className="pl-12 h-12 rounded-2xl bg-muted/30 border-none" value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 px-4 pb-4">
                  {allUsers?.filter(u => u.name.toLowerCase().includes(searchPatient.toLowerCase())).map(u => (
                    <div 
                      key={u.id} 
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${selectedPatientRecord?.id === u.id ? 'bg-primary/5 border-primary shadow-sm' : 'hover:border-primary/20 hover:bg-muted/5'}`}
                      onClick={() => setSelectedPatientRecord({ id: u.id, name: u.name })}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-xs font-bold">{u.name.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground font-black">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2 border-none shadow-2xl rounded-[2rem] overflow-hidden min-h-[600px]">
                {selectedPatientRecord ? (
                  <div className="h-full flex flex-col">
                    <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-8 px-10">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><ClipboardList className="h-6 w-6" /></div>
                        <div>
                          <CardTitle className="text-3xl font-headline">{selectedPatientRecord.name}</CardTitle>
                          <CardDescription className="font-black uppercase tracking-widest text-[10px] text-primary">Prontuário Digital</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-10 flex flex-col items-center justify-center flex-1">
                      <div className="text-center space-y-4 max-w-sm opacity-30">
                        <Activity className="h-20 w-20 mx-auto text-muted-foreground" />
                        <p className="text-lg font-bold">Histórico clínico em sincronia.</p>
                      </div>
                    </CardContent>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 opacity-20">
                    <Stethoscope className="h-32 w-32 mb-4" />
                    <p className="text-2xl font-black uppercase tracking-widest">Selecione um Paciente</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
