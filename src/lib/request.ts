import { ResponseError } from './error';

/**
 * Make a POST request
 */
export async function post<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });

  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('POST', path, resp.status, resp.statusText, body);
  }

  return (await resp.json()) as R;
}

/**
 * Make a PUT request
 */
export async function put<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });

  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('POST', path, resp.status, resp.statusText, body);
  }

  return (await resp.json()) as R;
}

export function errorResponse(errors: Record<string, string>, status?: number) {
  return {
    status: status ?? 400,
    body: {
      errors
    }
  };
}
