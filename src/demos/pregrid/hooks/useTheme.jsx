import { useLiveQuery } from 'dexie-react-hooks'
import { db, setSetting } from '../db.js'

export function useTheme() {
  const theme = useLiveQuery(
    () => db.settings.get('theme').then(row => row?.value || 'dark'),
    [],
    'dark',
  )

  const setTheme = (t) => setSetting('theme', t)
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return { theme, setTheme, toggle }
}
