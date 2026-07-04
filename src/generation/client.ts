import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { satireOutputSchema, type SatireOutput } from './article'

const MODEL = 'claude-opus-4-8'

/**
 * Builds the Anthropic client from whichever credential is available:
 *
 * - `ANTHROPIC_API_KEY` — a Console API key (`sk-ant-api…`), sent as x-api-key.
 * - `ANTHROPIC_AUTH_TOKEN` — an OAuth access token, sent as a Bearer token
 *   with the `oauth-2025-04-20` beta header the API requires for OAuth auth.
 * - An OAuth token (`sk-ant-oat…`) pasted into `ANTHROPIC_API_KEY` is
 *   detected and treated as a Bearer token instead of an API key.
 *
 * Either way the credential lives only in GitHub Actions secrets; nothing
 * here runs in the frontend.
 */
export function createGenerationClient(): Anthropic {
  // Generous retries: this runs in an unattended cron job, and the SDK's
  // backoff honors the API's retry-after header on 429/5xx.
  const maxRetries = 4
  const oauthOptions = {
    // Never send x-api-key alongside the Bearer token — the API rejects
    // requests carrying both headers.
    apiKey: null,
    defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
    maxRetries,
  }
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN
  if (authToken) {
    return new Anthropic({ ...oauthOptions, authToken })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey?.startsWith('sk-ant-oat')) {
    return new Anthropic({ ...oauthOptions, authToken: apiKey })
  }
  return new Anthropic({ maxRetries })
}

/**
 * Calls Claude with the Satire Skill as the system prompt and a topic prompt,
 * returning schema-validated structured output.
 */
export async function generateSatire(
  systemPrompt: string,
  topicPrompt: string,
  client: Anthropic = createGenerationClient()
): Promise<SatireOutput> {
  const response = await client.messages.parse({
    model: MODEL,
    // The declared max_tokens counts against the account's output-tokens-per-
    // minute cap when the request is admitted, so keep it within low-tier
    // rate limits. An article is ≤1000 words; 8k leaves room for thinking.
    max_tokens: 8000,
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
