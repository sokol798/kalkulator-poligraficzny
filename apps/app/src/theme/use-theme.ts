import { palette, type ThemeColors } from './tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAppStore } from '@/store/app-store';

/** Schemat kolorów z uwzględnieniem ustawienia motywu (biały / czarny / wg systemu). */
export function useAppColorScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const choice = useAppStore((s) => s.settings.theme);
  if (choice === 'light' || choice === 'dark') return choice;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): ThemeColors {
  return palette[useAppColorScheme()];
}
