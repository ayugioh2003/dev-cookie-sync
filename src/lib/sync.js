export async function getCookie(url, cookieName) {
  return await chrome.cookies.get({ url, name: cookieName })
}

export async function setCookie(url, cookieName, value, expirationDate) {
  const isSecure = url.startsWith('https://')
  await chrome.cookies.set({
    url,
    name: cookieName,
    value,
    path: '/',
    httpOnly: true,
    secure: isSecure,
    expirationDate
  })
}

export async function syncCookieToTargets(source, targets, cookieName) {
  // Read cookie from source
  const cookie = await getCookie(source, cookieName)

  if (!cookie) {
    throw new Error(`NOT_LOGGED_IN:${new URL(source).hostname}`)
  }

  // Write cookie to all targets
  let successCount = 0
  for (const target of targets) {
    await setCookie(target, cookieName, cookie.value, cookie.expirationDate)
    successCount++
  }

  return successCount
}

export async function checkSyncStatus(source, targets, cookieName) {
  const sourceCookie = await getCookie(source, cookieName)

  if (!sourceCookie) {
    return {
      status: 'not_logged_in',
      hostname: new URL(source).hostname
    }
  }

  // Check all targets
  let syncedCount = 0
  let needSyncCount = 0

  for (const target of targets) {
    const targetCookie = await getCookie(target, cookieName)
    if (targetCookie && targetCookie.value === sourceCookie.value) {
      syncedCount++
    } else {
      needSyncCount++
    }
  }

  if (needSyncCount === 0) {
    return { status: 'synced', syncedCount }
  } else if (syncedCount === 0) {
    return { status: 'ready', total: targets.length }
  } else {
    return { status: 'partial', needSyncCount, total: targets.length }
  }
}
