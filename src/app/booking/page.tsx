
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIME_SLOTS } from "@/lib/mock-data";
import { format, addDays, isSunday, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, User, Stethoscope, ArrowRight, ArrowLeft, Calendar as CalendarIcon, CalendarCheck, Loader2, Search, ShieldAlert, XCircle, CalendarPlus } from "lucide-react";
import Link from 'next/link';
import { useFirestore, useCollection, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, addDoc, doc, orderBy, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";

export default function BookingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [confirmedDate, setConfirmedDate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const MASTER_EMAILS = ["luizhenrique8759@gmail.com", "luiz88955548@gmail.com"];

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
  
  const isStaff = useMemo(() => {
    if (!user?.email) return false;
    const email = user.email.toLowerCase();
    if (MASTER_EMAILS.some(m => m.toLowerCase() === email)) return true;
    return (userData?.authorityLevel || 0) >= 1;
  }, [userData, user]);

  const [targetPatient, setTargetPatient] = useState<{ id: string, name: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const profQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('authorityLevel', '>=', 2));
  }, [db]);
  const { data: professionals, isLoading: isLoadingProfs } = useCollection(profQuery);

  const servicesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'services'), orderBy('name', 'asc'));
  }, [db]);
  const { data: services, isLoading: isLoadingServices } = useCollection(servicesQuery);

  const allUsersQuery = useMemoFirebase(() => {
    if (!db || !isStaff) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isStaff]);
  const { data: allUsers } = useCollection(allUsersQuery);

  const appointmentsOnDateQuery = useMemoFirebase(() => {
    if (!db || !selectedProfessional || !selectedDate) return null;
    return query(
      collection(db, 'appointments'),
      where('professionalId', '==', selectedProfessional.id),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd'))
    );
  }, [db, selectedProfessional, selectedDate]);
  
  const { data: existingAppointmentsRaw } = useCollection(appointmentsOnDateQuery);

  const unavailableTimes = useMemo(() => {
    if (!existingAppointmentsRaw) return new Set<string>();
    return new Set(
      existingAppointmentsRaw
        .filter(a => a.status !== 'cancelled')
        .map(a => a.time)
    );
  }, [existingAppointmentsRaw]);

  const filteredPatients = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => 
      u.role === 'patient' && (
      u.name?.toLowerCase().includes(patientSearch.toLowerCase()) || 
      u.email?.toLowerCase().includes(patientSearch.toLowerCase())
    ));
  }, [allUsers, patientSearch]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => {
    if (step === 5 && confirmedDate) {
      setConfirmedDate(false);
      return;
    }
    setStep(s => s - 1);
  };

  const handleConfirmBooking = async () => {
    if (!db || !user || !selectedService || !selectedProfessional || !selectedDate || !selectedTime || !targetPatient) {
      toast({ variant: "destructive", title: "Dados incompletos" });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const checkQuery = query(
        collection(db, 'appointments'),
        where('professionalId', '==', selectedProfessional.id),
        where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
        where('time', '==', selectedTime)
      );
      
      const snapshot = await getDocs(checkQuery);
      const isActuallyTaken = snapshot.docs.some(doc => doc.data().status !== 'cancelled');

      if (isActuallyTaken) {
        toast({ 
          variant: "destructive", 
          title: "Horário Indisponível", 
          description: "Este horário acabou de ser ocupado. Por favor, escolha outro." 
        });
        setStep(4);
        setSelectedTime(null);
        setIsSubmitting(false);
        return;
      }

      const appointmentData = {
        patientId: targetPatient.id,
        patientName: targetPatient.name,
        professionalId: selectedProfessional.id,
        professionalName: selectedProfessional.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending',
        bookedBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      setStep(6); 
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao agendar" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoadingUserDoc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">O agendamento é realizado exclusivamente pela nossa equipe.</p>
        <Button asChild><Link href="/">Voltar ao Início</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
             <Stethoscope className="h-6 w-6 text-primary" />
             <span className="text-xl font-headline font-bold text-primary">Portal Sync</span>
          </Link>
          <div className="hidden md:flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            <span className={step >= 1 ? "text-primary" : ""}>Paciente</span>
            <span className={step >= 2 ? "text-primary" : ""}>Dentista</span>
            <span className={step >= 3 ? "text-primary" : ""}>Serviço</span>
            <span className={step >= 4 ? "text-primary" : ""}>Agenda</span>
            <span className={step >= 5 ? "text-primary" : ""}>Resumo</span>
          </div>
        </header>

        {step === 1 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
             <h2 className="text-3xl font-headline font-bold">Para qual paciente?</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou e-mail..." 
                className="pl-10 h-12 rounded-xl"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredPatients?.map((p) => {
                const age = calculateAge(p.birthDate);
                return (
                  <Card 
                    key={p.id} 
                    className={`cursor-pointer p-4 transition-all ${targetPatient?.id === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                    onClick={() => setTargetPatient({ id: p.id, name: p.name })}
                  >
                    <p className="font-bold">{p.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-muted-foreground">{p.email || 'Presencial'}</p>
                      {age !== null && <Badge variant="outline" className="text-[10px]">{age} anos</Badge>}
                    </div>
                  </Card>
                );
              })}
              {filteredPatients?.length === 0 && <p className="col-span-2 text-center py-10 text-muted-foreground">Nenhum paciente encontrado.</p>}
            </div>
            <div className="flex justify-between items-center pt-4">
               <p className="text-xs text-muted-foreground italic">Selecione um paciente para prosseguir.</p>
               <Button disabled={!targetPatient} onClick={handleNext} className="rounded-full px-10 h-12">Próximo</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-3xl font-headline font-bold">Com qual especialista?</h2>
            {isLoadingProfs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {professionals?.map((p) => (
                  <Card 
                    key={p.id} 
                    className={`cursor-pointer border-2 transition-all ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                    onClick={() => setSelectedProfessional(p)}
                  >
                    <CardHeader className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mb-4">
                        {p.name?.substring(0,2).toUpperCase()}
                      </div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription>{p.role === 'dentist' ? 'Cirurgião Dentista' : 'Especialista'}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedProfessional} onClick={handleNext} className="ml-auto rounded-full px-10 h-12">Próximo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-headline font-bold">Qual procedimento?</h2>
            {isLoadingServices ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services?.map((s) => (
                  <Card 
                    key={s.id} 
                    className={`cursor-pointer border-2 transition-all ${selectedService?.id === s.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => setSelectedService(s)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{s.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between">
                      <span className="text-xs font-bold"><Clock className="inline w-3 h-3" /> {s.duration} min</span>
                      <span className="text-lg font-bold text-primary">R$ {s.price?.toLocaleString('pt-BR')}</span>
                    </CardContent>
                  </Card>
                ))}
                {services?.length === 0 && (
                  <div className="col-span-2 p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                    Nenhum procedimento cadastrado no sistema. Por favor, adicione procedimentos no painel administrativo.
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedService} onClick={handleNext} className="ml-auto rounded-full px-10 h-12">Próximo</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-8 animate-in fade-in">
            <h2 className="text-3xl font-headline font-bold text-center">Selecione o Dia</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {availableDates.map((date) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <Button
                    key={date.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className="h-20 w-16 rounded-2xl flex flex-col gap-1"
                    onClick={() => { setSelectedDate(date); setConfirmedDate(true); }}
                  >
                    <span className="text-[10px] uppercase font-bold">{format(date, "EEE", { locale: ptBR })}</span>
                    <span className="text-xl font-bold">{format(date, "dd")}</span>
                  </Button>
                );
              })}
            </div>

            {confirmedDate && selectedDate && (
              <div className="space-y-6">
                <p className="text-center font-bold">Horários para {format(selectedDate, "dd/MM")}:</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {TIME_SLOTS.map(t => {
                    const isTaken = unavailableTimes.has(t);
                    return (
                      <Button 
                        key={t} 
                        variant={selectedTime === t ? "default" : "outline"} 
                        className={`rounded-lg transition-all ${isTaken ? 'opacity-40 bg-muted cursor-not-allowed border-none' : ''}`}
                        disabled={isTaken}
                        onClick={() => setSelectedTime(t)}
                      >
                        {isTaken ? <XCircle className="w-3 h-3 mr-1 opacity-50" /> : null}
                        {t}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-8 border-t">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedTime} onClick={handleNext} className="rounded-full px-10 h-12">Revisar</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="max-w-md mx-auto animate-in zoom-in">
            <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem]">
              <CardHeader className="text-center bg-primary text-primary-foreground py-8">
                <CardTitle className="text-2xl font-headline">REVISÃO</CardTitle>
                <p className="text-xs opacity-90 mt-2">Paciente: {targetPatient?.name}</p>
              </CardHeader>
              <CardContent className="space-y-6 pt-10">
                <div className="flex flex-col gap-4">
                  <p className="text-sm"><strong>Especialista:</strong> {selectedProfessional?.name}</p>
                  <p className="text-sm"><strong>Procedimento:</strong> {selectedService?.name}</p>
                  <p className="text-sm"><strong>Data/Hora:</strong> {selectedDate && format(selectedDate, "dd/MM")} às {selectedTime}</p>
                </div>
                <div className="pt-6 border-t flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {selectedService?.price?.toLocaleString('pt-BR')}</span>
                </div>
              </CardContent>
              <CardFooter className="p-10">
                <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="w-full h-14 rounded-full text-xl font-bold">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Agendamento"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {step === 6 && (
          <div className="text-center space-y-6 py-12 animate-in fade-in">
            <div className="mx-auto w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center shadow-xl">
              <Check className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-headline font-bold text-primary">Sucesso!</h2>
            <p className="text-muted-foreground">Consulta agendada para {targetPatient?.name}.</p>
            <div className="flex justify-center gap-4 pt-8">
              <Button asChild className="rounded-full px-10 h-12">
                <Link href="/admin">Voltar à Agenda</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
