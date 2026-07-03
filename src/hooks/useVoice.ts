import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Glasovni unos preko servera (radi i na iPhone-u, za razliku od Web Speech).
 * Snima MediaRecorder-om → šalje audio na `transcribe` edge funkciju
 * (Groq whisper, sr) → vraća tekst. Bez podrške ili bez ključa na serveru,
 * `supported=false` pa se mic dugme ne prikazuje — tekst uvek radi.
 */
export interface UseVoice {
  supported: boolean
  recording: boolean
  transcribing: boolean
  start: () => void
  stop: () => void
}

function hasSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  )
}

function preferredMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m } catch { /* skip */ }
  }
  return ''
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const res = reader.result as string
      resolve(res.slice(res.indexOf(',') + 1)) // skini "data:...;base64," prefiks
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function useVoice(onText: (text: string) => void): UseVoice {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [disabled, setDisabled] = useState(false) // server nije podešen (nema ključa)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stream.getTracks().forEach((t) => t.stop())
      } catch {
        /* ignoriši */
      }
    }
  }, [])

  const start = useCallback(async () => {
    if (recRef.current || disabled) return
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return // korisnik odbio pristup mikrofonu
    }
    const mime = preferredMime()
    const rec = mime
      ? new MediaRecorder(stream, { mimeType: mime })
      : new MediaRecorder(stream)
    const actualMime = rec.mimeType || mime || 'audio/mp4'
    chunksRef.current = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data)
    }
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop())
      recRef.current = null
      setRecording(false)
      const blob = new Blob(chunksRef.current, { type: actualMime })
      if (blob.size < 1200) return // presnimljeno prekratko
      setTranscribing(true)
      try {
        const audio = await blobToBase64(blob)
        const { data, error } = await supabase.functions.invoke('transcribe', {
          body: { audio, mime: blob.type },
        })
        const errMsg = String((data as { error?: string })?.error ?? error?.message ?? '')
        if (errMsg) {
          if (errMsg.includes('not configured')) setDisabled(true)
          return
        }
        const text = String((data as { text?: string })?.text ?? '').trim()
        if (text) onTextRef.current(text)
      } catch {
        /* mreža pala — tiho */
      } finally {
        setTranscribing(false)
      }
    }
    recRef.current = rec
    setRecording(true)
    rec.start()
  }, [disabled])

  const stop = useCallback(() => {
    recRef.current?.stop()
  }, [])

  return { supported: hasSupport() && !disabled, recording, transcribing, start, stop }
}
