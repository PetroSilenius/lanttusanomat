import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { satireOutputSchema, type SatireOutput } from './article'

const MODEL = 'claude-opus-4-8'

/**
 * Calls Claude with the Satire Skill as the system prompt and a topic prompt,
 * returning schema-validated structured output. The API key is read from
 * ANTHROPIC_API_KEY (GitHub Actions secret); nothing here runs in the
 * frontend.
 */
export async function generateSatire(
  systemPrompt: string,
  topicPrompt: string,
  client: Anthropic = new Anthropic()
): Promise<SatireOutput> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: systemPrompt,
    messages: [{ role: 'user', content: topicPrompt }],
    output_config: {
      format: zodOutputFormat(satireOutputSchema),
    },
  })

  if (response.stop_reason === 'refusal') {
    return {
      declined: true,
      headline: '',
      ingress: '',
      body: '',
      category: '',
      tags: [],
      seoDescription: '',
    }
  }

  if (!response.parsed_output) {
    throw new Error(`Model returned unparseable output (stop_reason: ${response.stop_reason})`)
  }
  return response.parsed_output
}
