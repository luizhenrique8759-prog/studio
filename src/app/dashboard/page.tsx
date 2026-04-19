"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_APPOINTMENTS, SERVICES, PROFESSIONALS } from "@/lib/mock-data";
import { Calendar as CalendarIcon, Clock, User, Stethoscope, ChevronRight, Settings, LogOut, Bell } from "lucide-react";
import Link from 'next/link';

export default function PatientDashboard() {
  const [userAppointments] = useState(MOCK_APPOINTMENTS.filter(a => a.patientId === 'u1'));

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Nav */}
      <nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-1 rounded-lg">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold text-primary">Sync</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full"><Bell className="h-5 w-5" /></Button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold">JO</div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Olá, João Oliveira!</h1>
            <p className="text-muted-foreground">Gerencie sua saúde bucal em um só lugar.</p>
          </div>
          <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
            <Link href="/booking">Agendar Nova Consulta</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
              <CalendarIcon className="text-primary" /> Meus Agendamentos
            </h2>
            
            {userAppointments.length > 0 ? (
              <div className="space-y-4">
                {userAppointments.map(apt => {
                  const prof = PROFESSIONALS.find(p => p.id === apt.professionalId);
                  const service = SERVICES.find(s => s.id === apt.serviceId);
                  return (
                    <Card key={apt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge className={apt.status === 'confirmed' ? 'bg-accent/20 text-accent-foreground border-accent/20' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                                {apt.status === 'confirmed' ? 'Confirmado' : 'Aguardando Confirmação'}
                              </Badge>
                              <h3 className="text-xl font-bold mt-2">{service?.name}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">R$ {service?.price}</p>
                              <p className="text-xs text-muted-foreground">Pague na clínica</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="w-4 h-4" /> {prof?.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" /> {apt.date} às {apt.time}
                            </div>
                          </div>
                        </div>
                        <div className="bg-muted/30 p-4 flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l">
                          <Button variant="outline" size="sm" className="rounded-full">Reagendar</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 rounded-full">Cancelar</Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center space-y-4 border-dashed border-2">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold">Nenhum agendamento encontrado</p>
                  <p className="text-sm text-muted-foreground">Você ainda não possui consultas marcadas.</p>
                </div>
                <Button asChild className="rounded-full">
                  <Link href="/booking">Marcar Primeira Consulta</Link>
                </Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
               Ações Rápidas
            </h2>
            <div className="grid gap-4">
              <Card className="cursor-pointer hover:bg-primary/5 transition-colors border-l-4 border-l-primary">
                <CardHeader className="p-4">
                  <CardTitle className="text-md flex items-center justify-between">
                    Perfil Completo <ChevronRight className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:bg-accent/5 transition-colors border-l-4 border-l-accent">
                <CardHeader className="p-4">
                  <CardTitle className="text-md flex items-center justify-between">
                    Histórico Médico <ChevronRight className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:bg-secondary transition-colors border-l-4 border-l-secondary-foreground">
                <CardHeader className="p-4">
                  <CardTitle className="text-md flex items-center justify-between">
                    Financeiro & Recibos <ChevronRight className="w-4 h-4" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="bg-primary text-primary-foreground overflow-hidden">
               <CardHeader>
                  <CardTitle className="font-headline">Clube Sync+</CardTitle>
                  <CardDescription className="text-primary-foreground/80">Descontos exclusivos em procedimentos estéticos.</CardDescription>
               </CardHeader>
               <CardFooter>
                  <Button variant="secondary" className="w-full rounded-full">Saiba Mais</Button>
               </CardFooter>
            </Card>

            <div className="pt-4 border-t flex flex-col gap-2">
               <Button variant="ghost" className="justify-start"><Settings className="mr-2 h-4 w-4" /> Configurações</Button>
               <Button variant="ghost" className="justify-start text-destructive hover:text-destructive"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}