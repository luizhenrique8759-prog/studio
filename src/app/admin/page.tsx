"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_APPOINTMENTS, SERVICES, PROFESSIONALS, Appointment } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, DollarSign, FileText, Bell, CheckCircle2, Clock, Stethoscope, MessageSquare, Sparkles, LogOut } from "lucide-react";
import { generateBillingSummary } from "@/ai/flows/generate-billing-summary";
import { generateAppointmentNotification } from "@/ai/flows/generate-appointment-notification";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState<string | null>(null);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Sessão administrativa encerrada",
        description: "Você saiu do painel de controle.",
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Não foi possível encerrar a sessão.",
      });
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

      toast({
        title: "Agendamento Confirmado",
        description: "Notificação enviada ao paciente via IA.",
      });
    } catch (error) {
       toast({ title: "Erro", description: "Falha ao processar confirmação", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const generateInvoice = async (apt: Appointment) => {
    setLoading(`billing-${apt.id}`);
    try {
      const service = SERVICES.find(s => s.id === apt.serviceId);
      const res = await generateBillingSummary({
        patientId: apt.patientId,
        patientName: apt.patientName,
        appointments: [{
          appointmentId: apt.id,
          date: apt.date,
          serviceDescription: service?.name || 'Consulta Dentária',
          cost: service?.price || 150
        }]
      });

      toast({
        title: "Resumo de Faturamento Gerado",
        description: `Total: R$ ${res.totalCost}`,
      });
    } catch (error) {
       toast({ title: "Erro", description: "Falha ao gerar faturamento", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gestão completa da Clínica Dental Sync</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full"><Bell className="mr-2 h-4 w-4" /> Notificações</Button>
          <Button variant="ghost" className="rounded-full text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
          <Button className="rounded-full px-6">+ Novo Agendamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Agendamentos Hoje</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground font-medium">+2 em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Novos Pacientes</CardTitle>
            <Users className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground font-medium">+12% este mês</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Faturamento Estimado</CardTitle>
            <DollarSign className="w-4 h-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450</div>
            <p className="text-xs text-muted-foreground font-medium">+5% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando confirmação manual</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 inline-flex border shadow-sm">
          <TabsTrigger value="appointments" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Agendamentos</TabsTrigger>
          <TabsTrigger value="professionals" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Profissionais</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Faturamento IA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments" className="animate-in fade-in zoom-in-95 duration-300">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b">
              <CardTitle className="font-headline text-2xl">Gestão de Consultas</CardTitle>
              <CardDescription>Visualize e confirme os agendamentos realizados pelos usuários.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold">Paciente</TableHead>
                    <TableHead className="font-bold">Profissional</TableHead>
                    <TableHead className="font-bold">Serviço</TableHead>
                    <TableHead className="font-bold">Data/Hora</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="text-right font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => {
                    const prof = PROFESSIONALS.find(p => p.id === apt.professionalId);
                    const service = SERVICES.find(s => s.id === apt.serviceId);
                    return (
                      <TableRow key={apt.id} className="group transition-colors">
                        <TableCell className="font-bold">{apt.patientName}</TableCell>
                        <TableCell className="text-muted-foreground">{prof?.name}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className="rounded-md bg-muted/30">{service?.name}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{apt.date} às {apt.time}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} 
                            className={apt.status === 'confirmed' ? 'bg-accent/20 text-accent-foreground border-accent/20 font-bold px-3' : 'font-bold px-3'}
                          >
                            {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {apt.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-accent hover:bg-accent/90 rounded-full h-8 px-4"
                              onClick={() => confirmAppointment(apt)}
                              disabled={loading === apt.id}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" /> 
                              {loading === apt.id ? 'Confirmando...' : 'Confirmar'}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="rounded-full h-8 px-4"
                            onClick={() => generateInvoice(apt)}
                            disabled={loading === `billing-${apt.id}`}
                          >
                            <FileText className="mr-1 h-3 w-3" /> 
                            {loading === `billing-${apt.id}` ? 'Processando...' : 'IA Fatura'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professionals" className="animate-in fade-in zoom-in-95 duration-300">
           <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="font-headline text-2xl text-primary">Equipe Odontológica</CardTitle>
              <CardDescription>Gerencie as contas e especialidades dos dentistas da clínica.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              {PROFESSIONALS.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-5 border rounded-2xl hover:bg-primary/5 hover:border-primary/20 transition-all group cursor-default">
                  <div className="relative">
                    <img src={p.imageUrl} className="w-16 h-16 rounded-full border-2 border-primary/20 group-hover:scale-105 transition-transform" alt={p.name} />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-sm text-primary font-medium">{p.specialty}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto rounded-full hover:bg-primary/10"><Clock className="w-4 h-4 text-primary" /></Button>
                </div>
              ))}
            </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="billing" className="animate-in fade-in zoom-in-95 duration-300">
           <Card className="border-none shadow-xl bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="border-b">
              <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                <Sparkles className="text-accent animate-pulse" /> Assistente de Faturamento IA
              </CardTitle>
              <CardDescription>Utilize inteligência artificial para gerar relatórios e resumos de cobrança automáticos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
               <div className="bg-white/80 p-6 rounded-3xl border shadow-sm backdrop-blur-sm">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                    <MessageSquare className="w-5 h-5" /> Inteligência Analítica
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O assistente processa dados de procedimentos complexos e gera descrições simplificadas para o faturamento. 
                  </p>
               </div>
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
