import type { Category } from './types'

type SeedCat = Omit<Category, 'userId'>

/** Podrazumevane kategorije (korisnik ih može menjati u Podešavanjima). */
export const SEED_CATEGORIES: SeedCat[] = [
  // ----- Troškovi -----
  { id: 'exp-hrana', name: 'Hrana i piće', type: 'expense', icon: 'Utensils', color: '#F59E0B', monthlyBudget: null, isActive: true, sort: 10 },
  { id: 'exp-izlasci', name: 'Izlasci i zabava', type: 'expense', icon: 'Wine', color: '#EC4899', monthlyBudget: null, isActive: true, sort: 20 },
  { id: 'exp-prevoz', name: 'Prevoz', type: 'expense', icon: 'Bus', color: '#3B82F6', monthlyBudget: null, isActive: true, sort: 30 },
  { id: 'exp-racuni', name: 'Računi i pretplate', type: 'expense', icon: 'Receipt', color: '#8B5CF6', monthlyBudget: null, isActive: true, sort: 40 },
  { id: 'exp-odeca', name: 'Odeća i obuća', type: 'expense', icon: 'Shirt', color: '#14B8A6', monthlyBudget: null, isActive: true, sort: 50 },
  { id: 'exp-zdravlje', name: 'Zdravlje i nega', type: 'expense', icon: 'HeartPulse', color: '#EF4444', monthlyBudget: null, isActive: true, sort: 60 },
  { id: 'exp-pokloni', name: 'Poklon i drugi', type: 'expense', icon: 'Gift', color: '#F97316', monthlyBudget: null, isActive: true, sort: 70 },
  { id: 'exp-ostalo', name: 'Ostalo', type: 'expense', icon: 'CircleEllipsis', color: '#64748B', monthlyBudget: null, isActive: true, sort: 80 },

  // ----- Prihodi: redovna primanja -----
  { id: 'inc-stipendija', name: 'Stipendija', type: 'income', incomeKind: 'fixed', icon: 'GraduationCap', color: '#4F46E5', isActive: true, sort: 110 },
  { id: 'inc-fiksno', name: 'Fiksna uplata', type: 'income', incomeKind: 'fixed', icon: 'Banknote', color: '#06B6D4', isActive: true, sort: 120 },

  // ----- Prihodi: zarada sa strane -----
  { id: 'inc-konoba', name: 'Konobarisanje', type: 'income', incomeKind: 'extra', icon: 'Coffee', color: '#16A34A', isActive: true, sort: 210 },
  { id: 'inc-poslovi', name: 'Sitni poslovi', type: 'income', incomeKind: 'extra', icon: 'Wrench', color: '#0EA5E9', isActive: true, sort: 220 },
  { id: 'inc-prodaja', name: 'Prodaja stvari', type: 'income', incomeKind: 'extra', icon: 'Tag', color: '#22C55E', isActive: true, sort: 230 },
  { id: 'inc-porodica', name: 'Poklon / od porodice', type: 'income', incomeKind: 'extra', icon: 'HeartHandshake', color: '#A855F7', isActive: true, sort: 240 },
]

export function seedCategoriesForUser(userId: string): Category[] {
  return SEED_CATEGORIES.map((c) => ({ ...c, userId }))
}
