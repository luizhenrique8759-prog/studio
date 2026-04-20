
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, ShieldAlert, Users, CalendarPlus, Bell, Trash2, UserPlus, Search, FileText, Sparkles, UserCheck, Edit2, Save, Lock, Calendar, MailPlus, UserMinus, ShieldCheck, Clock, DollarSign, TrendingUp, CreditCard, Activity, Check, X, CalendarDays, Camera, Image as ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase, useDoc, errorEmitter, FirestorePermissionError } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, doc, updateDoc, query, orderBy, addDoc, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateClinicalSummary } from '@/ai/flows/generate-clinical-summary';
import { SERVICES, TIME_SLOTS } from '@/lib/mock-data';

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [isRegisteringStaff, setIsRegisteringStaff] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Clinical Record States
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [recordPhotos, setRecordPhotos] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  // State for Rescheduling
  const [reschedulingAppt, setReschedulingAppt] = useState<any>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("");

  const masterEmails = ["luizhenrique8759@gmail.com", "luiz88955548@gmail.com"];

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
  const { data: userData, isLoading: isLoadingUserDoc } = useDoc(userDocRef);
  
  const isMaster = useMemo(() => {
    if (!user?.email) return false;
    const userEmail = user.email.toLowerCase().trim();
    return masterEmails.some(email => email.toLowerCase() === userEmail);
  }, [user]);
  
  const authorityLevel = useMemo(() => isMaster ? 4 : (userData?.authorityLevel ?? 0), [userData, isMaster]);
  const isAuthorized = useMemo(() => isMaster || (authorityLevel >= 1), [authorityLevel, isMaster]);

  const usersRef = useMemoFirebase(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAuthorized]);
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection(usersRef);

  const patients = useMemo(() => allUsers?.filter(u => u.role === 'patient' || (!u.role && !u.authorityLevel)) || [], [allUsers]);
  const staffMembers = useMemo(() => allUsers?.filter(u => (u.authorityLevel && u.authorityLevel > 0) || u.role !== 'patient') || [], [allUsers]);

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

  const financialStats = useMemo(() => {
    if (!appointments) return { total: 0, count: 0, pending: 0 };
    return appointments.reduce((acc, appt) => {
      const service = SERVICES.find(s => s.name === appt.serviceName);
      const price = service?.price || 0;
      if (appt.status === 'confirmed') {
        acc.total += price;
        acc.count += 1;
      } else if (appt.status === 'pending') {
        acc.pending += price;
      }
      return acc;
    }, { total: 0, count: 0, pending: 0 });
  }, [appointments]);

  const selectedPatient = useMemo(() => allUsers?.find(p => p.id === selectedPatientId), [allUsers, selectedPatientId]);
  const canSeeRecords = useMemo(() => isMaster || authorityLevel >= 1, [isMaster, authorityLevel]);
  const canEditRecords = useMemo(() => isMaster || authorityLevel >= 4, [isMaster, authorityLevel]);

  const recordsQuery = useMemoFirebase(() => {
    if (!db || !selectedPatientId || !canSeeRecords) return null;
    return query(collection(db, 'medical_records'), where('patientUserId', '==', selectedPatientId), orderBy('attendanceDate', 'desc'));
  }, [db, selectedPatientId, canSeeRecords]);
  const { data: medicalRecords, isLoading: isLoadingRecords } = useCollection(recordsQuery);

  const handleLogout = async () => {
    if (!auth) return;
    try { await signOut(auth); router.push('/auth'); } catch (error) { toast({ variant: "destructive", title: "Erro ao sair" }); }
  };

  const handleUpdateLevel = (targetUser: any, levelStr: string) => {
    if (!db || authorityLevel < 3) return;
    const level = parseInt(levelStr);
    const roles: Record<number, string> = { 0: 'patient', 1: 'reception', 2: 'assistant', 3: 'admin', 4: 'dentist' };
    const role = roles[level];
    
    const userRef = doc(db, 'users', targetUser.id);
    const updateData = { 
      role,
      authorityLevel: level,
      status: level > 0 ? 'active' : 'pending',
      updatedAt: new Date().toISOString()
    };

    updateDoc(userRef, updateData)
      .then(() => toast({ title: "Acesso Atualizado", description: `${targetUser.name} agora é ${roleNames[level]}.` }))
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData
        }));
      });
  };

  const handleRemoveAccess = (targetUser: any) => {
    if (!db || authorityLevel < 3) return;
    if (targetUser.id === user?.uid) {
      toast({ variant: "destructive", title: "Operação impossível", description: "Você não pode remover seu próprio acesso." });
      return;
    }
    const targetEmail = targetUser.email?.toLowerCase().trim();
    if (masterEmails.some(email => email.toLowerCase() === targetEmail) && !isMaster) {
      toast({ variant: "destructive", title: "Restrição de Segurança", description: "Apenas o Master Admin pode remover outros administradores mestres." });
      return;
    }

    const userRef = doc(db, 'users', targetUser.id);
    if (targetUser.status === 'pending_login') {
      deleteDoc(userRef)
        .then(() => toast({ title: "Convite Removido" }))
        .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'delete' })));
    } else {
      const updateData = {
        role: 'patient',
        authorityLevel: 0,
        updatedAt: new Date().toISOString()
      };
      updateDoc(userRef, updateData)
        .then(() => toast({ title: "Acesso Revogado" }))
        .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: updateData })));
    }
  };

  const handleDeletePatient = (patient: any) => {
    if (!db || authorityLevel < 1) return;
    if (!confirm(`Tem certeza que deseja excluir permanentemente o cadastro de ${patient.name}? Esta ação não poderá ser desfeita.`)) return;

    const userRef = doc(db, 'users', patient.id);
    deleteDoc(userRef)
      .then(() => toast({ title: "Cadastro Excluído", description: "O paciente foi removido do sistema." }))
      .catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: userRef.path, 
          operation: 'delete' 
        }));
      });
  };

  const handleUpdateAppointmentStatus = (apptId: string, newStatus: string) => {
    if (!db) return;
    const apptRef = doc(db, 'appointments', apptId);
    updateDoc(apptRef, { status: newStatus, updatedAt: new Date().toISOString() })
      .then(() => toast({ title: "Status Atualizado" }))
      .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: apptRef.path, operation: 'update' })));
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !reschedulingAppt || !newRescheduleDate || !newRescheduleTime) return;
    const apptRef = doc(db, 'appointments', reschedulingAppt.id);
    updateDoc(apptRef, { 
      date: newRescheduleDate, 
      time: newRescheduleTime, 
      status: 'pending',
      updatedAt: new Date().toISOString() 
    })
      .then(() => {
        toast({ title: "Consulta Reagendada" });
        setReschedulingAppt(null);
      })
      .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: apptRef.path, operation: 'update' })));
  };

  const handleRegisterStaff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setIsRegisteringStaff(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string).toLowerCase().trim();
    const level = parseInt(formData.get('level') as string);

    const staffRef = doc(collection(db, 'users'));
    const staffData = {
      name, email, 
      role: level === 1 ? 'reception' : level === 4 ? 'dentist' : 'admin',
      authorityLevel: level,
      status: 'pending_login',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };

    setDoc(staffRef, staffData)
      .then(() => {
        toast({ title: "Colaborador Convidado", description: `Aguardando primeiro login de ${email}.` });
        (e.target as HTMLFormElement).reset();
      })
      .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: staffRef.path, operation: 'create', requestResourceData: staffData })))
      .finally(() => setIsRegisteringStaff(false));
  };

  const handleSaveMedicalRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedPatientId || !clinicalNotes || !canEditRecords) return;
    
    const recordRef = doc(collection(db, 'medical_records'));
    const recordData = {
      patientUserId: selectedPatientId, 
      professionalId: user?.uid, 
      notes: clinicalNotes,
      treatment: aiResult?.suggestedTreatment || "", 
      aiSummary: aiResult?.summary || "",
      riskLevel: aiResult?.riskLevel || "Low", 
      attendanceDate: attendanceDate,
      photos: recordPhotos,
      createdAt: new Date().toISOString()
    };

    setDoc(recordRef, recordData)
      .then(() => {
        toast({ title: "Prontuário Salvo" });
        setClinicalNotes(""); 
        setAiResult(null);
        setRecordPhotos([]);
      })
      .catch((err) => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: recordRef.path, operation: 'create', requestResourceData: recordData })));
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

  const handleAddPhoto = () => {
    if (!photoUrl) return;
    setRecordPhotos(prev => [...prev, photoUrl]);
    setPhotoUrl("");
  };

  const handleRemovePhoto = (index: number) => {
    setRecordPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (isUserLoading || isLoadingUserDoc) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
          {canSeeRecords && <TabsTrigger value="records" className="rounded-lg font-bold">Área Clínica</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="finance" className="rounded-lg font-bold">Financeiro</TabsTrigger>}
          {authorityLevel >= 3 && <TabsTrigger value="management" className="rounded-lg font-bold">Equipe & Acessos</TabsTrigger>}
        </TabsList>

        <TabsContent value="appointments">
           <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-xl flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Agenda da Clínica</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoadingAppts ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
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
                        <TableCell className="text-primary font-medium">{formatDate(apt.date)} às {apt.time}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === 'confirmed' ? 'secondary' : apt.status === 'cancelled' ? 'destructive' : 'outline'}>
                            {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            {apt.status === 'pending' && (
                              <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmed')}>
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {apt.status !== 'cancelled' && (
                              <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="outline" className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/5" onClick={() => {
                              setReschedulingAppt(apt);
                              setNewRescheduleDate(apt.date);
                              setNewRescheduleTime(apt.time);
                            }}>
                              <CalendarDays className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!reschedulingAppt} onOpenChange={() => setReschedulingAppt(null)}>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Reagendar Consulta</DialogTitle>
                <DialogDescription>Selecione a nova data e horário para {reschedulingAppt?.patientName}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleReschedule} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nova Data</Label>
                  <Input type="date" value={newRescheduleDate} onChange={(e) => setNewRescheduleDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Novo Horário</Label>
                  <Select value={newRescheduleTime} onValueChange={setNewRescheduleTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full rounded-xl">Confirmar Reagendamento</Button>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="patients">
          <div className="space-y-6">
            <div className="flex justify-between items-center gap-4">
              <div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filtrar pacientes..." className="pl-10 h-10 rounded-xl" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} /></div>
            </div>
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nome</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold pl-6">{p.name}</TableCell>
                      <TableCell>{calculateAge(p.birthDate) || '-'} anos</TableCell>
                      <TableCell className="text-xs">{p.email || p.phoneNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive border-destructive/20" onClick={() => handleDeletePatient(p)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 rounded-3xl border-none shadow-lg h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Paciente</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar..." 
                    className="pl-7 h-8 text-xs rounded-lg" 
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
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
                          <span className="text-[10px] opacity-70">{calculateAge(p.birthDate) ?? '?'} anos</span>
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
                  <Card className="rounded-3xl border-none shadow-sm bg-primary/5">
                    <CardContent className="p-6 flex flex-wrap gap-4 items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                          {selectedPatient.name[0]}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-primary">{selectedPatient.name}</h2>
                          <div className="flex gap-3 text-xs opacity-70">
                            <span><Calendar className="inline h-3 w-3 mr-1" /> {formatDate(selectedPatient.birthDate)}</span>
                            <span>• {calculateAge(selectedPatient.birthDate)} anos</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="rounded-full">{selectedPatient.email || selectedPatient.phoneNumber || 'Sem contato'}</Badge>
                    </CardContent>
                  </Card>

                  <Card className={`rounded-3xl border-none shadow-xl ${canEditRecords ? 'bg-white' : 'bg-muted/30 opacity-80'}`}>
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
                        <Edit2 className="h-5 w-5" /> Nova Evolução Clínica
                      </CardTitle>
                      {!canEditRecords && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" /> Apenas Leitura</Badge>}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Data do Atendimento</Label>
                          <Input 
                            type="date" 
                            className="rounded-xl h-10" 
                            value={attendanceDate} 
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            disabled={!canEditRecords}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Anexar Foto (URL)</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://..." 
                              className="rounded-xl h-10 flex-1" 
                              value={photoUrl}
                              onChange={(e) => setPhotoUrl(e.target.value)}
                              disabled={!canEditRecords}
                            />
                            <Button 
                              type="button" 
                              size="icon" 
                              className="rounded-xl" 
                              onClick={handleAddPhoto}
                              disabled={!canEditRecords || !photoUrl}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {recordPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-xl">
                          {recordPhotos.map((url, i) => (
                            <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border">
                              <img src={url} alt="Procedure" className="h-full w-full object-cover" />
                              <button 
                                onClick={() => handleRemovePhoto(i)}
                                className="absolute top-0 right-0 bg-destructive text-white p-0.5 rounded-bl-lg"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs">Evolução do Procedimento</Label>
                        <Textarea 
                          placeholder="Relate o procedimento realizado hoje..." 
                          className="min-h-[120px] rounded-2xl bg-white border-2" 
                          value={clinicalNotes} 
                          onChange={(e) => setClinicalNotes(e.target.value)} 
                          disabled={!canEditRecords} 
                        />
                      </div>

                      {canEditRecords && (
                        <div className="flex gap-2 justify-end pt-2">
                          <Button onClick={handleGenerateAISummary} disabled={!clinicalNotes || isGeneratingAI} variant="outline" className="rounded-full gap-2 border-accent text-accent">
                            {isGeneratingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Gerar Resumo IA
                          </Button>
                          <Button onClick={handleSaveMedicalRecord} disabled={!clinicalNotes} className="rounded-full px-8 bg-primary">
                            <Save className="h-4 w-4 mr-2" /> Salvar Prontuário
                          </Button>
                        </div>
                      )}

                      {aiResult && (
                        <div className="mt-4 p-4 bg-accent/5 rounded-2xl border border-accent/20 animate-in fade-in">
                          <h4 className="text-xs font-bold text-accent uppercase mb-2 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Sugestão da IA
                          </h4>
                          <div className="space-y-2">
                            <p className="text-sm"><strong>Resumo:</strong> {aiResult.summary}</p>
                            <p className="text-sm"><strong>Sugestão:</strong> {aiResult.suggestedTreatment}</p>
                            <Badge variant={aiResult.riskLevel === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">Risco: {aiResult.riskLevel}</Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Histórico Clínico
                    </h3>
                    {isLoadingRecords ? (
                      <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                    ) : (
                      <div className="space-y-4">
                        {medicalRecords?.map((record) => (
                          <Card key={record.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                            <div className="bg-muted/20 px-6 py-3 flex justify-between items-center border-b">
                              <div className="flex items-center gap-3">
                                <Badge variant="default" className="rounded-lg h-7 px-3 bg-primary/80">
                                  {formatDate(record.attendanceDate || record.createdAt.split('T')[0])}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Procedimento</span>
                              </div>
                              <Badge variant="outline" className="text-[10px]">{record.riskLevel || 'Low'}</Badge>
                            </div>
                            <CardContent className="p-6">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">"{record.notes}"</p>
                              
                              {record.photos && record.photos.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {record.photos.map((p: string, idx: number) => (
                                    <div key={idx} className="h-24 w-24 rounded-xl overflow-hidden border shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                      <img src={p} alt="Record" className="h-full w-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {record.aiSummary && (
                                <div className="mt-4 p-3 bg-muted/10 rounded-xl border-l-4 border-accent">
                                  <p className="text-[11px] italic text-muted-foreground"><strong>IA:</strong> {record.aiSummary}</p>
                                  {record.treatment && <p className="text-[11px] mt-1 text-accent font-medium">Conduta Sugerida: {record.treatment}</p>}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 text-center border-2 border-dashed rounded-[3rem] text-muted-foreground">
                  <UserCheck className="h-16 w-16 mb-4 opacity-10" />
                  <h3 className="text-xl font-bold opacity-30">Área Clínica</h3>
                  <p className="text-sm opacity-30 max-w-[250px]">Selecione um paciente na lista à esquerda para gerenciar o prontuário.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-3xl border-none shadow-lg bg-primary text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">R$ {financialStats.total.toLocaleString('pt-BR')}</div>
                <p className="text-[10px] opacity-70 mt-1">{financialStats.count} atendimentos confirmados</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Previsão Pendente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-primary">R$ {financialStats.pending.toLocaleString('pt-BR')}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Valor de consultas aguardando confirmação</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Volume de Atendimento</CardTitle>
                <Activity className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{appointments?.length || 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Total de agendamentos registrados</p>
              </CardContent>
            </Card>
          </div>
          <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
            <CardHeader className="border-b bg-muted/5"><CardTitle className="text-lg">Extrato de Serviços</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader><TableRow><TableHead className="pl-6">Data</TableHead><TableHead>Paciente</TableHead><TableHead>Serviço</TableHead><TableHead>Valor</TableHead><TableHead className="text-right pr-6">Status</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {appointments?.slice(0, 10).map((appt) => {
                     const service = SERVICES.find(s => s.name === appt.serviceName);
                     return (
                       <TableRow key={appt.id}>
                         <TableCell className="pl-6 text-xs">{formatDate(appt.date)}</TableCell>
                         <TableCell className="font-bold">{appt.patientName}</TableCell>
                         <TableCell className="text-xs">{appt.serviceName}</TableCell>
                         <TableCell className="font-medium">R$ {service?.price || 0}</TableCell>
                         <TableCell className="text-right pr-6"><Badge variant={appt.status === 'confirmed' ? 'default' : appt.status === 'cancelled' ? 'destructive' : 'outline'}>{appt.status === 'confirmed' ? 'Pago' : appt.status === 'cancelled' ? 'Cancelado' : 'Pendente'}</Badge></TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
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
                      <Select onValueChange={(val) => handleUpdateLevel(u, val)} value={String(u.authorityLevel || 0)} disabled={authorityLevel < 3 || (isMaster && masterEmails.some(email => email.toLowerCase() === u.email?.toLowerCase()) && u.id !== user?.uid)}>
                        <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{roleNames.map((name, i) => <SelectItem key={i} value={String(i)}>{i === 0 ? "⚠️ Pendente" : name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                        onClick={() => handleRemoveAccess(u)}
                        disabled={authorityLevel < 3 || u.id === user?.uid || (masterEmails.some(email => email.toLowerCase() === u.email?.toLowerCase()) && !isMaster)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
