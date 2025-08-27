'use server';

/**
 * @fileOverview A flow for asking questions to the Gemini model.
 *
 * - askGeminiFlow - A function that takes a question and returns an answer from Gemini.
 * - AskGeminiInput - The input type for the askGeminiFlow function.
 * - AskGeminiOutput - The return type for the askGeminiFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskGeminiInputSchema = z.object({
  question: z.string().describe('The question to ask the AI.'),
});
export type AskGeminiInput = z.infer<typeof AskGeminiInputSchema>;

const AskGeminiOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI.'),
});
export type AskGeminiOutput = z.infer<typeof AskGeminiOutputSchema>;

export async function askGemini(input: AskGeminiInput): Promise<AskGeminiOutput> {
  return askGeminiFlow(input);
}

const prompt = ai.definePrompt({
  name: 'askGeminiPrompt',
  input: {schema: AskGeminiInputSchema},
  output: {schema: AskGeminiOutputSchema},
  prompt: `You are a helpful AI assistant. Answer the user's question.

Question: {{{question}}}`,
});

const askGeminiFlow = ai.defineFlow(
  {
    name: 'askGeminiFlow',
    inputSchema: AskGeminiInputSchema,
    outputSchema: AskGeminiOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
