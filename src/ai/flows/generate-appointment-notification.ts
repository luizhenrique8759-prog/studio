'use server';
/**
 * @fileOverview This file contains a Genkit flow for generating personalized appointment confirmation and reminder messages.
 *
 * - generateAppointmentNotification - A function that handles the generation of personalized messages.
 * - GenerateAppointmentNotificationInput - The input type for the generateAppointmentNotification function.
 * - GenerateAppointmentNotificationOutput - The return type for the generateAppointmentNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAppointmentNotificationInputSchema = z.object({
  patientName: z.string().describe('The full name of the patient.'),
  appointmentDate: z.string().describe('The date of the appointment (e.g., "25 de Dezembro de 2024").'),
  appointmentTime: z.string().describe('The time of the appointment (e.g., "10:30 AM").'),
  service: z.string().describe('The type of dental service (e.g., "Limpeza Dental", "Consulta de Rotina").'),
  dentistName: z.string().describe('The full name of the dentist.'),
  clinicName: z.string().describe('The name of the dental clinic.'),
  clinicPhone: z.string().describe('The contact phone number of the clinic.'),
  clinicAddress: z.string().describe('The full address of the clinic.'),
  messageType: z.enum(['confirmation', 'reminder']).describe('The type of message to generate: "confirmation" for immediate booking, or "reminder" for an upcoming appointment.'),
});
export type GenerateAppointmentNotificationInput = z.infer<typeof GenerateAppointmentNotificationInputSchema>;

const GenerateAppointmentNotificationOutputSchema = z.object({
  message: z.string().describe('The generated personalized appointment message.'),
});
export type GenerateAppointmentNotificationOutput = z.infer<typeof GenerateAppointmentNotificationOutputSchema>;

export async function generateAppointmentNotification(input: GenerateAppointmentNotificationInput): Promise<GenerateAppointmentNotificationOutput> {
  return generateAppointmentNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAppointmentNotificationPrompt',
  input: {schema: GenerateAppointmentNotificationInputSchema},
  output: {schema: GenerateAppointmentNotificationOutputSchema},
  prompt: `You are an AI assistant for a dental clinic named "{{{clinicName}}}". Your task is to generate clear, engaging, and personalized appointment messages for patients.

Based on the 'messageType' provided, generate either a confirmation message or a reminder message.

--- If messageType is 'confirmation':

Compose a friendly confirmation message for an appointment. It should thank the patient, confirm the details, provide clinic contact information, and express anticipation for their visit.

--- If messageType is 'reminder':

Compose a friendly reminder message for an upcoming appointment. It should gently remind the patient of their appointment, reconfirm the details, provide clinic contact information, and mention the importance of good oral health.

--- Common Guidelines for both message types:

- Start with a warm greeting to the patient.
- Clearly state the patient's name, appointment date, time, and the service scheduled.
- Mention the dentist's name.
- Include the clinic's name, phone number, and address.
- Keep the tone professional yet friendly and caring.
- Ensure all provided details are accurately incorporated.

Patient Name: {{{patientName}}}
Appointment Date: {{{appointmentDate}}}
Appointment Time: {{{appointmentTime}}}
Service: {{{service}}}
Dentist: {{{dentistName}}}
Clinic Name: {{{clinicName}}}
Clinic Phone: {{{clinicPhone}}}
Clinic Address: {{{clinicAddress}}}`,
});

const generateAppointmentNotificationFlow = ai.defineFlow(
  {
    name: 'generateAppointmentNotificationFlow',
    inputSchema: GenerateAppointmentNotificationInputSchema,
    outputSchema: GenerateAppointmentNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
