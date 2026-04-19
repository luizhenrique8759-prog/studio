
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVICES, TIME_SLOTS, Service } from "@/lib/mock-data";
import { format, addDays, isSunday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, User, Stethoscope, ArrowRight, ArrowLeft, Calendar as CalendarIcon, CalendarCheck, Loader2, Search } from "lucide-react";
import Link from 'next/link';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";

export default function BookingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmedDate, setConfirmedDate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Carregar datas apenas no cliente para evitar erro de hidratação
  useEffect(() => {
    const dates = [];
    let current = startOfDay(new Date());
    while (dates.length < 12) {
      if (!isSunday(current)) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
    setAvailableDates(dates);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  
  const { data: userData, isLoading: isLoadingUserDoc } = useDoc(userDocRef);
  
  const authorityLevel = useMemo(() => {
    if (!user) return 0;
    if (user.email === "luizhenrique8759@gmail.com") return 4;
    if (user.email === "luiz87596531@gmail.com") return 3;
    return userData?.authorityLevel || 0;
  }, [userData, user]);

  const isAdmin = useMemo(() => authorityLevel >= 3, [authorityLevel]);

  const [targetPatient, setTargetPatient] = useState<{ id: string, name: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const profQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('role', 'in', ['dentist', 'professional', 'assistant']));
  }, [db]);
  const { data: professionals, isLoading: isLoadingProfs } = useCollection(profQuery);

  const allUsersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: allPatients, isLoading: isLoadingPatients } = useCollection(allUsersQuery);

  const filteredPatients = useMemo(() => {
    if (!allPatients) return [];
    return allPatients.filter(p => 
      p.name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
      p.email?.toLowerCase().includes(patientSearch.toLowerCase())
    );
  }, [allPatients, patientSearch]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    if (step === (isAdmin ? 5 : 4) && confirmedDate) {
      setConfirmedDate(false);
      return;
    }
    setStep(s => s - 1);
  };

  const handleConfirmBooking = async () => {
    if (!db || !user || !selectedService || !selectedProfessional || !selectedDate || !selectedTime) {
      toast({ variant: "destructive", title: "Dados incompletos", description: "Por favor, preencha todas as informações." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const finalPatientId = (isAdmin && targetPatient) ? targetPatient.id : user.uid;
      const finalPatientName = (isAdmin && targetPatient) ? targetPatient.name : (user.displayName || userData?.name || 'Paciente');

      const appointmentData = {
        patientId: finalPatientId,
        patientName: finalPatientName,
        professionalId: selectedProfessional.id,
        professionalName: selectedProfessional.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending',
        bookedBy: user.uid,
        bookedByName: user.displayName || userData?.name || 'Sistema',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      setStep(isAdmin ? 6 : 5); 
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: "Não foi possível completar seu agendamento. Verifique sua conexão."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoadingUserDoc) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

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
            {isAdmin && <span className={step >= 1 ? "text-primary border-b-2 border-primary" : ""}>Paciente</span>}
            <span className={step >= (isAdmin ? 2 : 1) ? "text-primary border-b-2 border-primary" : ""}>Dentista</span>
            <span className={step >= (isAdmin ? 3 : 2) ? "text-primary border-b-2 border-primary" : ""}>Serviço</span>
            <span className={step >= (isAdmin ? 4 : 3) ? "text-primary border-b-2 border-primary" : ""}>Agenda</span>
            <span className={step >= (isAdmin ? 5 : 4) ? "text-primary border-b-2 border-primary" : ""}>Resumo</span>
          </div>
        </header>

        {/* Passo 1: Seleção de Paciente (Apenas Admin) */}
        {step === 1 && isAdmin && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-2">
              <h2 className="text-3xl font-headline font-bold">Para quem é este agendamento?</h2>
              <p className="text-muted-foreground">Como administrador, você pode marcar consultas para qualquer paciente.</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar paciente por nome ou e-mail..." 
                className="pl-10 h-12 rounded-xl"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              <Card 
                className={`cursor-pointer transition-all border-2 rounded-2xl p-4 flex items-center gap-4 ${!targetPatient ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                onClick={() => setTargetPatient(null)}
              >
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">EU</div>
                <div>
                  <p className="font-bold">Agendar para mim</p>
                  <p className="text-xs text-muted-foreground">Sua própria consulta pessoal</p>
                </div>
              </Card>

              {filteredPatients?.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all border-2 rounded-2xl p-4 flex items-center gap-4 ${targetPatient?.id === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => setTargetPatient({ id: p.id, name: p.name })}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                    {p.name?.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} className="rounded-full px-10 h-12 shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Passo Especialista */}
        {((step === 1 && !isAdmin) || (step === 2 && isAdmin)) && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-headline font-bold">Com qual especialista?</h2>
            {isLoadingProfs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {professionals?.map((p) => (
                  <Card 
                    key={p.id} 
                    className={`cursor-pointer transition-all border-2 rounded-3xl overflow-hidden ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedProfessional(p)}
                  >
                    <CardHeader className="items-center text-center p-6">
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-xl text-primary text-2xl font-bold">
                          {p.name?.substring(0,2).toUpperCase()}
                        </div>
                        {selectedProfessional?.id === p.id && (
                          <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full"><Check className="w-4 h-4" /></div>
                        )}
                      </div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription className="text-primary font-bold text-xs uppercase tracking-tighter">
                        {p.role === 'dentist' ? 'Cirurgião Dentista' : 'Especialista Sync'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-4">
              {isAdmin && <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>}
              <Button disabled={!selectedProfessional} onClick={handleNext} className="ml-auto rounded-full px-10 h-12 shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Passo Serviço */}
        {((step === 2 && !isAdmin) || (step === 3 && isAdmin)) && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-headline font-bold">O que vamos cuidar hoje?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={`cursor-pointer transition-all border-2 rounded-2xl ${selectedService?.id === s.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
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
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedService} onClick={handleNext} className="ml-auto rounded-full px-10 h-12 shadow-lg">
                Próximo <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Passo Agenda */}
        {((step === 3 && !isAdmin) || (step === 4 && isAdmin)) && (
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

        {/* Passo Resumo */}
        {((step === 4 && !isAdmin) || (step === 5 && isAdmin)) && (
          <div className="max-w-md mx-auto animate-in zoom-in duration-500">
            <Card className="border-2 border-primary shadow-2xl overflow-hidden rounded-[2.5rem]">
              <CardHeader className="text-center bg-primary text-primary-foreground py-10">
                <CalendarCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <CardTitle className="text-2xl font-headline tracking-widest">CONFIRMAÇÃO</CardTitle>
                {isAdmin && targetPatient && (
                  <p className="mt-2 text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full">
                    Para: {targetPatient.name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6 pt-10 px-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><User className="text-primary w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Especialista</p>
                    <p className="font-bold text-lg">{selectedProfessional?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl"><Stethoscope className="text-primary w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Procedimento</p>
                    <p className="font-bold text-lg">{selectedService?.name}</p>
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
                <Button 
                  onClick={handleConfirmBooking} 
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-full text-xl font-bold shadow-xl bg-accent hover:bg-accent/90 text-white"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : "Confirmar Agora"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Passo Sucesso */}
        {((step === 5 && !isAdmin) || (step === 6 && isAdmin)) && (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-700">
            <div className="mx-auto w-32 h-32 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl relative">
              <Check className="w-16 h-16 stroke-[4px]" />
              <div className="absolute -inset-4 border-4 border-accent/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-headline font-bold text-primary">Pronto!</h2>
              <p className="text-xl text-muted-foreground">O agendamento foi realizado com sucesso.</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <Button asChild variant="outline" className="rounded-full px-10 h-12">
                <Link href="/">Início</Link>
              </Button>
              <Button asChild className="rounded-full px-10 h-12 shadow-lg">
                <Link href={authorityLevel >= 1 ? "/admin" : "/dashboard"}>
                  {authorityLevel >= 1 ? "Ver Agenda da Clínica" : "Meus Agendamentos"}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
