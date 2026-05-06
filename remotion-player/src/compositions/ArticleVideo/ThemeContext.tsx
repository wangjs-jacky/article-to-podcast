import React from 'react'
import type { ThemeConfig } from './theme'
import { terminalNoir } from './theme'

export const ThemeContext = React.createContext<ThemeConfig>(terminalNoir)

export const useTheme = (): ThemeConfig => React.useContext(ThemeContext)
