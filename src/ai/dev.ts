import { config } from 'dotenv';
config();

import '@/ai/flows/generate-billing-summary.ts';
import '@/ai/flows/generate-appointment-notification.ts';
import '@/ai/flows/generate-clinical-summary.ts';
