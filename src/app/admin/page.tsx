"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/tabs";
import { MOCK_APPOINTMENTS, SERVICES, PROFESSIONALS, Appointment } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, DollarSign, FileText, Bell, CheckCircle2, XCircle, Clock, Stethoscope, MessageSquare, Sparkles } from "lucide-react";
import { generateBillingSummary } from "@/ai/flows/generate-billing-summary";
import { generateAppointmentNotification } from "@/ai/flows/generate-appointment-notification";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [loading, setLoading] = useState<string | null>(null);

  const confirmAppointment = async (apt: Appointment) => {
    setLoading(apt.id);
    try {
      setAppointments(prev => prev.map(a => a.id === apt.id ? { ...a, status: 'confirmed' } : a));
      
      const prof = PROFESSIONALS.find(p => p.id === apt.professionalId);
      const service = SERVICES.find(s => s.id === apt.serviceId);

      const { message } = await generateAppointmentNotification({
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

      console.log("AI Message:", message);
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

      console.log("Billing Summary:", res.billingSummary);
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
    <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gestão completa da Clínica Dental Sync</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full"><Bell className="mr-2 h-4 w-4" /> Notificações</Button>
          <Button className="rounded-full px-6">+ Novo Agendamento</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 em relação a ontem</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Novos Pacientes</CardTitle>
            <Users className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48</div>
            <p className="text-xs text-muted-foreground">+12% este mês</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Faturamento Estimado</CardTitle>
            <DollarSign className="w-4 h-4 text-secondary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.450</div>
            <p className="text-xs text-muted-foreground">+5% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Aguardando confirmação manual</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-4">
          <TabsTrigger value="appointments" className="rounded-lg">Agendamentos</TabsTrigger>
          <TabsTrigger value="professionals" className="rounded-lg">Profissionais</TabsTrigger>
          <TabsTrigger value="patients" className="rounded-lg">Pacientes</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg">Faturamento IA</TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Gestão de Consultas</CardTitle>
              <CardDescription>Visualize e confirme os agendamentos realizados pelos usuários.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((apt) => {
                    const prof = PROFESSIONALS.find(p => p.id === apt.professionalId);
                    const service = SERVICES.find(s => s.id === apt.serviceId);
                    return (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{apt.patientName}</TableCell>
                        <TableCell>{prof?.name}</TableCell>
                        <TableCell>{service?.name}</TableCell>
                        <TableCell>{apt.date} às {apt.time}</TableCell>
                        <TableCell>
                          <Badge variant={apt.status === 'confirmed' ? 'secondary' : 'outline'} className={apt.status === 'confirmed' ? 'bg-accent/20 text-accent-foreground border-accent/20' : ''}>
                            {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {apt.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="bg-accent hover:bg-accent/90"
                              onClick={() => confirmAppointment(apt)}
                              disabled={loading === apt.id}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" /> 
                              {loading === apt.id ? 'Confirmando...' : 'Confirmar'}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => generateInvoice(apt)}
                            disabled={loading === `billing-${apt.id}`}
                          >
                            <FileText className="mr-1 h-4 w-4" /> 
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

        <TabsContent value="professionals">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Equipe Odontológica</CardTitle>
              <CardDescription>Gerencie as contas e especialidades dos dentistas da clínica.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PROFESSIONALS.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                  <img src={p.imageUrl} className="w-12 h-12 rounded-full" alt={p.name} />
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.specialty}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto"><Clock className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button variant="outline" className="h-full border-dashed rounded-xl border-2">+ Adicionar Profissional</Button>
            </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="billing">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Sparkles className="text-accent" /> Assistente de Faturamento IA
              </CardTitle>
              <CardDescription>Utilize inteligência artificial para gerar relatórios e resumos de cobrança automáticos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="bg-secondary/20 p-6 rounded-2xl border border-secondary">
                  <h4 className="font-bold mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Como funciona?</h4>
                  <p className="text-sm text-muted-foreground">O assistente analisa os procedimentos realizados e gera uma descrição amigável para o paciente, facilitando a transparência e agilizando o faturamento.</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button size="lg" className="rounded-xl h-24 flex-col gap-2">
                     <FileText className="h-6 w-6" />
                     Relatório de Fechamento Mensal
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl h-24 flex-col gap-2 border-primary text-primary">
                     <Users className="h-6 w-6" />
                     Análise de Rentabilidade por Dentista
                  </Button>
               </div>
            </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
