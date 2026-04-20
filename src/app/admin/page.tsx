
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SERVICES } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, ShieldAlert, Users, CalendarPlus, Bell, Trash2, UserPlus, Search, FileText, Sparkles, UserCheck, Edit2, Save, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, doc, updateDoc, query, orderBy, addDoc, where, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateClinicalSummary } from '@/ai/flows/generate-clinical-summary';

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

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
  
  const { data: userData } = useDoc(userDocRef);
  
  const masterEmails = ["luizhenrique8759@gmail.com", "luiz87596531@gmail.com"];
  const isMaster = useMemo(() => {
    if (!user?.email) return false;
    return masterEmails.includes(user.email.toLowerCase().trim());
  }, [user]);
  
  const authorityLevel = useMemo(() => {
    if (isMaster) return 4; // Master Admin tem autoridade máxima
    if (userData?.authorityLevel !== undefined) return userData.authorityLevel;
    return 0;
  }, [userData, isMaster]);

  const isAuthorized = useMemo(() => {
    if (isUserLoading) return false;
    if (isMaster) return true;
    return authorityLevel >= 1;
  }, [isUserLoading, authorityLevel, isMaster]);

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

  const filteredStaff = useMemo(() => {
    return allUsers?.filter(u => 
      (u.name?.toLowerCase().includes(staffSearch.toLowerCase()) || u.email?.toLowerCase().includes(staffSearch.toLowerCase())) &&
      (u.role !== 'patient' || u.authorityLevel > 0)
    ) || [];
  }, [allUsers, staffSearch]);

  const apptsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'desc'));
  }, [db, isAuthorized]);
  
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  // Toda a equipe pode ver os prontuários (Nível 1+)
  const canSeeRecords = useMemo(() => {
    return isMaster || authorityLevel >= 1;
  }, [isMaster, authorityLevel]);

  // Apenas Dentista (Lvl 4) ou Master Admin pode editar prontuários
  const canEditRecords = useMemo(() => {
    return isMaster || authorityLevel >= 4;
  }, [isMaster, authorityLevel]);

  const recordsQuery = useMemoFirebase(() => {
    if (!db || !selectedPatientId || !canSeeRecords) return null;
    return query(
      collection(db, 'medical_records'), 
      where('patientUserId', '==', selectedPatientId), 
      orderBy('createdAt', 'desc')
    );
  }, [db, selectedPatientId, canSeeRecords]);

  const { data: medicalRecords, isLoading: isLoadingRecords } = useCollection(recordsQuery);

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
      toast({ title: "Equipe Atualizada", description: `${targetUser.name} agora é ${roleNames[level]}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar nível" });
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const age = parseInt(formData.get('age') as string);
    const email = (formData.get('email') as string) || "";
    const phone = (formData.get('phone') as string) || "";

    try {
      const patientRef = await addDoc(collection(db, 'users'), {
        name,
        age,
        email,
        phoneNumber: phone,
        role: 'patient',
        authorityLevel: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'medical_records'), {
        patientUserId: patientRef.id,
        professionalId: user?.uid,
        notes: `Ficha clínica iniciada para o paciente ${name}. Idade: ${age} anos.`,
        treatment: "Avaliação inicial pendente.",
        riskLevel: "Low",
        createdAt: new Date().toISOString()
      });

      toast({ title: "Paciente Cadastrado", description: `${name} foi adicionado e o prontuário foi iniciado.` });
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: "Verifique suas permissões." });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEditPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingPatient) return;
    setIsUpdatingPatient(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const age = parseInt(formData.get('age') as string);
    const email = (formData.get('email') as string) || "";
    const phone = (formData.get('phone') as string) || "";

    try {
      const patientRef = doc(db, 'users', editingPatient.id);
      await updateDoc(patientRef, {
        name,
        age,
        email,
        phoneNumber: phone,
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Paciente Atualizado", description: "Os dados foram salvos com sucesso." });
      setEditingPatient(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar" });
    } finally {
      setIsUpdatingPatient(false);
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

  const handleGenerateAISummary = async () => {
    if (!clinicalNotes || !selectedPatient || !canEditRecords) return;
    setIsGeneratingAI(true);
    try {
      const result = await generateClinicalSummary({
        patientName: selectedPatient.name,
        dentistNotes: clinicalNotes
      });
      setAiResult(result);
      toast({ title: "IA: Resumo Gerado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível processar as notas." });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedPatientId || !clinicalNotes || !canEditRecords) return;
    
    try {
      await addDoc(collection(db, 'medical_records'), {
        patientUserId: selectedPatientId,
        professionalId: user?.uid,
        notes: clinicalNotes,
        treatment: aiResult?.suggestedTreatment || "",
        aiSummary: aiResult?.summary || "",
        riskLevel: aiResult?.riskLevel || "Low",
        createdAt: new Date().toISOString()
      });
      toast({ title: "Prontuário Salvo" });
      setClinicalNotes("");
      setAiResult(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao salvar prontuário" });
    }
  };

  if (isUserLoading) {
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
        <p className="text-muted-foreground">Área exclusiva para a equipe Sync Dental.</p>
        <Button onClick={handleLogout}>Sair</Button>
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
                        <p className="text-[9px] text-muted-foreground font-mono mt-1">{err.timestamp}</p>
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
          {canSeeRecords && <TabsTrigger value="records" className="rounded-lg font-bold">Prontuários</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="management" className="rounded-lg font-bold">Equipe</TabsTrigger>}
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
                  placeholder="Buscar paciente por nome ou email..." 
                  className="pl-10 h-11 rounded-xl"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 w-full md:w-auto"><UserPlus className="h-4 w-4" /> Novo Paciente</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle>Cadastro de Paciente</DialogTitle>
                    <DialogDescription>A equipe pode realizar este cadastro.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegisterPatient} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input id="name" name="name" required placeholder="João da Silva" className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (Opcional)</Label>
                      <Input id="email" name="email" type="email" placeholder="paciente@exemplo.com" className="rounded-xl h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Idade</Label>
                        <Input id="age" name="age" type="number" required placeholder="Ex: 30" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" name="phone" placeholder="(11) 99999-9999" className="rounded-xl h-11" />
                      </div>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-bold pl-6">{p.name}</TableCell>
                        <TableCell>{p.age || '-'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.email && <div>{p.email}</div>}
                          {p.phoneNumber && <div>{p.phoneNumber}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell className="text-right pr-6">
                           <Dialog open={editingPatient?.id === p.id} onOpenChange={(open) => !open && setEditingPatient(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setEditingPatient(p)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                              <DialogHeader>
                                <DialogTitle>Editar Paciente</DialogTitle>
                                <DialogDescription>Atualize os dados de {p.name}</DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleEditPatient} className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Nome Completo</Label>
                                  <Input id="edit-name" name="name" defaultValue={p.name} required className="rounded-xl h-11" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">E-mail</Label>
                                  <Input id="edit-email" name="email" type="email" defaultValue={p.email} className="rounded-xl h-11" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-age">Idade</Label>
                                    <Input id="edit-age" name="age" type="number" defaultValue={p.age} required className="rounded-xl h-11" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-phone">Telefone</Label>
                                    <Input id="edit-phone" name="phone" defaultValue={p.phoneNumber} className="rounded-xl h-11" />
                                  </div>
                                </div>
                                <Button type="submit" disabled={isUpdatingPatient} className="w-full h-12 rounded-xl mt-4 gap-2">
                                  {isUpdatingPatient ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                  Salvar Alterações
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPatients?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhum paciente cadastrado.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 rounded-3xl border-none shadow-lg h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Paciente</CardTitle>
                <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} className="pl-8 text-xs h-9 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredPatients?.map((p) => (
                      <Button
                        key={p.id}
                        variant={selectedPatientId === p.id ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-3 px-4 rounded-xl"
                        onClick={() => setSelectedPatientId(p.id)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{p.name}</span>
                          <span className="text-[10px] opacity-70">{p.age} anos</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {selectedPatient ? (
                <>
                  <Card className={`rounded-3xl border-none shadow-xl ${canEditRecords ? 'bg-primary/5' : 'bg-muted/30 opacity-80'}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-black text-primary">Nova Evolução Clínica</CardTitle>
                          <CardDescription>Paciente: {selectedPatient.name} ({selectedPatient.age} anos)</CardDescription>
                        </div>
                        {!canEditRecords && (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <Lock className="h-3 w-3" /> Apenas Leitura
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Notas do Dentista</Label>
                        <Textarea 
                          placeholder={canEditRecords ? "Relate o procedimento..." : "Apenas dentistas podem adicionar evoluções."}
                          className="min-h-[120px] rounded-2xl bg-white"
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          disabled={!canEditRecords}
                        />
                      </div>
                      
                      {canEditRecords && (
                        <div className="flex gap-2">
                          <Button onClick={handleGenerateAISummary} disabled={!clinicalNotes || isGeneratingAI} className="rounded-full bg-accent text-white">
                            {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Resumo IA
                          </Button>
                          <Button onClick={handleSaveMedicalRecord} disabled={!clinicalNotes} variant="secondary" className="rounded-full px-8">Salvar</Button>
                        </div>
                      )}

                      {aiResult && canEditRecords && (
                        <div className="mt-4 p-4 bg-white rounded-2xl border border-accent/20 animate-in fade-in">
                          <h4 className="font-bold text-accent flex items-center gap-2"><Sparkles className="h-4 w-4" /> Sugestão Profissional</h4>
                          <p className="text-sm mt-2"><strong>Resumo:</strong> {aiResult.summary}</p>
                          <p className="text-sm mt-1"><strong>Tratamento:</strong> {aiResult.suggestedTreatment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">Histórico Clínico</h3>
                    {isLoadingRecords ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                      medicalRecords?.map((record) => (
                        <Card key={record.id} className="rounded-2xl border-none shadow-sm">
                          <CardHeader className="py-3 px-6 bg-muted/20 border-b flex flex-row justify-between">
                            <span className="text-xs font-bold text-primary">{new Date(record.createdAt).toLocaleDateString('pt-BR')}</span>
                            <Badge variant="outline" className="text-[10px] uppercase">{record.riskLevel}</Badge>
                          </CardHeader>
                          <CardContent className="p-6">
                            <p className="text-sm italic">"{record.notes}"</p>
                            {record.aiSummary && <p className="text-xs mt-3 pt-3 border-t text-muted-foreground">{record.aiSummary}</p>}
                            {record.treatment && <div className="mt-3 p-2 bg-accent/5 rounded-lg border-l-4 border-accent text-[10px]">{record.treatment}</div>}
                          </CardContent>
                        </Card>
                      ))
                    )}
                    {medicalRecords?.length === 0 && !isLoadingRecords && (
                      <div className="text-center p-10 text-muted-foreground bg-muted/20 rounded-2xl border-2 border-dashed">
                        Nenhum registro clínico encontrado para este paciente.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-[3rem]">
                  <FileText className="h-16 w-16 text-muted-foreground/20" />
                  <p className="text-muted-foreground">Selecione um paciente para visualizar o prontuário.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="management">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-xl">Gestão de Colaboradores</CardTitle>
                <CardDescription>Atribua níveis de autoridade para o time.</CardDescription>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar colaborador..." 
                  className="pl-10 h-10 rounded-xl"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cargo Atual</TableHead>
                    <TableHead className="text-right pr-6">Definir Nível</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold pl-6">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.authorityLevel > 0 ? "default" : "outline"} className="gap-1">
                          {u.authorityLevel > 0 ? <UserCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          {roleNames[u.authorityLevel || 0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <select 
                          className="border rounded-lg p-1 text-xs bg-white h-8" 
                          value={u.authorityLevel || 0} 
                          onChange={(e) => handleUpdateLevel(u, e.target.value)}
                          disabled={authorityLevel < 3 || masterEmails.includes(u.email?.toLowerCase())}
                        >
                          {roleNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaff.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Nenhum colaborador encontrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
