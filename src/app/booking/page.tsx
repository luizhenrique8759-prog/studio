"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICES, PROFESSIONALS, TIME_SLOTS, Service, Professional } from "@/lib/mock-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, ChevronLeft, Clock, User, Stethoscope, Sparkles } from "lucide-react";
import Link from 'next/link';

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const isConfirmed = step === 5;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
             <div className="bg-primary p-1.5 rounded-lg">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
             </div>
             <span className="text-xl font-headline font-bold text-primary">Dental Sync</span>
          </Link>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span className={step >= 1 ? "text-primary font-bold" : ""}>Serviço</span>
            <span>•</span>
            <span className={step >= 2 ? "text-primary font-bold" : ""}>Profissional</span>
            <span>•</span>
            <span className={step >= 3 ? "text-primary font-bold" : ""}>Data & Hora</span>
            <span>•</span>
            <span className={step >= 4 ? "text-primary font-bold" : ""}>Confirmação</span>
          </div>
        </header>

        {step === 1 && (
          <div className="grid gap-6">
            <h2 className="text-3xl font-headline font-bold">Qual serviço você procura?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={`cursor-pointer transition-all border-2 ${selectedService?.id === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedService(s)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> {s.duration} min</span>
                      <span className="text-lg font-bold text-primary">R$ {s.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end">
              <Button disabled={!selectedService} onClick={handleNext} className="rounded-full px-8">Próximo</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6">
            <h2 className="text-3xl font-headline font-bold">Escolha um profissional</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROFESSIONALS.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all border-2 ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedProfessional(p)}
                >
                  <CardHeader className="items-center">
                    <img src={p.imageUrl} alt={p.name} className="w-24 h-24 rounded-full border mb-4 shadow-sm" />
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription>{p.specialty}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} className="rounded-full"><ChevronLeft className="mr-2" /> Voltar</Button>
              <Button disabled={!selectedProfessional} onClick={handleNext} className="rounded-full px-8">Próximo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6">
            <h2 className="text-3xl font-headline font-bold">Data e Horário</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  locale={ptBR}
                />
              </Card>
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>Horários Disponíveis</CardTitle>
                  <CardDescription>Para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'selecione uma data'}</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(t => (
                    <Button 
                      key={t} 
                      variant={selectedTime === t ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} className="rounded-full"><ChevronLeft className="mr-2" /> Voltar</Button>
              <Button disabled={!selectedDate || !selectedTime} onClick={handleNext} className="rounded-full px-8">Próximo</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary shadow-xl">
              <CardHeader className="text-center bg-primary/5">
                <CardTitle className="text-2xl font-headline">Resumo do Agendamento</CardTitle>
                <CardDescription>Confira os detalhes antes de finalizar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/30 rounded-full"><Stethoscope className="text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Procedimento</p>
                    <p className="font-bold">{selectedService?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/30 rounded-full"><User className="text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profissional</p>
                    <p className="font-bold">{selectedProfessional?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/30 rounded-full"><Clock className="text-primary" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data e Hora</p>
                    <p className="font-bold">
                      {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-muted-foreground">Total a pagar na clínica</span>
                  <span className="text-2xl font-bold text-primary">R$ {selectedService?.price}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button onClick={handleNext} className="w-full h-12 rounded-full text-lg shadow-lg">Confirmar Agendamento</Button>
                <Button variant="ghost" onClick={handleBack} className="w-full">Alterar detalhes</Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-12 h-12 stroke-[3px]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-headline font-bold text-primary">Sucesso!</h2>
              <p className="text-xl text-muted-foreground">Seu agendamento foi realizado com sucesso.</p>
              <p className="text-sm text-muted-foreground">Você receberá uma confirmação em breve.</p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button asChild variant="outline" className="rounded-full px-8">
                <Link href="/">Voltar ao Início</Link>
              </Button>
              <Button asChild className="rounded-full px-8">
                <Link href="/dashboard">Meus Agendamentos</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}