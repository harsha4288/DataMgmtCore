export { defaultTheme } from './default';
export { darkTheme } from './dark';
export { gitaTheme } from './gita';
export { professionalTheme } from './professional';

import { ThemeConfiguration, ThemeName } from '../types';
import { defaultTheme } from './default';
import { darkTheme } from './dark';
import { gitaTheme } from './gita';
import { professionalTheme } from './professional';

export const themes: Record<ThemeName, ThemeConfiguration> = {
  default: defaultTheme,
  dark: darkTheme,
  gita: gitaTheme,
  professional: professionalTheme,
};

export const availableThemes: ThemeName[] = ['default', 'dark', 'gita', 'professional'];
