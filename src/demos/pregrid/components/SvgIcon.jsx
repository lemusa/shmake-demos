import {
  Shield, Flag, BookOpen, Zap, Camera, Clipboard, Users, Check, Plus,
  ChevronLeft, ChevronRight, Calendar, MapPin, Settings, Pencil, Trash2,
  Gauge, Home, Car,
} from 'lucide-react'
import { CUSTOM_ICON_PATHS } from '../data/icons.js'

const LUCIDE_MAP = {
  shield: Shield,
  flag: Flag,
  book: BookOpen,
  zap: Zap,
  camera: Camera,
  clipboard: Clipboard,
  users: Users,
  check: Check,
  plus: Plus,
  'chev-left': ChevronLeft,
  'chev-right': ChevronRight,
  calendar: Calendar,
  'map-pin': MapPin,
  settings: Settings,
  pencil: Pencil,
  trash: Trash2,
  gauge: Gauge,
  home: Home,
  car: Car,
}

export default function SvgIcon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }) {
  const LucideIcon = LUCIDE_MAP[name]
  if (LucideIcon) {
    return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />
  }

  const paths = CUSTOM_ICON_PATHS[name]
  if (paths) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
    )
  }

  // Fallback: render a simple circle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  )
}
