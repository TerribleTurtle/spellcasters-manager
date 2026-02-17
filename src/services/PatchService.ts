import { httpClient } from "@/lib/httpClient";
import { AppMode, Patch, Change } from "@/types";

export class PatchService {
  async getQueue(mode: AppMode): Promise<Change[]> {
      return httpClient.request<Change[]>(`/api/patches/queue?mode=${mode}`);
  }

  async addToQueue(mode: AppMode, change: Change): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ change })
      });
  }

  async updateQueueItem(mode: AppMode, index: number, change: Change): Promise<{ success: boolean }> {
      return httpClient.request(`/api/patches/queue?mode=${mode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index, change })
      });
  }

  async removeFromQueue(mode: AppMode, index: number): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue?mode=${mode}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index })
      });
  }

  async bulkRemoveFromQueue(mode: AppMode, indices: number[]): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue/bulk?mode=${mode}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indices })
      });
  }

  async quickCommit(mode: AppMode, payload: { change: Change; tags: string[]; version?: string }): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/quick-commit?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }

  async commit(mode: AppMode, payload: { title: string; version: string; type: string; tags: string[]; changes?: Change[] }): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/commit?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }

  async rollback(mode: AppMode, patchId: string): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/${patchId}/rollback?mode=${mode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getHistory(mode: AppMode, filters?: { tag?: string; entity?: string; flat?: boolean; from?: string; to?: string }): Promise<Patch[] | any[]> {
      const query = new URLSearchParams({ mode });
      if (filters?.tag) query.append('tag', filters.tag);
      if (filters?.entity) query.append('entity', filters.entity);
      if (filters?.flat) query.append('flat', 'true');
      if (filters?.from) query.append('from', filters.from);
      if (filters?.to) query.append('to', filters.to);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return httpClient.request<Patch[] | any[]>(`/api/patches/history?${query.toString()}`);
  }
}

export const patchService = new PatchService();
