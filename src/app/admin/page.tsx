
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, ShieldAlert, Users, CalendarPlus, Bell, Trash2, UserPlus, Search, FileText, Sparkles, UserCheck, Edit2, Save, Lock, Calendar, MailPlus, UserMinus, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, doc, updateDoc, query, orderBy, addDoc, where, getDocs, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateClinicalSummary } from '@/ai/flows/generate-clinical-summary';

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringStaff, setIsRegisteringStaff] = useState(false);
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const calculateAge = (birthDateString: string | undefined) => {
    if (!birthDateString) return null;
    try {
      const [year, month, day] = birthDateString.split('-').map(Number);
      const birthDate = new Date(year, month - 1, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age;
    } catch (e) { return null; }
  };

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  
  const masterEmails = ["luizhenrique8759@gmail.com"];
  const isMaster = useMemo(() => {
    if (!user?.email) return false;
    return masterEmails.includes(user.email.toLowerCase().trim());
  }, [user]);
  
  const authorityLevel = useMemo(() => isMaster ? 4 : (userData?.authorityLevel ?? 0), [userData, isMaster]);
  const isAuthorized = useMemo(() => isMaster || authorityLevel >= 1, [authorityLevel, isMaster]);

  const usersRef = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAuthorized]);
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const patients = useMemo(() => allUsers?.filter(u => u.role === 'patient' && (u.authorityLevel === 0 || !u.authorityLevel)) || [], [allUsers]);
  const staffMembers = useMemo(() => allUsers?.filter(u => u.role !== 'patient' || (u.authorityLevel && u.authorityLevel > 0)) || [], [allUsers]);

  const filteredPatients = useMemo(() => patients.filter(p => 
    p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.email?.toLowerCase().includes(patientSearch.toLowerCase())
  ), [patients, patientSearch]);

  const filteredStaff = useMemo(() => staffMembers.filter(u => 
    u.name?.toLowerCase().includes(staffSearch.toLowerCase()) || u.email?.toLowerCase().includes(staffSearch.toLowerCase())
  ), [staffMembers, staffSearch]);

  const apptsQuery = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'appointments'), orderBy('date', 'desc'));
  }, [db, isAuthorized]);
  const { data: appointments, isLoading: isLoadingAppts } = useCollection(apptsQuery);

  const selectedPatient = useMemo(() => allUsers?.find(p => p.id === selectedPatientId), [allUsers, selectedPatientId]);
  const canSeeRecords = useMemo(() => isMaster || authorityLevel >= 1, [isMaster, authorityLevel]);
  const canEditRecords = useMemo(() => isMaster || authorityLevel >= 4, [isMaster, authorityLevel]);

  const recordsQuery = useMemoFirebase(() => {
    if (!db || !selectedPatientId || !canSeeRecords) return null;
    return query(collection(db, 'medical_records'), where('patientUserId', '==', selectedPatientId), orderBy('createdAt', 'desc'));
  }, [db, selectedPatientId, canSeeRecords]);
  const { data: medicalRecords, isLoading: isLoadingRecords } = useCollection(recordsQuery);

  const handleLogout = async () => {
    if (!auth) return;
    try { await signOut(auth); router.push('/auth'); } catch (error) { toast({ variant: "destructive", title: "Erro ao sair" }); }
  };

  const handleUpdateLevel = async (targetUser: any, levelStr: string) => {
    if (!db || authorityLevel < 3) return;
    const level = parseInt(levelStr);
    const roles: Record<number, string> = { 0: 'patient', 1: 'reception', 2: 'assistant', 3: 'admin', 4: 'dentist' };
    const role = roles[level];
    
    try {
      await updateDoc(doc(db, 'users', targetUser.id), { 
        role,
        authorityLevel: level,
        status: level > 0 ? 'active' : 'pending',
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Acesso Atualizado", description: `${targetUser.name} agora é ${roleNames[level]}.` });
    } catch (error) { toast({ variant: "destructive", title: "Erro ao atualizar nível" }); }
  };

  const handleRemoveAccess = async (targetUser: any) => {
    if (!db || authorityLevel < 3) return;
    if (targetUser.id === user?.uid) {
      toast({ variant: "destructive", title: "Operação impossível", description: "Você não pode remover seu próprio acesso." });
      return;
    }
    if (masterEmails.includes(targetUser.email?.toLowerCase())) {
      toast({ variant: "destructive", title: "Restrição de Segurança", description: "O acesso de um administrador mestre não pode ser removido." });
      return;
    }

    try {
      // Se for apenas um convite pendente (nunca logou), podemos deletar o documento
      if (targetUser.status === 'pending_login') {
        await deleteDoc(doc(db, 'users', targetUser.id));
        toast({ title: "Convite Removido", description: `O convite para ${targetUser.email} foi cancelado.` });
      } else {
        // Se for usuário ativo, apenas revogamos a autoridade para nível 0
        await updateDoc(doc(db, 'users', targetUser.id), {
          role: 'patient',
          authorityLevel: 0,
          updatedAt: new Date().toISOString()
        });
        toast({ title: "Acesso Revogado", description: `${targetUser.name} agora não possui acesso à equipe.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao remover acesso" });
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsRegistering(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const birthDate = formData.get('birthDate') as string;
    const email = (formData.get('email') as string) || "";
    const phone = (formData.get('phone') as string) || "";

    try {
      const patientRef = await addDoc(collection(db, 'users'), {
        name, birthDate, email, phoneNumber: phone,
        role: 'patient', authorityLevel: 0,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      });
      await addDoc(collection(db, 'medical_records'), {
        patientUserId: patientRef.id, professionalId: user?.uid,
        notes: `Ficha clínica iniciada para o paciente ${name}. Data de Nascimento: ${formatDate(birthDate)}.`,
        treatment: "Avaliação inicial pendente.", riskLevel: "Low", createdAt: new Date().toISOString()
      });
      toast({ title: "Paciente Cadastrado" });
      (e.target as HTMLFormElement).reset();
    } catch (error) { toast({ variant: "destructive", title: "Erro ao cadastrar" }); } finally { setIsRegistering(false); }
  };

  const handleRegisterStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || authorityLevel < 3) return;
    setIsRegisteringStaff(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string).toLowerCase().trim();
    const level = parseInt(formData.get('level') as string);
    const roles: Record<number, string> = { 1: 'reception', 2: 'assistant', 3: 'admin', 4: 'dentist' };
    const role = roles[level];

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await updateDoc(doc(db, 'users', querySnapshot.docs[0].id), { role, authorityLevel: level, status: 'active', updatedAt: new Date().toISOString() });
        toast({ title: "Usuário Promovido", description: "O acesso deste e-mail foi liberado." });
      } else {
        await addDoc(collection(db, 'users'), { name, email, role, authorityLevel: level, status: 'pending_login', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        toast({ title: "Colaborador Convidado" });
      }
      (e.target as HTMLFormElement).reset();
    } catch (error) { toast({ variant: "destructive", title: "Erro ao convidar" }); } finally { setIsRegisteringStaff(false); }
  };

  const handleEditPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingPatient) return;
    setIsUpdatingPatient(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateDoc(doc(db, 'users', editingPatient.id), {
        name: formData.get('name'), birthDate: formData.get('birthDate'),
        email: formData.get('email'), phoneNumber: formData.get('phone'),
        updatedAt: new Date().toISOString()
      });
      toast({ title: "Paciente Atualizado" });
      setEditingPatient(null);
    } catch (error) { toast({ variant: "destructive", title: "Erro ao atualizar" }); } finally { setIsUpdatingPatient(false); }
  };

  const handleConfirmAppointment = async (id: string) => {
    if (!db) return;
    try { await updateDoc(doc(db, 'appointments', id), { status: 'confirmed' }); toast({ title: "Confirmado" }); } catch (error) { toast({ variant: "destructive", title: "Erro" }); }
  };

  const handleGenerateAISummary = async () => {
    if (!clinicalNotes || !selectedPatient || !canEditRecords) return;
    setIsGeneratingAI(true);
    try {
      const result = await generateClinicalSummary({ patientName: selectedPatient.name, dentistNotes: clinicalNotes });
      setAiResult(result);
      toast({ title: "IA: Resumo Gerado" });
    } catch (error) { toast({ variant: "destructive", title: "Erro na IA" }); } finally { setIsGeneratingAI(false); }
  };

  const handleSaveMedicalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedPatientId || !clinicalNotes || !canEditRecords) return;
    try {
      await addDoc(collection(db, 'medical_records'), {
        patientUserId: selectedPatientId, professionalId: user?.uid, notes: clinicalNotes,
        treatment: aiResult?.suggestedTreatment || "", aiSummary: aiResult?.summary || "",
        riskLevel: aiResult?.riskLevel || "Low", createdAt: new Date().toISOString()
      });
      toast({ title: "Prontuário Salvo" });
      setClinicalNotes(""); setAiResult(null);
    } catch (error) { toast({ variant: "destructive", title: "Erro ao salvar" }); }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !isAuthorized) return <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4"><ShieldAlert className="h-16 w-16 text-destructive" /><h1 className="text-2xl font-bold">Acesso Restrito</h1><Button onClick={handleLogout}>Sair</Button></div>;

  const roleNames = ["Pendente/Paciente", "Recepção", "Auxiliar", "Administrativo", "Dentista"];

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
          <Button asChild className="rounded-full shadow-lg gap-2"><Link href="/booking"><CalendarPlus className="h-4 w-4" /> Novo Agendamento</Link></Button>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="icon" className={`rounded-full relative ${systemErrors.length > 0 ? 'border-destructive text-destructive' : ''}`}><Bell className="h-5 w-5" />{systemErrors.length > 0 && <span className="absolute -top-1 -right-1 bg-destructive text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center">{systemErrors.length}</span>}</Button></PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl" align="end"><div className="bg-muted/50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-sm">Alertas</h3><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSystemErrors([])}><Trash2 className="h-3 w-3" /></Button></div><ScrollArea className="h-[250px]">{systemErrors.length > 0 ? <div className="p-2 space-y-2">{systemErrors.map(err => <div key={err.id} className="p-2 border rounded-lg bg-white"><p className="text-[10px] font-bold text-destructive uppercase">{err.operation}</p><p className="text-xs font-medium">{err.message}</p></div>)}</div> : <div className="p-12 text-center text-muted-foreground text-xs">Sem alertas.</div>}</ScrollArea></PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full text-destructive border-destructive"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
        </div>
      </header>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 mb-6 h-auto p-1 rounded-xl flex-wrap justify-start">
          <TabsTrigger value="appointments" className="rounded-lg font-bold">Agenda</TabsTrigger>
          <TabsTrigger value="patients" className="rounded-lg font-bold">Pacientes</TabsTrigger>
          {canSeeRecords && <TabsTrigger value="records" className="rounded-lg font-bold">Prontuários</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="management" className="rounded-lg font-bold">Equipe & Acessos</TabsTrigger>}
        </TabsList>

        <TabsContent value="appointments">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Agenda da Clínica</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoadingAppts ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
                <Table><TableHeader><TableRow><TableHead className="pl-6">Paciente</TableHead><TableHead>Serviço</TableHead><TableHead>Data/Hora</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-6">Ações</TableHead></TableRow></TableHeader><TableBody>{appointments?.map((apt) => (
                  <TableRow key={apt.id}><TableCell className="font-bold pl-6">{apt.patientName}</TableCell><TableCell>{apt.serviceName}</TableCell><TableCell className="text-primary font-medium">{apt.date} às {apt.time}</TableCell><TableCell><Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'}>{apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}</Badge></TableCell><TableCell className="text-right pr-6">{apt.status === 'pending' && <Button size="sm" onClick={() => handleConfirmAppointment(apt.id)}>Confirmar</Button>}</TableCell></TableRow>
                ))}{appointments?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Vazio.</TableCell></TableRow>}</TableBody></Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar paciente..." className="pl-10 h-11 rounded-xl" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} /></div>
              <Dialog><DialogTrigger asChild><Button className="rounded-full gap-2 w-full md:w-auto"><UserPlus className="h-4 w-4" /> Novo Paciente</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]"><DialogHeader><DialogTitle>Cadastro de Paciente</DialogTitle></DialogHeader>
                  <form onSubmit={handleRegisterPatient} className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Nome Completo</Label><Input name="name" required className="rounded-xl h-11" /></div>
                    <div className="space-y-2"><Label>E-mail (Opcional)</Label><Input name="email" type="email" className="rounded-xl h-11" /></div>
                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Nascimento</Label><Input name="birthDate" type="date" required className="rounded-xl h-11" /></div><div className="space-y-2"><Label>Telefone</Label><Input name="phone" className="rounded-xl h-11" /></div></div>
                    <Button type="submit" disabled={isRegistering} className="w-full h-12 rounded-xl mt-4">{isRegistering ? <Loader2 className="animate-spin" /> : "Salvar"}</Button>
                  </form>
                </DialogContent></Dialog>
            </div>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden"><CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead className="pl-6">Nome</TableHead><TableHead>Idade</TableHead><TableHead>Nascimento</TableHead><TableHead>Contato</TableHead><TableHead className="text-right pr-6">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{filteredPatients?.map((p) => (
                  <TableRow key={p.id}><TableCell className="font-bold pl-6">{p.name}</TableCell><TableCell>{calculateAge(p.birthDate) ?? '-'}</TableCell><TableCell className="text-xs">{formatDate(p.birthDate)}</TableCell><TableCell className="text-xs">{p.email || p.phoneNumber || '-'}</TableCell><TableCell className="text-right pr-6">
                    <Dialog open={editingPatient?.id === p.id} onOpenChange={(open) => !open && setEditingPatient(null)}>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingPatient(p)}><Edit2 className="h-3 w-3" /></Button></DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-[2rem]"><DialogHeader><DialogTitle>Editar</DialogTitle></DialogHeader>
                        <form onSubmit={handleEditPatient} className="space-y-4 py-4">
                          <Input name="name" defaultValue={p.name} required className="mb-2" /><Input name="email" type="email" defaultValue={p.email} className="mb-2" /><Input name="birthDate" type="date" defaultValue={p.birthDate} required className="mb-2" /><Input name="phone" defaultValue={p.phoneNumber} className="mb-4" />
                          <Button type="submit" disabled={isUpdatingPatient} className="w-full">Salvar</Button>
                        </form>
                      </DialogContent></Dialog>
                  </TableCell></TableRow>
                ))}{filteredPatients?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10">Vazio.</TableCell></TableRow>}</TableBody></Table>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 rounded-3xl border-none shadow-lg h-fit"><CardHeader><CardTitle className="text-lg">Selecionar Paciente</CardTitle></CardHeader><CardContent><ScrollArea className="h-[400px] pr-4"><div className="space-y-2">{filteredPatients?.map((p) => (<Button key={p.id} variant={selectedPatientId === p.id ? "default" : "outline"} className="w-full justify-start text-left h-auto py-3 px-4 rounded-xl" onClick={() => setSelectedPatientId(p.id)}><div className="flex flex-col"><span className="font-bold">{p.name}</span><span className="text-[10px] opacity-70">{calculateAge(p.birthDate) ?? '?'} anos</span></div></Button>))}</div></ScrollArea></CardContent></Card>
            <div className="lg:col-span-2 space-y-6">
              {selectedPatient ? (<><Card className={`rounded-3xl border-none shadow-xl ${canEditRecords ? 'bg-primary/5' : 'bg-muted/30 opacity-80'}`}><CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-2xl font-black text-primary">Evolução Clínica</CardTitle><CardDescription>{selectedPatient.name} ({calculateAge(selectedPatient.birthDate)} anos)</CardDescription></div>{!canEditRecords && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" /> Apenas Leitura</Badge>}</div></CardHeader><CardContent className="space-y-4">
                <Textarea placeholder="Relate o procedimento..." className="min-h-[120px] rounded-2xl bg-white" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} disabled={!canEditRecords} />
                {canEditRecords && <div className="flex gap-2"><Button onClick={handleGenerateAISummary} disabled={!clinicalNotes || isGeneratingAI} className="rounded-full bg-accent text-white">{isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Resumo IA</Button><Button onClick={handleSaveMedicalRecord} disabled={!clinicalNotes} variant="secondary" className="rounded-full px-8">Salvar</Button></div>}
                {aiResult && canEditRecords && <div className="mt-4 p-4 bg-white rounded-2xl border border-accent/20 animate-in fade-in"><p className="text-sm"><strong>Resumo:</strong> {aiResult.summary}</p><p className="text-sm"><strong>Tratamento:</strong> {aiResult.suggestedTreatment}</p></div>}</CardContent></Card>
                <div className="space-y-4"><h3 className="text-lg font-bold">Histórico</h3>{isLoadingRecords ? <Loader2 className="animate-spin" /> : medicalRecords?.map((record) => (<Card key={record.id} className="rounded-2xl border-none shadow-sm"><CardHeader className="py-2 px-6 bg-muted/20 flex justify-between flex-row"><span className="text-xs font-bold text-primary">{new Date(record.createdAt).toLocaleDateString()}</span><Badge variant="outline">{record.riskLevel}</Badge></CardHeader><CardContent className="p-6 text-sm">"{record.notes}"{record.aiSummary && <p className="text-xs mt-2 border-t pt-2 opacity-70">{record.aiSummary}</p>}</CardContent></Card>))}{medicalRecords?.length === 0 && <div className="text-center p-10 border-2 border-dashed rounded-2xl">Vazio.</div>}</div></>) : <div className="h-full flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-[3rem] text-muted-foreground"><FileText className="h-16 w-16 mb-2 opacity-20" />Selecione um paciente.</div>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="management">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar na equipe..." className="pl-10 h-10 rounded-xl" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} /></div>
              <Dialog><DialogTrigger asChild><Button className="rounded-full gap-2"><MailPlus className="h-4 w-4" /> Convidar Colaborador</Button></DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]"><DialogHeader><DialogTitle>Novo Membro</DialogTitle></DialogHeader>
                  <form onSubmit={handleRegisterStaff} className="space-y-4 py-4">
                    <Input name="name" placeholder="Nome" required /><Input name="email" type="email" placeholder="E-mail" required />
                    <Select name="level" defaultValue="1"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">Recepção</SelectItem><SelectItem value="2">Auxiliar</SelectItem><SelectItem value="3">Admin</SelectItem><SelectItem value="4">Dentista</SelectItem></SelectContent></Select>
                    <Button type="submit" disabled={isRegisteringStaff} className="w-full">{isRegisteringStaff ? <Loader2 className="animate-spin" /> : "Convidar"}</Button>
                  </form>
                </DialogContent></Dialog>
            </div>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden"><CardContent className="p-0">
              <Table><TableHeader><TableRow><TableHead className="pl-6">Nome / E-mail</TableHead><TableHead>Cargo Atual</TableHead><TableHead className="text-right pr-6">Ações</TableHead></TableRow></TableHeader>
                <TableBody>{filteredStaff?.map((u) => (
                  <TableRow key={u.id}><TableCell className="pl-6"><div className="font-bold">{u.name}</div><div className="text-[10px] opacity-60">{u.email}</div>{u.status === 'pending_login' && <Badge variant="outline" className="text-[8px] mt-1">Aguardando Login</Badge>}</TableCell><TableCell><Badge variant={u.authorityLevel > 0 ? "default" : "outline"} className="gap-1">{u.authorityLevel > 0 ? <ShieldCheck className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{roleNames[u.authorityLevel || 0]}</Badge></TableCell><TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Select onValueChange={(val) => handleUpdateLevel(u, val)} value={String(u.authorityLevel || 0)} disabled={authorityLevel < 3 || isMaster && masterEmails.includes(u.email?.toLowerCase())}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{roleNames.map((name, i) => <SelectItem key={i} value={String(i)}>{i === 0 ? "⚠️ Pendente" : name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={() => handleRemoveAccess(u)}
                        disabled={authorityLevel < 3 || u.id === user?.uid || masterEmails.includes(u.email?.toLowerCase())}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell></TableRow>
                ))}{filteredStaff.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-10">Nenhum membro ou solicitação pendente.</TableCell></TableRow>}</TableBody></Table>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
