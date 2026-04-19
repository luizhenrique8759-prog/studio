
export type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
};

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  imageUrl?: string;
};

export type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
};

export const SERVICES: Service[] = [
  { id: '1', name: 'Limpeza Dental', description: 'Remoção de tártaro e polimento.', price: 150, duration: 45 },
  { id: '2', name: 'Consulta de Rotina', description: 'Avaliação geral da saúde bucal.', price: 100, duration: 30 },
  { id: '3', name: 'Clareamento Dental', description: 'Procedimento estético para dentes mais brancos.', price: 800, duration: 60 },
  { id: '4', name: 'Restauração', description: 'Tratamento de cáries e reparos estéticos.', price: 250, duration: 60 },
  { id: '5', name: 'Extração', description: 'Remoção cirúrgica de elemento dentário.', price: 200, duration: 45 },
];

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export const PROFESSIONALS: Professional[] = [];
export const MOCK_APPOINTMENTS: Appointment[] = [];
