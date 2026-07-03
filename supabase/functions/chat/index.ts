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
        description: { type: 'string', description: 'Ostavi prazno. Ne postavljaj ovo polje.' },
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

    const systemPrompt = `Ti si finansijski asistent u aplikaciji Financely. Profesionalan, konkretan, kratak.

Danasnji datum: ${today}

Korisnikovi finansijski podaci:
${context}

Pravila:
- Govori srpski (latinica), profesionalno i kratko
- Bez emojia, bez suvislih reci, samo sustina
- Max 2-3 recenice po odgovoru
- Iznose prikazuj u dinarima (npr. "12.500 din")
- Odgovaraj ISKLJUCIVO na finansijska pitanja. Na sve ostalo odgovori "Mogu samo da ti pomognem oko finansija."
- Kada korisnik pominje potrosnju/kupovinu/zaradu, pozovi add_transaction. NE POSTAVLJAJ description polje — ostavi ga prazno. Kategoriju biraj iz liste; ako nista ne odgovara, koristi "exp-ostalo" za troskove
- Za svaku transakciju napisi kratku potvrdu (npr. "Dodajem 200 din u Hrana.")
- Za relativne datume ("juce", "prekjuce") izracunaj tacan datum
- Kada korisnik trazi predlog budzeta, pozovi suggest_budgets sa realnim iznosima
- Ne izmisljaj podatke koje nemas
- Budi direktan — ako korisnik preteruje sa trosenjem, reci mu to bez okolisanja`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
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
