"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES, PROFESSIONALS, TIME_SLOTS, Service, Professional } from "@/lib/mock-data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, User, Stethoscope, Calendar as CalendarIcon, ArrowRight, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDateConfirmed, setIsDateConfirmed] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleDateConfirm = () => {
    if (selectedDate) {
      setIsDateConfirmed(true);
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
             <div className="bg-primary p-1.5 rounded-lg">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
             </div>
             <span className="text-xl font-headline font-bold text-primary">Sync</span>
          </Link>
          <div className="hidden md:flex gap-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className={step >= 1 ? "text-primary border-b-2 border-primary" : ""}>Serviço</span>
            <span className={step >= 2 ? "text-primary border-b-2 border-primary" : ""}>Profissional</span>
            <span className={step >= 3 ? "text-primary border-b-2 border-primary" : ""}>Horário</span>
            <span className={step >= 4 ? "text-primary border-b-2 border-primary" : ""}>Data</span>
            <span className={step >= 5 ? "text-primary border-b-2 border-primary" : ""}>Revisão</span>
          </div>
        </header>

        {step === 1 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold">Qual serviço você procura?</h2>
              <p className="text-muted-foreground">Selecione o procedimento para ver os profissionais disponíveis.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={`cursor-pointer transition-all border-2 ${selectedService?.id === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedService(s)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> {s.duration} min</span>
                      <span className="text-lg font-bold text-primary">R$ {s.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button disabled={!selectedService} onClick={handleNext} className="rounded-full px-10 h-12 text-lg shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold">Escolha um profissional</h2>
              <p className="text-muted-foreground">Nossa equipe de especialistas está pronta para cuidar de você.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PROFESSIONALS.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all border-2 ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedProfessional(p)}
                >
                  <CardHeader className="items-center text-center">
                    <img src={p.imageUrl} alt={p.name} className="w-24 h-24 rounded-full border-4 border-background mb-4 shadow-md" />
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">{p.specialty}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedProfessional} onClick={handleNext} className="rounded-full px-10 h-12 text-lg shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold">Escolha o horário</h2>
              <p className="text-muted-foreground">Qual o melhor período do dia para você?</p>
            </div>
            <Card className="border-none shadow-xl bg-card">
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
                {TIME_SLOTS.map(t => (
                  <Button 
                    key={t} 
                    variant={selectedTime === t ? "default" : "outline"} 
                    className={`h-14 rounded-xl text-lg transition-all ${selectedTime === t ? 'scale-105 shadow-md' : 'hover:border-primary'}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedTime} onClick={handleNext} className="rounded-full px-10 h-12 text-lg shadow-lg">
                Ver dias disponíveis <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-headline font-bold">Selecione o dia</h2>
              <p className="text-muted-foreground">Mostrando dias disponíveis para o horário das <span className="font-bold text-primary">{selectedTime}</span></p>
            </div>
            <div className="max-w-md mx-auto w-full">
              <Card className="p-4 flex flex-col items-center border-none bg-muted/30 shadow-2xl rounded-3xl">
                <div className="bg-white rounded-2xl shadow-sm border p-2 w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                    }}
                    className="rounded-md w-full"
                    locale={ptBR}
                  />
                </div>
                {selectedDate && (
                  <Button 
                    onClick={handleDateConfirm} 
                    className="mt-6 w-full rounded-full bg-primary hover:bg-primary/90 shadow-lg h-12 text-lg font-bold"
                  >
                    Confirmar {format(selectedDate, "dd/MM", { locale: ptBR })}
                  </Button>
                )}
              </Card>
            </div>
            <div className="flex justify-start pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="max-w-md mx-auto animate-in zoom-in duration-500">
            <Card className="border-2 border-primary shadow-2xl overflow-hidden rounded-[2rem]">
              <CardHeader className="text-center bg-primary text-primary-foreground py-8">
                <CardTitle className="text-2xl font-headline uppercase tracking-widest">Resumo</CardTitle>
                <CardDescription className="text-primary-foreground/80">Confira se está tudo correto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-8 px-8">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-secondary/50 rounded-2xl group-hover:scale-110 transition-transform"><Stethoscope className="text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Procedimento</p>
                    <p className="font-bold text-lg">{selectedService?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-secondary/50 rounded-2xl group-hover:scale-110 transition-transform"><User className="text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Profissional</p>
                    <p className="font-bold text-lg">{selectedProfessional?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-secondary/50 rounded-2xl group-hover:scale-110 transition-transform"><Clock className="text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Data e Hora</p>
                    <p className="font-bold text-lg italic">
                      {selectedDate && format(selectedDate, "dd/MM/yyyy")} às {selectedTime}
                    </p>
                  </div>
                </div>
                <div className="border-t border-dashed pt-6 flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Investimento</span>
                  <span className="text-3xl font-bold text-primary">R$ {selectedService?.price}</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 p-8">
                <Button onClick={handleNext} className="w-full h-14 rounded-full text-xl font-bold shadow-xl bg-accent hover:bg-accent/90 text-white transition-all hover:translate-y-[-2px]">
                  Finalizar Agendamento
                </Button>
                <Button variant="ghost" onClick={handleBack} className="w-full text-muted-foreground hover:bg-transparent hover:text-primary">
                  Deseja alterar algo?
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-700">
            <div className="mx-auto w-32 h-32 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl relative">
              <Check className="w-16 h-16 stroke-[4px]" />
              <div className="absolute -inset-4 border-4 border-accent/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-headline font-bold text-primary">Agendado!</h2>
              <p className="text-xl text-muted-foreground">Seu horário foi reservado com sucesso.</p>
              <p className="text-sm text-muted-foreground bg-muted/50 inline-block px-4 py-1 rounded-full">Enviamos os detalhes para seu e-mail.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Button asChild variant="outline" className="rounded-full px-10 h-12 text-lg">
                <Link href="/">Voltar ao Início</Link>
              </Button>
              <Button asChild className="rounded-full px-10 h-12 text-lg shadow-lg">
                <Link href="/dashboard">Ver meus horários</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
