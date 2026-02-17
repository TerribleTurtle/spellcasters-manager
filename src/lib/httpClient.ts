export class HttpError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
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
       let errorBody: any = null;
       try {
         const text = await res.text();
         try {
             errorBody = JSON.parse(text);
             errorMessage = errorBody.error || errorMessage;
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
