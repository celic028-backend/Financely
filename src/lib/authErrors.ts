/** Prevod Supabase auth grešaka na srpski. */
export function srAuthError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Pogrešan email ili lozinka.'
  if (m.includes('user already registered')) return 'Nalog sa ovim emailom već postoji.'
  if (m.includes('email not confirmed')) return 'Potvrdi email pre prijave — proveri inbox.'
  if (m.includes('password should be at least')) return 'Lozinka mora imati bar 6 karaktera.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Previše pokušaja — sačekaj minut pa probaj ponovo.'
  if (m.includes('invalid email') || m.includes('unable to validate email'))
    return 'Email adresa nije ispravna.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Nema veze sa serverom — proveri internet.'
  return 'Nešto nije u redu. Pokušaj ponovo.'
}
