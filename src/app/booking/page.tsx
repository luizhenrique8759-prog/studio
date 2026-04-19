
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
    return userData?.authorityLevel || 0;
  }, [userData, user]);

  const isAdmin = useMemo(() => authorityLevel >= 3, [authorityLevel]);

  const [targetPatient, setTargetPatient] = useState<{ id: string, name: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");

  const profQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('authorityLevel', '>=', 2));
  }, [db]);
  const { data: professionals, isLoading: isLoadingProfs } = useCollection(profQuery);

  const allUsersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'users'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: allPatients } = useCollection(allUsersQuery);

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
      toast({ variant: "destructive", title: "Dados incompletos" });
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
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      setStep(isAdmin ? 6 : 5); 
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao agendar" });
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
             <Stethoscope className="h-6 w-6 text-primary" />
             <span className="text-xl font-headline font-bold text-primary">Sync</span>
          </Link>
          <div className="hidden md:flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {isAdmin && <span className={step >= 1 ? "text-primary" : ""}>Paciente</span>}
            <span className={step >= (isAdmin ? 2 : 1) ? "text-primary" : ""}>Dentista</span>
            <span className={step >= (isAdmin ? 3 : 2) ? "text-primary" : ""}>Serviço</span>
            <span className={step >= (isAdmin ? 4 : 3) ? "text-primary" : ""}>Agenda</span>
            <span className={step >= (isAdmin ? 5 : 4) ? "text-primary" : ""}>Resumo</span>
          </div>
        </header>

        {/* Passo 1: Seleção de Paciente (Apenas Admin) */}
        {step === 1 && isAdmin && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
             <h2 className="text-3xl font-headline font-bold">Quem é o paciente?</h2>
            <Input 
              placeholder="Buscar paciente..." 
              className="h-12 rounded-xl"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              <Card 
                className={`cursor-pointer p-4 ${!targetPatient ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setTargetPatient(null)}
              >
                <p className="font-bold">Agendar para mim</p>
              </Card>
              {filteredPatients?.map((p) => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer p-4 ${targetPatient?.id === p.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setTargetPatient({ id: p.id, name: p.name })}
                >
                  <p className="font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </Card>
              ))}
            </div>
            <Button onClick={handleNext} className="ml-auto rounded-full px-10 h-12">Próximo</Button>
          </div>
        )}

        {/* Passo Dentista (Agora o primeiro para o paciente) */}
        {((step === 1 && !isAdmin) || (step === 2 && isAdmin)) && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-3xl font-headline font-bold">Com qual especialista?</h2>
            {isLoadingProfs ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {professionals?.map((p) => (
                  <Card 
                    key={p.id} 
                    className={`cursor-pointer border-2 ${selectedProfessional?.id === p.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
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
              {isAdmin && <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>}
              <Button disabled={!selectedProfessional} onClick={handleNext} className="ml-auto rounded-full px-10 h-12">Próximo</Button>
            </div>
          </div>
        )}

        {/* Passo Serviço */}
        {((step === 2 && !isAdmin) || (step === 3 && isAdmin)) && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-headline font-bold">Qual procedimento?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SERVICES.map((s) => (
                <Card 
                  key={s.id} 
                  className={`cursor-pointer border-2 ${selectedService?.id === s.id ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setSelectedService(s)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between">
                    <span className="text-xs font-bold"><Clock className="inline w-3 h-3" /> {s.duration} min</span>
                    <span className="text-lg font-bold text-primary">R$ {s.price}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full px-8">Voltar</Button>
              <Button disabled={!selectedService} onClick={handleNext} className="ml-auto rounded-full px-10 h-12">Próximo</Button>
            </div>
          </div>
        )}

        {/* Passo Agenda */}
        {((step === 3 && !isAdmin) || (step === 4 && isAdmin)) && (
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
                <p className="text-center font-bold">Horários disponíveis para {format(selectedDate, "dd/MM")}:</p>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {TIME_SLOTS.map(t => (
                    <Button 
                      key={t} 
                      variant={selectedTime === t ? "default" : "outline"} 
                      className="rounded-lg"
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
              <Button disabled={!selectedTime} onClick={handleNext} className="rounded-full px-10 h-12">Revisar</Button>
            </div>
          </div>
        )}

        {/* Resumo e Sucesso... (Mantido das versões anteriores estáveis) */}
        {((step === 4 && !isAdmin) || (step === 5 && isAdmin)) && (
          <div className="max-w-md mx-auto animate-in zoom-in">
            <Card className="border-2 border-primary shadow-2xl rounded-[2.5rem]">
              <CardHeader className="text-center bg-primary text-primary-foreground py-8">
                <CardTitle className="text-2xl font-headline">CONFIRMAÇÃO</CardTitle>
                {isAdmin && targetPatient && <p className="text-xs">Para: {targetPatient.name}</p>}
              </CardHeader>
              <CardContent className="space-y-6 pt-10">
                <div className="flex flex-col gap-4">
                  <p><strong>Especialista:</strong> {selectedProfessional?.name}</p>
                  <p><strong>Procedimento:</strong> {selectedService?.name}</p>
                  <p><strong>Data/Hora:</strong> {selectedDate && format(selectedDate, "dd/MM")} às {selectedTime}</p>
                </div>
                <div className="pt-6 border-t flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">R$ {selectedService?.price}</span>
                </div>
              </CardContent>
              <CardFooter className="p-10">
                <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="w-full h-14 rounded-full text-xl font-bold">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Agora"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {((step === 5 && !isAdmin) || (step === 6 && isAdmin)) && (
          <div className="text-center space-y-6 py-12 animate-in fade-in">
            <div className="mx-auto w-24 h-24 bg-accent text-white rounded-full flex items-center justify-center shadow-xl">
              <Check className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-headline font-bold text-primary">Pronto!</h2>
            <p className="text-muted-foreground">O agendamento foi realizado com sucesso.</p>
            <div className="flex justify-center gap-4 pt-8">
              <Button asChild className="rounded-full px-10 h-12">
                <Link href={authorityLevel >= 1 ? "/admin" : "/dashboard"}>Ver Minha Agenda</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
