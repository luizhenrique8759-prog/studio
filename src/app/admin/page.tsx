
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES, Appointment, TIME_SLOTS } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Plus, Search, ShieldAlert, CheckCircle2, Calendar as CalendarIcon, Clock, Users, DollarSign, Shield, Stethoscope, Activity } from "lucide-react";
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

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Dados do usuário atual
  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userData, isLoading: isLoadingUserData } = useDoc(userDocRef);
  
  // Listagem de todos os usuários
  const usersRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return collection(db, 'users');
  }, [db, user]);
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  // Listagem de agendamentos em tempo real
  const apptsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'asc'), orderBy('time', 'asc'));
  }, [db, user]);
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const [loading, setLoading] = useState<string | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<{id: string, name: string} | null>(null);
  const [newNote, setNewNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const [reschedulingAppointment, setReschedulingAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>("");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const isAdmin = user?.email === HARDCODED_ADMIN_EMAIL;
  const authorityLevel = userData?.authorityLevel || 0;
  const isProfessional = userData?.role === 'professional' || isAdmin;

  const canViewRecords = isAdmin || authorityLevel >= 2;
  const canViewManagement = isAdmin || authorityLevel >= 3;
  const canViewFinance = isAdmin || authorityLevel >= 3;
  const canEditRoles = isAdmin;

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
    if (!db || !isAdmin) return;
    const newRole = level === "0" ? 'patient' : 'professional';
    const newLevel = parseInt(level);
    
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { 
        role: newRole,
        authorityLevel: newLevel
      });

      const roleRef = doc(db, 'app_roles', 'professional', 'users', targetUser.id);
      if (newRole === 'professional') {
        await setDoc(roleRef, { active: true, assignedAt: new Date().toISOString() });
      } else {
        await deleteDoc(roleRef);
      }

      toast({ title: "Autoridade Atualizada", description: `${targetUser.name} agora possui Nível ${newLevel}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar" });
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

  const availableDates = useMemo(() => {
    const dates = [];
    let current = startOfDay(new Date());
    while (dates.length < 12) {
      if (!isSunday(current)) dates.push(new Date(current));
      current = addDays(current, 1);
    }
    return dates;
  }, []);

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

  if (isUserLoading || isLoadingUserData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  if (!isProfessional) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive animate-bounce" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground max-w-md">Esta área é exclusiva para profissionais autorizados.</p>
        <Button onClick={handleLogout}>Sair</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className={`h-14 w-14 border-4 ${isAdmin ? 'border-primary shadow-primary/20' : 'border-accent shadow-accent/20'}`}>
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className={`${isAdmin ? 'bg-primary' : 'bg-accent'} text-white font-bold text-xl`}>{user.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
              {isAdmin ? 'Portal Administrador' : `Portal do Colaborador (Lvl ${authorityLevel})`}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 font-medium">
              {isAdmin ? <Shield className="h-4 w-4 text-primary fill-primary/20" /> : <Stethoscope className="h-4 w-4" />} {user.email}
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full text-destructive border-destructive hover:bg-destructive/10 px-8" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl mb-8 flex-wrap h-auto border">
          <TabsTrigger value="appointments" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Agenda</TabsTrigger>
          {canViewRecords && <TabsTrigger value="records" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">Prontuários</TabsTrigger>}
          {canViewManagement && <TabsTrigger value="management" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Equipe & Usuários</TabsTrigger>}
          {canViewFinance && <TabsTrigger value="billing" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-white">Financeiro</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="appointments">
          <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/20 border-b"><CardTitle>Próximos Atendimentos</CardTitle></CardHeader>
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
                        <TableCell>{apt.serviceName || SERVICES.find(s => s.id === apt.serviceId)?.name}</TableCell>
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
                            <Button size="sm" variant="ghost" className="rounded-full hover:bg-primary/10" onClick={() => {
                              setReschedulingAppointment(apt);
                              setNewDate(new Date(apt.date));
                              setNewTime(apt.time);
                            }}>
                              <CalendarIcon className="h-5 w-5 text-primary" /> <span className="ml-2 hidden sm:inline text-primary">Reagendar</span>
                            </Button>
                          </div>
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

        {canViewManagement && (
          <TabsContent value="management">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl"><Users className="h-6 w-6 text-primary" /> Gestão de Usuários</CardTitle>
                  <CardDescription>Defina autoridade e controle acessos.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoadingUsers ? <Loader2 className="animate-spin" /> : allUsers?.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 border rounded-[1.5rem] hover:bg-muted/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{u.name.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={u.role === 'professional' ? 'default' : 'outline'} className="text-[8px] h-4">
                                {u.role === 'professional' ? `LVL ${u.authorityLevel}` : 'PACIENTE'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {canEditRoles && (
                          <Select defaultValue={u.authorityLevel?.toString() || "0"} onValueChange={(val) => handleToggleProfessional(u, val)}>
                            <SelectTrigger className="w-[140px] rounded-full text-xs">
                              <SelectValue placeholder="Nível" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="0">Paciente</SelectItem>
                              <SelectItem value="1">Lvl 1 - Recepção</SelectItem>
                              <SelectItem value="2">Lvl 2 - Clínico</SelectItem>
                              <SelectItem value="3">Lvl 3 - Adm</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl rounded-[2rem] bg-primary text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl"><ShieldAlert className="h-6 w-6" /> Equipe por Nível</CardTitle>
                  <CardDescription className="text-white/70">Visualização das permissões ativas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map(lvl => (
                      <div key={lvl} className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 ml-2">
                          {lvl === 1 ? 'RECEPÇÃO' : lvl === 2 ? 'CLÍNICO' : 'ADMINISTRATIVO'}
                        </p>
                        {allUsers?.filter(u => u.role === 'professional' && u.authorityLevel === lvl).map(u => (
                          <div key={u.id} className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                            <Avatar className="h-10 w-10 border-2 border-white">
                              <AvatarFallback className="bg-white text-primary font-bold">{u.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold">{u.name}</p>
                              <p className="text-xs opacity-70">Acesso Nível {lvl} Ativo</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {canViewFinance && (
          <TabsContent value="billing">
            <Card className="border-none shadow-2xl overflow-hidden rounded-[2rem]">
              <CardHeader className="bg-primary/5 border-b pb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl"><DollarSign className="h-7 w-7 text-primary" /> Painel Financeiro</CardTitle>
                    <CardDescription>Gestão de faturamento e métricas administrativas.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-8 bg-primary/10 rounded-[2rem] border-2 border-primary/20 flex flex-col items-center text-center">
                    <p className="text-xs uppercase font-black text-primary/60 tracking-widest mb-2">Faturamento Bruto</p>
                    <p className="text-5xl font-black text-primary">R$ {totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-8 bg-muted rounded-[2rem] border flex flex-col items-center text-center">
                    <p className="text-xs uppercase font-black text-muted-foreground tracking-widest mb-2">Volume de Pacientes</p>
                    <p className="text-5xl font-black">{appointments?.length || 0}</p>
                  </div>
                  <div className="p-8 bg-accent/10 rounded-[2rem] border-2 border-accent/20 flex flex-col items-center text-center">
                    <p className="text-xs uppercase font-black text-accent/60 tracking-widest mb-2">Insumos & Gastos</p>
                    <div className="flex items-center gap-2">
                       <p className="text-5xl font-black text-accent">R$ 0,00</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-[1.5rem] border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="pl-6">Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-right pr-6">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments?.map((apt) => {
                        const service = SERVICES.find(s => s.id === apt.serviceId);
                        return (
                          <TableRow key={apt.id}>
                            <TableCell className="text-xs pl-6">{format(new Date(apt.date), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="font-bold">{apt.patientName}</TableCell>
                            <TableCell className="text-xs italic">{apt.serviceName || service?.name}</TableCell>
                            <TableCell className="text-right font-bold pr-6 text-primary">R$ {service?.price.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewRecords && (
          <TabsContent value="records">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="md:col-span-1 border-none shadow-2xl rounded-[2rem] h-[600px] flex flex-col">
                <CardHeader className="pb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Localizar paciente..." className="pl-12 h-12 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/50" value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 px-4 pb-4">
                  {allUsers?.filter(u => u.name.toLowerCase().includes(searchPatient.toLowerCase())).map(u => (
                    <div 
                      key={u.id} 
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${selectedPatientRecord?.id === u.id ? 'bg-primary/5 border-primary shadow-inner scale-[0.98]' : 'hover:border-primary/30 hover:bg-muted/5'}`}
                      onClick={() => setSelectedPatientRecord({ id: u.id, name: u.name })}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-xs font-bold">{u.name.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2 border-none shadow-2xl rounded-[2rem] overflow-hidden">
                {selectedPatientRecord ? (
                  <div className="h-full flex flex-col">
                    <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-8 px-10">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><ClipboardList className="h-6 w-6" /></div>
                        <div>
                          <CardTitle className="text-3xl font-headline">{selectedPatientRecord.name}</CardTitle>
                          <CardDescription className="font-black uppercase tracking-widest text-[10px] text-primary">Evolução Clínica e Ficha do Paciente</CardDescription>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="rounded-full h-12 px-8 bg-primary hover:scale-105 transition-transform"><Plus className="mr-2 h-5 w-5" /> Nova Evolução</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] rounded-[2rem]">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">Nova Evolução Clínica</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6 py-6">
                            <Textarea 
                              placeholder="Descreva aqui as notas clínicas, procedimentos realizados e observações..." 
                              className="min-h-[250px] rounded-2xl p-6 text-lg border-muted bg-muted/10"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                            />
                            {aiAnalysis && (
                              <div className="p-6 bg-accent/5 rounded-3xl border-2 border-accent/20 animate-in slide-in-from-bottom-4">
                                <p className="text-xs font-black mb-4 uppercase text-accent tracking-widest flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Análise IA Concluída:</p>
                                <div className="space-y-4">
                                  <p className="text-sm leading-relaxed">{aiAnalysis.summary}</p>
                                  <div className="p-4 bg-white/50 rounded-xl">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Tratamento Sugerido:</p>
                                    <p className="text-xs italic">{aiAnalysis.suggestedTreatment}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <DialogFooter className="gap-2">
                            <Button variant="outline" className="rounded-full h-12" onClick={analyzeClinicalNote} disabled={loading === 'ai-analysis'}>
                              {loading === 'ai-analysis' ? <Loader2 className="animate-spin mr-2" /> : "Assistente IA"}
                            </Button>
                            <Button className="rounded-full h-12 px-10" onClick={() => {toast({title:"Salvo!"}); setNewNote(""); setAiAnalysis(null)}}>Finalizar Evolução</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <CardContent className="p-10 flex flex-col items-center justify-center flex-1">
                      <div className="text-center space-y-4 max-w-sm">
                        <div className="mx-auto h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground"><Activity className="h-10 w-10" /></div>
                        <p className="text-muted-foreground text-lg">Histórico clínico e ficha completa carregados.</p>
                      </div>
                    </CardContent>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 opacity-10">
                    <Stethoscope className="h-32 w-32 mb-4" />
                    <p className="text-2xl font-black uppercase tracking-[0.2em]">Selecione um Paciente</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="sm:max-w-xl rounded-[3rem] p-10">
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-3xl font-headline">Reagendar Consulta</DialogTitle>
            <DialogDescription className="font-bold text-primary">Paciente: {reschedulingAppointment?.patientName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <div className="flex flex-wrap justify-center gap-4">
              {availableDates.map((date) => {
                const isSelected = newDate?.toDateString() === date.toDateString();
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-24 w-20 rounded-[2rem] flex flex-col gap-1 transition-all ${isSelected ? 'scale-110 shadow-xl ring-4 ring-primary/20' : 'hover:bg-primary/5'}`}
                    onClick={() => {
                      setNewDate(date);
                      setNewTime("");
                    }}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-50">{format(date, "EEE", { locale: ptBR })}</span>
                    <span className="text-2xl font-black">{format(date, "dd")}</span>
                    <span className="text-[10px] font-medium uppercase opacity-50">{format(date, "MMM", { locale: ptBR })}</span>
                  </Button>
                );
              })}
            </div>
            {newDate && (
              <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
                {TIME_SLOTS.map(t => (
                  <Button key={t} variant={newTime === t ? "default" : "outline"} className={`h-12 rounded-xl text-xs font-bold ${newTime === t ? 'shadow-lg scale-105' : ''}`} onClick={() => setNewTime(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="rounded-full w-full h-14 text-lg font-bold shadow-xl" disabled={!newDate || !newTime} onClick={async () => {
              if (db && reschedulingAppointment && newDate && newTime) {
                await updateDoc(doc(db, 'appointments', reschedulingAppointment.id), {
                  date: format(newDate, 'yyyy-MM-dd'),
                  time: newTime,
                  status: 'pending'
                });
                toast({ title: "Agenda Atualizada!", description: "O paciente será notificado da mudança." });
                setReschedulingAppointment(null);
              }
            }}>Confirmar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
