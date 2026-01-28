// Default presets
export const DEFAULT_PRESETS = [
  {
    id: 'example-preset',
    name: 'Example (Alpha → Local)',
    source: 'https://alpha.example.com',
    targets: ['http://localhost:3000'],
    noteUrls: [],
    cookieName: 'session'
  }
]

export async function loadPresets() {
  const { savedPresets } = await chrome.storage.local.get('savedPresets')
  let presets = savedPresets || DEFAULT_PRESETS

  // Migration: convert old format to new format
  presets = presets.map(p => ({
    ...p,
    targets: p.targets || (p.target ? [p.target] : ['']),
    noteUrls: p.noteUrls || (p.noteUrl ? [p.noteUrl] : [])
  }))

  return presets
}

export async function savePresets(presets) {
  await chrome.storage.local.set({ savedPresets: presets })
}

export async function getLastPresetId() {
  const { lastPresetId } = await chrome.storage.local.get('lastPresetId')
  return lastPresetId
}

export async function setLastPresetId(presetId) {
  await chrome.storage.local.set({ lastPresetId: presetId })
}

export function generateId() {
  return 'preset-' + Date.now()
}
