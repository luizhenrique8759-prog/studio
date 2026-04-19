'use server';
/**
 * @fileOverview An AI agent that generates a billing summary for a patient's services and appointments.
 *
 * - generateBillingSummary - A function that handles the billing summary generation process.
 * - GenerateBillingSummaryInput - The input type for the generateBillingSummary function.
 * - GenerateBillingSummaryOutput - The return type for the generateBillingSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PatientAppointmentSchema = z.object({
  appointmentId: z.string().describe('The unique identifier for the appointment.'),
  date: z.string().describe('The date of the appointment in YYYY-MM-DD format.'),
  serviceDescription: z.string().describe('A detailed description of the service provided during the appointment.'),
  cost: z.number().describe('The cost of the service provided during the appointment.'),
});

const GenerateBillingSummaryInputSchema = z.object({
  patientId: z.string().describe('The unique identifier for the patient.'),
  patientName: z.string().describe('The full name of the patient.'),
  appointments: z.array(PatientAppointmentSchema).describe('A list of the patient\'s appointments and associated services.'),
});
export type GenerateBillingSummaryInput = z.infer<typeof GenerateBillingSummaryInputSchema>;

const GenerateBillingSummaryOutputSchema = z.object({
  billingSummary: z.string().describe('A detailed, AI-generated summary of all services and their costs for the patient, suitable for an invoice.'),
  totalCost: z.number().describe('The total accumulated cost from all listed appointments and services.'),
});
export type GenerateBillingSummaryOutput = z.infer<typeof GenerateBillingSummaryOutputSchema>;

export async function generateBillingSummary(input: GenerateBillingSummaryInput): Promise<GenerateBillingSummaryOutput> {
  return generateBillingSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBillingSummaryPrompt',
  input: { schema: GenerateBillingSummaryInputSchema },
  output: { schema: GenerateBillingSummaryOutputSchema },
  prompt: `As an administrator, I need a detailed billing summary for patient '{{{patientName}}}' (ID: {{{patientId}}}).

Compile a comprehensive summary of all the following appointments and services, ensuring accuracy for invoicing purposes. The summary should clearly list each appointment, its date, a description of the service provided, and its individual cost. Finally, calculate the total accumulated cost for all services. Use Real (R$) for currency.

Appointments:
{{#each appointments}}
- Date: {{{this.date}}}, Service: {{{this.serviceDescription}}}, Cost: R$ {{{this.cost}}}
{{/each}}

Provide the billing summary in the 'billingSummary' field and the total cost in the 'totalCost' field.
`,
});

const generateBillingSummaryFlow = ai.defineFlow(
  {
    name: 'generateBillingSummaryFlow',
    inputSchema: GenerateBillingSummaryInputSchema,
    outputSchema: GenerateBillingSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
