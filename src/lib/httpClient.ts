export class HttpClient {
  public async request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type");
    
    if (!res.ok) {
       // Try to get error message from JSON/Text
       let errorMessage = res.statusText;
       try {
         const errorBody = await res.json();
         errorMessage = errorBody.error || errorMessage;
       } catch (e) { /* ignore */ }
       throw new Error(errorMessage);
    }

    if (contentType && contentType.indexOf("application/json") !== -1) {
      return res.json() as Promise<T>;
    }
    
    // Fallback for non-JSON (if any)
    return res.text() as unknown as Promise<T>;
  }
}

export const httpClient = new HttpClient();
