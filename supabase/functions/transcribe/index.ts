import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Serverska transkripcija glasa (Groq whisper-large-v3, srpski).
// Klijent šalje base64 audio; vraćamo { text }. Bez ključa → 501 sa jasnom
// porukom pa klijent sakrije mic dugme (tekst uvek radi).
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function extFor(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('ogg')) return 'ogg';
  return 'webm';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'STT not configured' }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { audio, mime } = await req.json();
    if (!audio || typeof audio !== 'string') {
      return new Response(
        JSON.stringify({ error: 'no audio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const type = typeof mime === 'string' && mime ? mime : 'audio/webm';
    const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));

    const form = new FormData();
    form.append('file', new Blob([bytes], { type }), `audio.${extFor(type)}`);
    form.append('model', 'whisper-large-v3');
    form.append('language', 'sr');
    form.append('response_format', 'json');

    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form,
    });

    const data = await r.json();
    if (!r.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message ?? 'STT error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ text: data.text ?? '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
