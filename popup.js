// Default presets
const DEFAULT_PRESETS = [
  {
    id: 'example-preset',
    name: 'Example (Alpha → Local)',
    source: 'https://alpha.example.com',
    target: 'http://localhost:3000',
    noteUrl: '',
    cookieName: 'session'
  }
]

// State
let presets = []
let currentPresetId = null

// DOM Elements
const presetSelect = document.getElementById('preset-select')
const presetNameInput = document.getElementById('preset-name')
const sourceInput = document.getElementById('source-url')
const targetInput = document.getElementById('target-url')
const noteUrlInput = document.getElementById('note-url')
const cookieNameInput = document.getElementById('cookie-name')
const syncBtn = document.getElementById('sync-btn')
const savePresetBtn = document.getElementById('save-preset-btn')
const deletePresetBtn = document.getElementById('delete-preset-btn')
const statusEl = document.getElementById('status')
const gotoSourceBtn = document.getElementById('goto-source')
const gotoTargetBtn = document.getElementById('goto-target')
const gotoNoteBtn = document.getElementById('goto-note')

// Initialize
async function init() {
  await loadPresets()
  renderPresetOptions()

  // Load last used preset
  const { lastPresetId } = await chrome.storage.local.get('lastPresetId')
  if (lastPresetId && presets.find(p => p.id === lastPresetId)) {
    selectPreset(lastPresetId)
  } else if (presets.length > 0) {
    selectPreset(presets[0].id)
  }

  checkStatus()
}

async function loadPresets() {
  const { savedPresets } = await chrome.storage.local.get('savedPresets')
  presets = savedPresets || DEFAULT_PRESETS
}

async function savePresets() {
  await chrome.storage.local.set({ savedPresets: presets })
}

function renderPresetOptions() {
  presetSelect.innerHTML = presets.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('') + '<option value="__new__">+ New Preset...</option>'
}

function selectPreset(presetId) {
  if (presetId === '__new__') {
    // New preset mode
    currentPresetId = null
    presetNameInput.value = ''
    sourceInput.value = ''
    targetInput.value = ''
    noteUrlInput.value = ''
    cookieNameInput.value = 'session'
    deletePresetBtn.style.display = 'none'
    presetSelect.value = '__new__'
  } else {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      currentPresetId = preset.id
      presetNameInput.value = preset.name
      sourceInput.value = preset.source
      targetInput.value = preset.target
      noteUrlInput.value = preset.noteUrl || ''
      cookieNameInput.value = preset.cookieName
      deletePresetBtn.style.display = 'inline-block'
      presetSelect.value = presetId
      chrome.storage.local.set({ lastPresetId: presetId })
    }
  }
  checkStatus()
}

function generateId() {
  return 'preset-' + Date.now()
}

async function saveCurrentAsPreset() {
  const name = presetNameInput.value.trim()
  const source = sourceInput.value.trim()
  const target = targetInput.value.trim()
  const noteUrl = noteUrlInput.value.trim()
  const cookieName = cookieNameInput.value.trim()

  if (!name || !source || !target || !cookieName) {
    setStatus('請填寫所有必要欄位', 'error')
    return
  }

  if (currentPresetId) {
    // Update existing
    const preset = presets.find(p => p.id === currentPresetId)
    if (preset) {
      preset.name = name
      preset.source = source
      preset.target = target
      preset.noteUrl = noteUrl
      preset.cookieName = cookieName
    }
  } else {
    // Create new
    const newPreset = {
      id: generateId(),
      name,
      source,
      target,
      noteUrl,
      cookieName
    }
    presets.push(newPreset)
    currentPresetId = newPreset.id
  }

  await savePresets()
  renderPresetOptions()
  selectPreset(currentPresetId)
  setStatus('✅ Preset saved!', 'success')
}

async function deleteCurrentPreset() {
  if (!currentPresetId) return

  if (!confirm('Delete this preset?')) return

  presets = presets.filter(p => p.id !== currentPresetId)
  await savePresets()
  renderPresetOptions()

  if (presets.length > 0) {
    selectPreset(presets[0].id)
  } else {
    selectPreset('__new__')
  }
  setStatus('Preset deleted', 'info')
}

function setStatus(message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

async function syncCookie() {
  const source = sourceInput.value.trim()
  const target = targetInput.value.trim()
  const cookieName = cookieNameInput.value.trim()

  if (!source || !target || !cookieName) {
    setStatus('請填寫所有欄位', 'error')
    return
  }

  syncBtn.disabled = true
  setStatus('Syncing...', 'info')

  try {
    // 1. Read cookie from source
    const cookie = await chrome.cookies.get({
      url: source,
      name: cookieName
    })

    if (!cookie) {
      setStatus(`請先登入 ${new URL(source).hostname}`, 'error')
      syncBtn.disabled = false
      return
    }

    // 2. Determine if target is secure
    const isSecure = target.startsWith('https://')

    // 3. Write cookie to target
    await chrome.cookies.set({
      url: target,
      name: cookieName,
      value: cookie.value,
      path: '/',
      httpOnly: true,
      secure: isSecure,
      expirationDate: cookie.expirationDate
    })

    setStatus('✅ Cookie 已同步！', 'success')

  } catch (error) {
    console.error('Sync failed:', error)
    setStatus(`❌ Error: ${error.message}`, 'error')
  }

  syncBtn.disabled = false
}

async function checkStatus() {
  const source = sourceInput.value.trim()
  const target = targetInput.value.trim()
  const cookieName = cookieNameInput.value.trim()

  if (!source || !target || !cookieName) {
    setStatus('Configure URLs above', 'info')
    return
  }

  try {
    const sourceCookie = await chrome.cookies.get({
      url: source,
      name: cookieName
    })

    const targetCookie = await chrome.cookies.get({
      url: target,
      name: cookieName
    })

    if (!sourceCookie) {
      setStatus(`⚠️ ${new URL(source).hostname} 未登入`, 'warning')
    } else if (!targetCookie) {
      setStatus('Ready to sync', 'info')
    } else if (sourceCookie.value === targetCookie.value) {
      setStatus('✅ Already synced', 'success')
    } else {
      setStatus('🔄 Cookies differ, sync needed', 'warning')
    }
  } catch (e) {
    setStatus('Configure URLs above', 'info')
  }
}

// Navigation helpers
function openUrl(url) {
  if (url) {
    chrome.tabs.create({ url })
  }
}

// Event listeners
presetSelect.addEventListener('change', (e) => selectPreset(e.target.value))
syncBtn.addEventListener('click', syncCookie)
savePresetBtn.addEventListener('click', saveCurrentAsPreset)
deletePresetBtn.addEventListener('click', deleteCurrentPreset)
gotoSourceBtn.addEventListener('click', () => openUrl(sourceInput.value.trim()))
gotoTargetBtn.addEventListener('click', () => openUrl(targetInput.value.trim()))
gotoNoteBtn.addEventListener('click', () => openUrl(noteUrlInput.value.trim()))

// Debounced status check on input change
let statusTimeout
function debouncedCheckStatus() {
  clearTimeout(statusTimeout)
  statusTimeout = setTimeout(checkStatus, 500)
}
sourceInput.addEventListener('input', debouncedCheckStatus)
targetInput.addEventListener('input', debouncedCheckStatus)
cookieNameInput.addEventListener('input', debouncedCheckStatus)

// Initialize
init()
