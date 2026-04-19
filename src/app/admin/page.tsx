
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_APPOINTMENTS, SERVICES, Appointment, TIME_SLOTS } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Plus, Search, ShieldAlert, CheckCircle2, Calendar as CalendarIcon, Clock, Users, DollarSign, UserPlus, UserMinus, Shield } from "lucide-react";
import { generateClinicalSummary } from "@/ai/flows/generate-clinical-summary";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { format, addDays, isSunday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

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
  
  const usersRef = useMemoFirebase(() => {
    if (!user || !db || user.email !== HARDCODED_ADMIN_EMAIL) return null;
    return collection(db, 'users');
  }, [db, user]);

  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<{id: string, name: string} | null>(null);
  const [newNote, setNewNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string>("");

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const isAdmin = user?.email === HARDCODED_ADMIN_EMAIL;
  const isProfessional = userData?.role === 'professional' || isAdmin;

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Sessão encerrada", description: "Até logo!" });
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao sair" });
    }
  };

  const handleToggleProfessional = async (targetUser: any) => {
    if (!db || !isAdmin) return;
    const isProf = targetUser.role === 'professional';
    const newRole = isProf ? 'patient' : 'professional';
    
    try {
      const userRef = doc(db, 'users', targetUser.id);
      await updateDoc(userRef, { role: newRole });

      const roleRef = doc(db, 'app_roles', 'professional', 'users', targetUser.id);
      if (newRole === 'professional') {
        await setDoc(roleRef, { active: true, assignedAt: new Date().toISOString() });
      } else {
        await deleteDoc(roleRef);
      }

      toast({
        title: "Papel Atualizado",
        description: `${targetUser.name} agora é ${newRole === 'professional' ? 'um colaborador' : 'um paciente'}.`
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: "Verifique suas permissões." });
    }
  };

  const handleConfirmAppointment = (id: string) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: 'confirmed' as const } : apt
    ));
    toast({ title: "Agendamento Confirmado" });
  };

  const totalBilling = useMemo(() => {
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
          <Avatar className={`h-12 w-12 border-2 ${isAdmin ? 'border-primary' : 'border-accent'}`}>
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className={`${isAdmin ? 'bg-primary' : 'bg-accent'} text-white font-bold`}>{user.displayName?.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">
              Portal {isAdmin ? 'Administrador' : 'Colaborador'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {isAdmin ? <Shield className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />} {user.email}
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full text-destructive border-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 flex-wrap h-auto">
          <TabsTrigger value="appointments" className="rounded-lg px-6">Agenda</TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-6">Prontuários</TabsTrigger>
          {isAdmin && <TabsTrigger value="management" className="rounded-lg px-6">Equipe & Usuários</TabsTrigger>}
          {isAdmin && <TabsTrigger value="billing" className="rounded-lg px-6">Financeiro</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="appointments">
          <Card className="border-none shadow-xl bg-card">
            <CardHeader><CardTitle>Agenda Hoje</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-bold">{apt.patientName}</TableCell>
                      <TableCell>{SERVICES.find(s => s.id === apt.serviceId)?.name}</TableCell>
                      <TableCell>{apt.time}</TableCell>
                      <TableCell>
                        <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} className="rounded-full">
                          {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {apt.status === 'pending' && (
                            <Button size="sm" variant="ghost" className="text-accent" onClick={() => handleConfirmAppointment(apt.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => {
                            setReschedulingAppointment(apt);
                            setNewDate(new Date(apt.date));
                            setNewTime(apt.time);
                          }}>
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="management">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Todos os Usuários</CardTitle>
                    <CardDescription>Gerencie acessos e defina colaboradores.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {isLoadingUsers ? <Loader2 className="animate-spin" /> : allUsers?.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 border rounded-xl">
                          <div>
                            <p className="font-bold text-sm">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            <Badge variant={u.role === 'professional' ? 'default' : 'outline'} className="mt-1 text-[8px]">
                              {u.role === 'professional' ? 'Colaborador' : 'Paciente'}
                            </Badge>
                          </div>
                          <Button 
                            size="sm" 
                            variant={u.role === 'professional' ? 'destructive' : 'default'} 
                            className="rounded-full h-8"
                            onClick={() => handleToggleProfessional(u)}
                          >
                            {u.role === 'professional' ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Equipe Ativa</CardTitle>
                    <CardDescription>Colaboradores com acesso ao prontuário.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allUsers?.filter(u => u.role === 'professional').map(u => (
                        <div key={u.id} className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/10">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-[10px]">{u.name.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium">{u.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="billing">
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Resumo Financeiro</CardTitle>
                  <CardDescription>Acompanhamento manual dos procedimentos e faturamento.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                      <p className="text-xs uppercase font-bold text-muted-foreground">Total Bruto</p>
                      <p className="text-3xl font-bold text-primary">R$ {totalBilling.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-2xl border">
                      <p className="text-xs uppercase font-bold text-muted-foreground">Procedimentos</p>
                      <p className="text-3xl font-bold">{appointments.length}</p>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt) => {
                        const service = SERVICES.find(s => s.id === apt.serviceId);
                        return (
                          <TableRow key={apt.id}>
                            <TableCell className="text-xs">{apt.date}</TableCell>
                            <TableCell className="font-medium">{apt.patientName}</TableCell>
                            <TableCell className="text-xs">{service?.name}</TableCell>
                            <TableCell className="text-right font-bold">R$ {service?.price.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        <TabsContent value="records">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-none shadow-lg">
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar paciente..." className="pl-9" value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {isAdmin ? (
                  allUsers?.filter(u => u.name.toLowerCase().includes(searchPatient.toLowerCase())).map(u => (
                    <div 
                      key={u.id} 
                      className={`p-3 rounded-lg border cursor-pointer ${selectedPatientRecord?.id === u.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedPatientRecord({ id: u.id, name: u.name })}
                    >
                      <p className="font-bold text-sm">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{u.email}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground p-4 text-center">Para visualizar pacientes, utilize a agenda ou busque pelo nome.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-lg">
              {selectedPatientRecord ? (
                <div className="h-full flex flex-col">
                  <CardHeader className="border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{selectedPatientRecord.name}</CardTitle>
                      <CardDescription>Prontuário Digital</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="rounded-full"><Plus className="mr-2 h-4 w-4" /> Evolução</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Nova Evolução Clínica</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea 
                            placeholder="Notas clínicas..." 
                            className="min-h-[150px]"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          {aiAnalysis && (
                            <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                              <p className="text-xs font-bold mb-2">Análise IA:</p>
                              <p className="text-xs">{aiAnalysis.summary}</p>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={analyzeClinicalNote} disabled={loading === 'ai-analysis'}>IA</Button>
                          <Button onClick={() => {toast({title:"Salvo"}); setNewNote(""); setAiAnalysis(null)}}>Salvar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-sm italic">Nenhuma evolução anterior encontrada para este paciente.</p>
                  </CardContent>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 opacity-20">
                  <ClipboardList className="h-12 w-12" />
                  <p>Selecione um paciente</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reschedulingAppointment} onOpenChange={(open) => !open && setReschedulingAppointment(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Reagendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-wrap justify-center gap-3">
              {availableDates.map((date) => {
                const isSelected = newDate?.toDateString() === date.toDateString();
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-20 w-16 rounded-2xl flex flex-col gap-1 ${isSelected ? 'scale-105 shadow-lg' : ''}`}
                    onClick={() => setNewDate(date)}
                  >
                    <span className="text-[8px] uppercase">{format(date, "EEE", { locale: ptBR })}</span>
                    <span className="text-xl font-bold">{format(date, "dd")}</span>
                  </Button>
                );
              })}
            </div>
            {newDate && (
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <Button key={t} variant={newTime === t ? "default" : "outline"} className="h-10 text-xs" onClick={() => setNewTime(t)}>
                    {t}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button className="rounded-full w-full" disabled={!newDate || !newTime} onClick={() => {
              toast({ title: "Reagendado!" });
              setReschedulingAppointment(null);
            }}>Confirmar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
