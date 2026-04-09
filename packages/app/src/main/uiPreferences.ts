import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import {
  normalizeThemeEditorState,
  type ThemeEditorStateV1,
  type ThemeSource,
} from '../renderer/theme/editorTypes.js'

interface UIConfigFile {
  themeSource?: unknown
  themeEditor?: unknown
}

const UI_CONFIG_PATH = join(homedir(), '.spool', 'ui.json')

export interface UIPreferences {
  themeSource: ThemeSource
  themeEditor: ThemeEditorStateV1 | null
}

function normalizeThemeSource(raw: unknown): ThemeSource {
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
}

function readUIConfig(): UIConfigFile {
  try {
    if (!existsSync(UI_CONFIG_PATH)) return {}
    return JSON.parse(readFileSync(UI_CONFIG_PATH, 'utf8')) as UIConfigFile
  } catch {
    return {}
  }
}

function writeUIConfig(config: UIConfigFile): void {
  mkdirSync(join(homedir(), '.spool'), { recursive: true })
  writeFileSync(UI_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8')
}

export function loadUIPreferences(): UIPreferences {
  const config = readUIConfig()
  return {
    themeSource: normalizeThemeSource(config.themeSource),
    themeEditor: normalizeThemeEditorState(config.themeEditor),
  }
}

export function saveThemeSource(themeSource: ThemeSource): void {
  const config = readUIConfig()
  writeUIConfig({ ...config, themeSource })
}

export function saveThemeEditor(themeEditor: ThemeEditorStateV1): void {
  const config = readUIConfig()
  writeUIConfig({ ...config, themeEditor })
}
