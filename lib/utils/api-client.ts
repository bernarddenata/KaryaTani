const BASE_URL = ''

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

export async function apiFetch<T = any>(url: string, opts: ApiOptions = {}): Promise<{ success: boolean; data?: T; error?: any; meta?: any }> {
  const { method = 'GET', body, headers = {} } = opts

  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  return res.json()
}

export async function apiUpload(url: string, formData: FormData): Promise<any> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })
  return res.json()
}
