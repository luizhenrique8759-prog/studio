"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_APPOINTMENTS, SERVICES, PROFESSIONALS, Appointment } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, DollarSign, FileText, Bell, CheckCircle2, Clock, Stethoscope, MessageSquare, Sparkles, LogOut, Loader2, ClipboardList, Plus, Search, ShieldAlert } from "lucide-react";
import { generateBillingSummary } from "@/ai/flows/generate-billing-summary";
import { generateAppointmentNotification } from "@/ai/flows/generate-appointment-notification";
import { generateClinicalSummary } from "@/ai/flows/generate-clinical-summary";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// E-mail do Administrador "Blindado"
const HARDCODED_ADMIN_EMAIL = "SEU_EMAIL_AQUI@gmail.com";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchPatient, setSearchPatient] = useState("");
  const [selectedPatientRecord, setSelectedPatientRecord] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  const isAdmin = user?.email === HARDCODED_ADMIN_EMAIL;

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

  const confirmAppointment = async (apt: Appointment) => {
    setLoading(apt.id);
    try {
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'confirmed' } : a));
      const prof = PROFESSIONALS.find(p => p.id === apt.professionalId);
      const service = SERVICES.find(s => s.id === apt.serviceId);

      await generateAppointmentNotification({
        patientName: apt.patientName,
        appointmentDate: apt.date,
        appointmentTime: apt.time,
        service: service?.name || 'Consulta',
        dentistName: prof?.name || 'Dentista',
        clinicName: 'Clínica Dental Sync',
        clinicPhone: '(11) 9999-9999',
        clinicAddress: 'Av. Paulista, 1000, São Paulo',
        messageType: 'confirmation'
      });

      toast({ title: "Agendamento Confirmado", description: "Notificação enviada via IA." });
    } catch (error) {
       toast({ title: "Erro", description: "Falha ao confirmar", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const analyzeClinicalNote = async () => {
    if (!newNote) return;
    setLoading('ai-analysis');
    try {
      const result = await generateClinicalSummary({
        patientName: selectedPatientRecord.name,
        dentistNotes: newNote
      });
      setAiAnalysis(result);
      toast({ title: "Análise IA Concluída", description: "Resumo clínico gerado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível analisar as notas." });
    } finally {
      setLoading(null);
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  // Se não for admin blindado, mostra aviso (embora as regras de segurança já bloqueiem o acesso aos dados)
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive animate-bounce" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground max-w-md">
          Esta área é exclusiva para administradores. Se você é um administrador, certifique-se de estar usando o e-mail configurado.
        </p>
        <Button onClick={handleLogout}>Sair e tentar outro e-mail</Button>
      </div>
    );
  }

  const adminInitials = user.displayName?.substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-white font-bold">{adminInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Portal Clínico</h1>
            <p className="text-muted-foreground">Admin: {user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-full text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pacientes Totais</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">1.240</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Prontuários Ativos</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">850</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Análises IA (Hoje)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">14</div></CardContent>
        </Card>
        <Card className="bg-card/50 border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Consultas Hoje</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">12</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 inline-flex border shadow-sm">
          <TabsTrigger value="appointments" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold">Agendamentos</TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold">Prontuários IA</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white font-bold">Faturamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="font-headline text-2xl text-primary">Agenda de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
                        <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'}>
                          {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {apt.status === 'pending' && (
                          <Button size="sm" onClick={() => confirmAppointment(apt)} disabled={loading === apt.id}>
                            Confirmar
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setSelectedPatientRecord({ id: apt.patientId, name: apt.patientName })}>
                          Ver Prontuário
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Buscar Paciente</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Nome do paciente..." 
                    className="pl-9 rounded-xl"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.filter(a => a.patientName.toLowerCase().includes(searchPatient.toLowerCase())).map(p => (
                  <div 
                    key={p.patientId} 
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedPatientRecord?.id === p.patientId ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => setSelectedPatientRecord({ id: p.patientId, name: p.patientName })}
                  >
                    <p className="font-bold">{p.patientName}</p>
                    <p className="text-xs text-muted-foreground">Última consulta: {p.date}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-lg min-h-[500px]">
              {selectedPatientRecord ? (
                <div className="h-full flex flex-col">
                  <CardHeader className="border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-primary">{selectedPatientRecord.name}</CardTitle>
                      <CardDescription>Histórico clínico e evoluções</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="rounded-full bg-accent hover:bg-accent/90">
                          <Plus className="mr-2 h-4 w-4" /> Nova Evolução
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] rounded-3xl">
                        <DialogHeader>
                          <DialogTitle>Adicionar Nota Clínica</DialogTitle>
                          <DialogDescription>Descreva o procedimento e observações do paciente.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea 
                            placeholder="Ex: Paciente relata sensibilidade no dente 24. Realizada restauração classe II..." 
                            className="min-h-[150px] rounded-2xl"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          {aiAnalysis && (
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 animate-in fade-in zoom-in-95">
                              <div className="flex items-center gap-2 text-primary font-bold">
                                <Sparkles className="h-4 w-4" /> Análise IA
                                <Badge variant="outline" className="ml-auto">{aiAnalysis.riskLevel} Risco</Badge>
                              </div>
                              <p className="text-sm"><strong>Resumo:</strong> {aiAnalysis.summary}</p>
                              <p className="text-sm"><strong>Sugestão:</strong> {aiAnalysis.suggestedTreatment}</p>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" onClick={analyzeClinicalNote} disabled={loading === 'ai-analysis' || !newNote}>
                            {loading === 'ai-analysis' ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Analisar com IA
                          </Button>
                          <Button onClick={() => {
                            toast({ title: "Salvo", description: "Prontuário atualizado com sucesso." });
                            setNewNote("");
                            setAiAnalysis(null);
                          }}>Salvar Prontuário</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="pt-6 flex-1">
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-1 bg-accent rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-muted-foreground font-bold">HOJE, 14:30</p>
                          <p className="font-bold">Avaliação de Rotina</p>
                          <p className="text-sm text-muted-foreground italic">Aguardando preenchimento da evolução clínica...</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1 bg-muted rounded-full"></div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs text-muted-foreground font-bold">15 DE MAIO, 2024</p>
                          <p className="font-bold">Limpeza e Profilaxia</p>
                          <p className="text-sm text-muted-foreground">Paciente apresenta boa higiene bucal, mas com leve acúmulo de placa nos molares inferiores.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                  <ClipboardList className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-xl font-bold">Selecione um paciente</p>
                  <p className="text-sm">Clique em um paciente na lista ao lado para gerenciar seu prontuário clínico.</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing">
           <Card className="border-none shadow-xl bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="border-b">
              <CardTitle className="font-headline flex items-center gap-2 text-2xl text-primary font-bold">
                <Sparkles className="text-accent animate-pulse" /> Faturamento IA
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
               <div className="bg-white/80 p-6 rounded-3xl border shadow-sm backdrop-blur-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                    <MessageSquare className="w-5 h-5" /> Automação Financeira Ativa
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Olá administrador <strong>{user.email}</strong>, o sistema está configurado para gerar relatórios financeiros automáticos baseados nos procedimentos registrados.
                  </p>
                  <Button variant="outline" className="mt-4 rounded-full border-primary text-primary hover:bg-primary/5 font-bold">
                    Gerar Relatório Consolidado
                  </Button>
               </div>
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}