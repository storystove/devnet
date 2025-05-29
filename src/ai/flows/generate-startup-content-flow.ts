
'use server';
/**
 * @fileOverview AI tool to generate "About", "Tech Stack", and "Tags" for a startup.
 *
 * - generateStartupContent - A function that generates content for a startup profile.
 * - GenerateStartupContentInput - The input type for the generateStartupContent function.
 * - GenerateStartupContentOutput - The return type for the generateStartupContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStartupContentInputSchema = z.object({
  startupName: z
    .string()
    .describe('The name of the startup for which to generate content.'),
  existingDescription: z
    .string()
    .optional()
    .describe('Any existing description or core idea of the startup, to provide context.'),
});

export type GenerateStartupContentInput = z.infer<typeof GenerateStartupContentInputSchema>;

const GenerateStartupContentOutputSchema = z.object({
  aboutSection: z.string().describe('A concise "About" section for the startup.'),
  techStack: z
    .array(z.string())
    .describe('A list of key technologies used by the startup.'),
  tags: z
    .array(z.string())
    .describe('A list of relevant tags for the startup.'),
});

export type GenerateStartupContentOutput = z.infer<typeof GenerateStartupContentOutputSchema>;

export async function generateStartupContent(input: GenerateStartupContentInput): Promise<GenerateStartupContentOutput> {
  return generateStartupContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStartupContentPrompt',
  input: {schema: GenerateStartupContentInputSchema},
  output: {schema: GenerateStartupContentOutputSchema},
  prompt: `You are an expert startup profile writer. Your task is to generate content for a startup named "{{startupName}}".

{{#if existingDescription}}
The startup has provided the following existing description or core idea:
"{{existingDescription}}"
Use this as additional context.
{{/if}}

Considering the startup is "{{startupName}}", and it is a collaborative platform for developers with features like:
- User Authentication (Firebase Auth, email/password, Google Sign-in)
- Customizable User Profiles (avatar, display name, bio, skills, preferred languages, external links, follower/following counts, joined startups)
- Social Feed (posts with text, images, hashtags, code snippets; liking, commenting, sharing)
- Topic-based Community Rooms (real-time messaging)
- Startup Showcase (details on name, logo, status, description, tech stack, co-founders; ability to comment, follow, or join startups)
- AI-powered Smart Tag Suggestions (using Genkit)

And its known technology stack includes: Next.js (App Router), React (Server Components, Hooks), TypeScript, Firebase (Auth, Firestore, Realtime Database), Tailwind CSS, ShadCN UI components, and Genkit (for AI features).

Generate the following:
1.  A compelling and concise "About" section (around 50-100 words).
2.  A list of 5-7 key "Tech Stack" items.
3.  A list of 5-7 relevant "Tags".

Return the output as a JSON object matching the defined output schema.
`,
});

const generateStartupContentFlow = ai.defineFlow(
  {
    name: 'generateStartupContentFlow',
    inputSchema: GenerateStartupContentInputSchema,
    outputSchema: GenerateStartupContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate startup content.");
    }
    return output;
  }
);
