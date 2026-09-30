function csrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken(),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null)
    throw new Error(message ?? `Request failed (${response.status})`)
  }

  return (await response.json()) as T
}

export function getJson<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' })
}

export function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}
