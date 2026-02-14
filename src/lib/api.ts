import { AppMode, Unit, Patch, Change } from "@/types";

class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
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

  // Health
  async getHealth(mode: AppMode): Promise<{ status: string; dataDir: string; mode: string; liveAvailable?: boolean }> {
    return this.request(`/api/health?mode=${mode}`);
  }

  // Units
  async getUnits(mode: AppMode): Promise<string[]> {
    return this.request(`/api/list/units?mode=${mode}`);
  }

  async getUnit(filename: string, mode: AppMode): Promise<Unit> {
    return this.request(`/api/data/units/${filename}?mode=${mode}`);
  }

  async saveUnit(filename: string, data: Unit, mode: AppMode): Promise<void> {
    await this.request(`/api/save/units/${filename}?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
  }

  // Patches
  async getDraftPatches(mode: AppMode): Promise<Change[]> {
      return this.request(`/api/patches/draft?mode=${mode}`);
  }

  async commitPatch(mode: AppMode, payload: { title: string; version: string; type: string }): Promise<{ success: boolean; patch: Patch }> {
      return this.request(`/api/patches/commit?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }

  // Assets
  async uploadAsset(file: File, targetFilename: string, mode: AppMode): Promise<{ success: boolean; filename: string }> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);

      return this.request(`/api/assets/upload?mode=${mode}`, {
          method: 'POST',
          body: formData
      });
  }
}

export const api = new ApiClient();
