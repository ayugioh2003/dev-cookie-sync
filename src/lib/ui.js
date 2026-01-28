export function renderPresetOptions(selectEl, presets) {
  selectEl.innerHTML = presets.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('') + '<option value="__new__">+ New Preset...</option>'
}

export function renderUrlList(container, urls, type, { onInput, onRemove }) {
  container.innerHTML = urls.map((url, index) => `
    <div class="url-item" data-index="${index}">
      <input type="url" class="form-input ${type}-input" value="${escapeHtml(url)}"
             placeholder="${type === 'target' ? 'http://localhost:3000' : 'https://login.example.com'}">
      <button type="button" class="btn-goto" title="Open URL">↗</button>
      <button type="button" class="btn-remove" title="Remove">×</button>
    </div>
  `).join('')

  // Add event listeners
  container.querySelectorAll('.url-item').forEach((item, index) => {
    const input = item.querySelector('.form-input')
    const gotoBtn = item.querySelector('.btn-goto')
    const removeBtn = item.querySelector('.btn-remove')

    input.addEventListener('input', (e) => {
      onInput(index, e.target.value)
    })

    gotoBtn.addEventListener('click', () => {
      const url = input.value.trim()
      if (url) chrome.tabs.create({ url })
    })

    removeBtn.addEventListener('click', () => {
      onRemove(index)
    })
  })
}

export function setStatus(statusEl, message, type = 'info') {
  statusEl.textContent = message
  statusEl.className = `status ${type}`
}

export function openUrl(url) {
  if (url) {
    chrome.tabs.create({ url })
  }
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
