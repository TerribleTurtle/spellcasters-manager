export class HttpError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
      super(message);
      this.name = 'HttpError';
      this.status = status;
      this.body = body;
  }
}

export class HttpClient {
  public async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    if (!res.ok) {
       let errorMessage = res.statusText;
       let errorBody: unknown = null;
       try {
         const text = await res.text();
         try {
              errorBody = JSON.parse(text);
              errorMessage = (typeof errorBody === 'object' && errorBody !== null && 'error' in errorBody ? String((errorBody as Record<string, unknown>).error) : undefined) || errorMessage;
         } catch {
             errorMessage = text || errorMessage;
         }
       } catch { /* ignore */ }
       
       throw new HttpError(errorMessage, res.status, errorBody);
    }

    if (contentType && contentType.indexOf("application/json") !== -1) {
      return res.json() as Promise<T>;
    }
    
    return res.text() as unknown as Promise<T>;
  }
}

export const httpClient = new HttpClient();
