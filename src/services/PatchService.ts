import { httpClient } from "@/lib/httpClient";
import { Patch, Change } from "@/types";

export class PatchService {
  async getQueue(): Promise<Change[]> {
      return httpClient.request<Change[]>(`/api/patches/queue`);
  }

  async addToQueue(change: Change): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ change })
      });
  }

  async updateQueueItem(index: number, change: Change): Promise<{ success: boolean }> {
      return httpClient.request(`/api/patches/queue`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index, change })
      });
  }

  async removeFromQueue(index: number): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index })
      });
  }

  async bulkRemoveFromQueue(indices: number[]): Promise<{ success: boolean; queueLength: number }> {
      return httpClient.request(`/api/patches/queue/bulk`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ indices })
      });
  }

  async quickCommit(payload: { change: Change; tags: string[]; version?: string }): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/quick-commit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }

  async commit(payload: { title: string; version: string; type: string; tags: string[]; changes?: Change[] }): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/commit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
  }

  async rollback(patchId: string): Promise<{ success: boolean; patch: Patch }> {
      return httpClient.request(`/api/patches/${patchId}/rollback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getHistory(filters?: { tag?: string; entity?: string; flat?: boolean; from?: string; to?: string }): Promise<Patch[] | any[]> {
      const query = new URLSearchParams();
      if (filters?.tag) query.append('tag', filters.tag);
      if (filters?.entity) query.append('entity', filters.entity);
      if (filters?.flat) query.append('flat', 'true');
      if (filters?.from) query.append('from', filters.from);
      if (filters?.to) query.append('to', filters.to);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return httpClient.request<Patch[] | any[]>(`/api/patches/history${query.toString() ? '?' + query.toString() : ''}`);
  }
}

export const patchService = new PatchService();
