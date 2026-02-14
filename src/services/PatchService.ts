import { httpClient } from "@/lib/httpClient";
import { AppMode, Patch, Change } from "@/types";

export class PatchService {
  async getDraft(mode: AppMode): Promise<Change[]> {
      return httpClient.request<Change[]>(`/api/patches/draft?mode=${mode}`);
  }

  async commit(mode: AppMode, payload: { title: string; version: string; type: string }): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/commit?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }
}

export const patchService = new PatchService();
