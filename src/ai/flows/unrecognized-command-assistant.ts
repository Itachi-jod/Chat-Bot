'use server';

/**
 * @fileOverview Provides AI assistance for unrecognized commands.
 *
 * - unrecognizedCommandAssistance - A function that offers suggestions for unrecognized commands.
 * - UnrecognizedCommandAssistanceInput - The input type for the unrecognizedCommandAssistance function.
 * - UnrecognizedCommandAssistanceOutput - The return type for the unrecognizedCommandAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UnrecognizedCommandAssistanceInputSchema = z.object({
  command: z.string().describe('The unrecognized command entered by the user.'),
});
export type UnrecognizedCommandAssistanceInput = z.infer<typeof UnrecognizedCommandAssistanceInputSchema>;

const UnrecognizedCommandAssistanceOutputSchema = z.object({
  suggestion: z.string().describe('A helpful suggestion or tip for the user.'),
});
export type UnrecognizedCommandAssistanceOutput = z.infer<typeof UnrecognizedCommandAssistanceOutputSchema>;

export async function unrecognizedCommandAssistance(input: UnrecognizedCommandAssistanceInput): Promise<UnrecognizedCommandAssistanceOutput> {
  return unrecognizedCommandAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'unrecognizedCommandAssistancePrompt',
  input: {schema: UnrecognizedCommandAssistanceInputSchema},
  output: {schema: UnrecognizedCommandAssistanceOutputSchema},
  prompt: `The user entered an unrecognized command: "{{{command}}}". Provide a helpful suggestion or tip to the user. Be brief and to the point.`,
});

const unrecognizedCommandAssistanceFlow = ai.defineFlow(
  {
    name: 'unrecognizedCommandAssistanceFlow',
    inputSchema: UnrecognizedCommandAssistanceInputSchema,
    outputSchema: UnrecognizedCommandAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
