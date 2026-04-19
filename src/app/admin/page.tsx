"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_APPOINTMENTS, SERVICES, Appointment } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut, Loader2, ClipboardList, Plus, Search, ShieldAlert, Sparkles } from "lucide-react";
import { generateClinicalSummary } from "@/ai/flows/generate-clinical-summary";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const HARDCODED_ADMIN_EMAIL = "luizhenrique8759@gmail.com";

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  
  const [appointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
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

  const isAdmin = user?.email === HARDCODED_ADMIN_EMAIL;

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

  const analyzeClinicalNote = async () => {
    if (!newNote || !selectedPatientRecord) return;
    setLoading('ai-analysis');
    try {
      const result = await generateClinicalSummary({
        patientName: selectedPatientRecord.name,
        dentistNotes: newNote
      });
      setAiAnalysis(result);
      toast({ title: "Análise IA Concluída", description: "Resumo clínico gerado para suporte." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível analisar as notas." });
    } finally {
      setLoading(null);
    }
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive animate-bounce" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground max-w-md">
          Esta área é exclusiva para o administrador {HARDCODED_ADMIN_EMAIL}.
        </p>
        <Button onClick={handleLogout}>Sair e tentar outro e-mail</Button>
      </div>
    );
  }

  const adminInitials = user.displayName?.substring(0, 2).toUpperCase() || 'AD';

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="bg-primary text-white font-bold">{adminInitials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Portal Clínico</h1>
            <p className="text-muted-foreground">Logado como: {user.email}</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full text-destructive border-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Sair do Sistema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pacientes</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">1.240</div></CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Prontuários</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">850</div></CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Faturamento</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">R$ 45k</div></CardContent>
        </Card>
        <Card className="bg-card border-none shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Consultas Hoje</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">12</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6">
          <TabsTrigger value="appointments" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Agenda</TabsTrigger>
          <TabsTrigger value="records" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Prontuários</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments">
          <Card className="border-none shadow-xl bg-card overflow-hidden">
            <CardHeader className="border-b">
              <CardTitle className="font-headline text-2xl text-primary">Próximos Atendimentos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-bold">{apt.patientName}</TableCell>
                      <TableCell>{SERVICES.find(s => s.id === apt.serviceId)?.name}</TableCell>
                      <TableCell>{apt.date}</TableCell>
                      <TableCell>{apt.time}</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          className={`rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-wider ${
                            apt.status === 'confirmed' 
                              ? 'bg-accent/20 text-accent border-accent/30 hover:bg-accent/30' 
                              : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                          }`}
                          variant="outline"
                        >
                          {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </Badge>
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
                <CardTitle className="text-lg">Pacientes</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar por nome..." 
                    className="pl-9"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {appointments.filter(a => a.patientName.toLowerCase().includes(searchPatient.toLowerCase())).map(p => (
                  <div 
                    key={p.patientId} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedPatientRecord?.id === p.patientId ? 'bg-primary/5 border-primary' : 'hover:bg-muted'}`}
                    onClick={() => setSelectedPatientRecord({ id: p.patientId, name: p.patientName })}
                  >
                    <p className="font-bold text-sm">{p.patientName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">ID: {p.patientId}</p>
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
                      <CardDescription>Evolução clínica do paciente</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="rounded-full">
                          <Plus className="mr-2 h-4 w-4" /> Nova Evolução
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Registro Clínico</DialogTitle>
                          <DialogDescription>Insira as notas da consulta atual.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Textarea 
                            placeholder="Descreva o procedimento realizado..." 
                            className="min-h-[150px]"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          {aiAnalysis && (
                            <div className="p-4 bg-accent/10 rounded-xl border border-accent/20 space-y-2">
                              <div className="flex items-center gap-2 text-accent-foreground font-bold text-sm">
                                <Sparkles className="h-4 w-4" /> Sugestão IA
                              </div>
                              <p className="text-xs"><strong>Resumo:</strong> {aiAnalysis.summary}</p>
                              <p className="text-xs"><strong>Conduta:</strong> {aiAnalysis.suggestedTreatment}</p>
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex gap-2">
                          <Button variant="outline" onClick={analyzeClinicalNote} disabled={loading === 'ai-analysis' || !newNote}>
                            {loading === 'ai-analysis' ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            Apoio IA
                          </Button>
                          <Button onClick={() => {
                            toast({ title: "Salvo", description: "Histórico atualizado." });
                            setNewNote("");
                            setAiAnalysis(null);
                          }}>Salvar Registro</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="border-l-2 border-primary pl-4 py-1">
                        <p className="text-[10px] text-muted-foreground font-bold">20 DE MAIO, 2024</p>
                        <p className="font-bold text-sm">Limpeza Profunda</p>
                        <p className="text-sm text-muted-foreground">Procedimento realizado sem intercorrências. Paciente orientado sobre uso de fio dental.</p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 text-center">
                  <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-bold">Selecione um paciente para ver o prontuário</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
