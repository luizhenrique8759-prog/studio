'use server';
/**
 * @fileOverview AI agent to summarize clinical notes and suggest dental treatments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClinicalSummaryInputSchema = z.object({
  patientName: z.string(),
  dentistNotes: z.string().describe('Raw clinical notes from the dentist.'),
  previousHistory: z.string().optional().describe('Brief previous medical history if available.'),
});

const ClinicalSummaryOutputSchema = z.object({
  summary: z.string().describe('Professional clinical summary.'),
  suggestedTreatment: z.string().describe('Suggested next steps or treatments.'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('Perceived clinical risk.'),
});

export async function generateClinicalSummary(input: z.infer<typeof ClinicalSummaryInputSchema>) {
  return generateClinicalSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateClinicalSummaryPrompt',
  input: { schema: ClinicalSummaryInputSchema },
  output: { schema: ClinicalSummaryOutputSchema },
  prompt: `You are an expert dental assistant AI. 
Analyze the clinical notes for patient '{{{patientName}}}'.
Notes: {{{dentistNotes}}}
{{#if previousHistory}}Previous History: {{{previousHistory}}}{{/if}}

Please provide:
1. A structured professional summary of the current visit.
2. Suggested treatments or maintenance steps based on standard dental practices.
3. A risk assessment (Low, Medium, High).
Translate everything to Brazilian Portuguese (pt-BR).`,
});

const generateClinicalSummaryFlow = ai.defineFlow(
  {
    name: 'generateClinicalSummaryFlow',
    inputSchema: ClinicalSummaryInputSchema,
    outputSchema: ClinicalSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
