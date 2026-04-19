
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES, PROFESSIONALS, TIME_SLOTS, Service, Professional } from "@/lib/mock-data";
import { format, addDays, isSunday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, User, Stethoscope, ArrowRight, ArrowLeft, Calendar as CalendarIcon, CalendarCheck } from "lucide-react";
import Link from 'next/link';

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmedDate, setConfirmedDate] = useState(false);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    if (step === 3 && confirmedDate) {
      setConfirmedDate(false);
      return;
    }
    setStep(s => s - 1);
  };

  const availableDates = useMemo(() => {
    const dates = [];
    let current = startOfDay(new Date());
    while (dates.length < 12) {
      if (!isSunday(current)) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
    return dates;
  }, []);

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
          <div className="hidden md:flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <span className={step >= 1 ? "text-primary border-b-2 border-primary" : ""}>Serviço</span>
            <span className={step >= 2 ? "text-primary border-b-2 border-primary" : ""}>Dentista</span>
            <span className={step >= 3 ? "text-primary border-b-2 border-primary" : ""}>Agenda</span>
            <span className={step >= 4 ? "text-primary border-b-2 border-primary" : ""}>Resumo</span>
          </div>
        </header>

        {step === 1 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-headline font-bold">O que vamos cuidar hoje?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={`cursor-pointer transition-all border-2 rounded-2xl ${selectedService?.id === s.id ? 'border-primary bg-primary/5 shadow-inner' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedService(s)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} min</span>
                    <span className="text-lg font-bold text-primary">R$ {s.price}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button disabled={!selectedService} onClick={handleNext} className="rounded-full px-10 h-12 shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-headline font-bold">Com qual especialista?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROFESSIONALS.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all border-2 rounded-3xl overflow-hidden ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedProfessional(p)}
                >
                  <CardHeader className="items-center text-center p-6">
                    <div className="relative mb-4">
                      <img src={p.imageUrl} alt={p.name} className="w-24 h-24 rounded-full border-4 border-white shadow-xl" />
                      {selectedProfessional?.id === p.id && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full"><Check className="w-4 h-4" /></div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription className="text-primary font-bold text-xs uppercase tracking-tighter">{p.specialty}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedProfessional} onClick={handleNext} className="rounded-full px-10 h-12 shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-headline font-bold">Sua Agenda</h2>
              <p className="text-muted-foreground">Selecione primeiro o dia desejado.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {availableDates.map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-24 w-20 rounded-[2rem] flex flex-col gap-1 transition-all ${isSelected ? 'scale-110 shadow-xl ring-4 ring-primary/20' : 'hover:bg-primary/5'}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setConfirmedDate(false);
                      setSelectedTime(null);
                    }}
                    disabled={confirmedDate && !isSelected}
                  >
                    <span className="text-[10px] uppercase font-bold opacity-50">{format(date, "EEE", { locale: ptBR })}</span>
                    <span className="text-2xl font-bold">{format(date, "dd")}</span>
                    <span className="text-[10px] font-medium uppercase opacity-50">{format(date, "MMM", { locale: ptBR })}</span>
                  </Button>
                );
              })}
            </div>

            {!confirmedDate && selectedDate && (
              <div className="flex justify-center animate-in slide-in-from-top-2">
                <Button onClick={() => setConfirmedDate(true)} className="rounded-full px-12 bg-accent hover:bg-accent/90">
                  Confirmar dia {format(selectedDate, "dd/MM")} <Check className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}

            {confirmedDate && selectedDate && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 justify-center">
                  <div className="h-px flex-1 bg-border"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Horários para {format(selectedDate, "dd/MM")}</p>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
                  {TIME_SLOTS.map(t => (
                    <Button 
                      key={t} 
                      variant={selectedTime === t ? "default" : "outline"} 
                      className={`h-12 rounded-xl text-xs font-bold transition-all ${selectedTime === t ? 'scale-110 shadow-lg' : 'hover:border-primary'}`}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedTime} onClick={handleNext} className="rounded-full px-10 h-12 shadow-lg">
                Revisar Agendamento <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-md mx-auto animate-in zoom-in duration-500">
            <Card className="border-2 border-primary shadow-2xl overflow-hidden rounded-[2.5rem]">
              <CardHeader className="text-center bg-primary text-primary-foreground py-10">
                <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <CardTitle className="text-2xl font-headline tracking-widest">CONFIRMAÇÃO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-10 px-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><Stethoscope className="text-primary w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Procedimento</p>
                    <p className="font-bold text-lg">{selectedService?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><User className="text-primary w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Com o(a) especialista</p>
                    <p className="font-bold text-lg">{selectedProfessional?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><CalendarIcon className="text-primary w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Data e Hora</p>
                    <p className="font-bold text-lg italic">
                      {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-dashed flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-xs uppercase">Investimento</span>
                  <span className="text-3xl font-bold text-primary">R$ {selectedService?.price}</span>
                </div>
              </CardContent>
              <CardFooter className="p-10">
                <Button onClick={handleNext} className="w-full h-14 rounded-full text-xl font-bold shadow-xl bg-accent hover:bg-accent/90 text-white transition-all hover:translate-y-[-2px]">
                  Confirmar Agora
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-700">
            <div className="mx-auto w-32 h-32 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl relative">
              <Check className="w-16 h-16 stroke-[4px]" />
              <div className="absolute -inset-4 border-4 border-accent/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-headline font-bold text-primary">Pronto!</h2>
              <p className="text-xl text-muted-foreground">Seu agendamento foi realizado com sucesso.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Button asChild variant="outline" className="rounded-full px-10 h-12">
                <Link href="/">Início</Link>
              </Button>
              <Button asChild className="rounded-full px-10 h-12 shadow-lg">
                <Link href="/dashboard">Meus Agendamentos</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
