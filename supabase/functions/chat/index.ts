import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOOLS = [
  {
    name: 'add_transaction',
    description:
      'Zabeleži transakciju kada korisnik kaže da je nešto potrošio, kupio, platio ili zaradio. Pozovi za svaku pomenutu transakciju.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        amount: { type: 'integer', description: 'Iznos u dinarima, pozitivan ceo broj' },
        type: { type: 'string', enum: ['expense', 'income'] },
        category_id: { type: 'string', description: 'ID kategorije iz liste u kontekstu' },
        description: { type: 'string', description: 'Kratak opis (opciono)' },
        occurred_on: { type: 'string', description: 'Datum YYYY-MM-DD (opciono, danas ako se ne pominje)' },
      },
      required: ['amount', 'type', 'category_id'],
    },
  },
  {
    name: 'suggest_budgets',
    description:
      'Predloži mesečne budžete po kategorijama kada korisnik traži pomoć oko budžeta ili limita.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              category_id: { type: 'string' },
              monthly_budget: { type: 'integer' },
            },
            required: ['category_id', 'monthly_budget'],
          },
        },
      },
      required: ['suggestions'],
    },
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json();
    const context: string = body.context ?? '';
    // Podrži i staru formu {message} i novu {messages: [...]}
    const messages: { role: string; content: string }[] = Array.isArray(body.messages)
      ? body.messages
      : [{ role: 'user', content: String(body.message ?? '') }];

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `Ti si "Sve" — Financely AI asistent. Pametan, iskren i realan finansijski savetnik za mlade ljude u Srbiji.

Današnji datum: ${today}

Korisnikovi finansijski podaci:
${context}

Pravila:
- Govori srpski (latinica), opušteno ali stručno
- Budi iskren — ako korisnik preteruje sa trošenjem, reci mu direktno ali sa podrškom
- Daj konkretne savete sa brojevima (ne generičke)
- Iznose uvek prikazuj u dinarima (npr. "12.500 din")
- Budi kratak — max 3-4 rečenice osim ako korisnik traži detaljnije
- Kada korisnik pominje da je nešto potrošio/platio/kupio/zaradio, pozovi add_transaction (za SVAKU pomenutu transakciju posebno). Uz alat uvek napiši i kratku potvrdu u tekstu. Aplikacija traži potvrdu od korisnika pre upisa.
- Za relativne datume ("juče", "prekjuče") izračunaj tačan datum od današnjeg
- Kada korisnik traži predlog budžeta, pozovi suggest_budgets sa realnim iznosima na osnovu potrošnje
- Ne izmišljaj podatke koje nemaš`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools: TOOLS,
        tool_choice: { type: 'auto' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'Claude API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const textParts: string[] = [];
    const actions: { tool: string; input: unknown }[] = [];
    for (const block of data.content ?? []) {
      if (block.type === 'text') textParts.push(block.text);
      else if (block.type === 'tool_use') actions.push({ tool: block.name, input: block.input });
    }

    return new Response(
      JSON.stringify({ reply: textParts.join('\n').trim(), actions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
