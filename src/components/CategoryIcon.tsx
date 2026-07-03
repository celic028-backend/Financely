import {
  Utensils,
  Wine,
  Bus,
  Receipt,
  Shirt,
  HeartPulse,
  Gift,
  CircleEllipsis,
  GraduationCap,
  Banknote,
  Coffee,
  Wrench,
  Tag,
  HeartHandshake,
  Car,
  Home,
  ShoppingCart,
  Dumbbell,
  Wallet,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  Utensils,
  Wine,
  Bus,
  Receipt,
  Shirt,
  HeartPulse,
  Gift,
  CircleEllipsis,
  GraduationCap,
  Banknote,
  Coffee,
  Wrench,
  Tag,
  HeartHandshake,
  Car,
  Home,
  ShoppingCart,
  Dumbbell,
  Wallet,
  Briefcase,
}

/** Sve dostupne ikonice za biranje pri kreiranju kategorije. */
export const ICON_NAMES = Object.keys(MAP)

export function CategoryIcon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: string
  className?: string
  strokeWidth?: number
}) {
  const Icon = MAP[name] ?? CircleEllipsis
  return <Icon className={className} strokeWidth={strokeWidth} />
}
