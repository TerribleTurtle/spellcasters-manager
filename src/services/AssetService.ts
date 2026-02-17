import { httpClient } from "@/lib/httpClient";
import { AppMode } from "@/types";

export class AssetService {
  async upload(file: File, targetFilename: string, mode: AppMode): Promise<{ success: boolean; filename: string }> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);

      return httpClient.request(`/api/assets/upload?mode=${mode}`, {
          method: 'POST',
          body: formData
      });
  }

  async list(mode: AppMode): Promise<string[]> {
      const response = await httpClient.request<{ assets: string[] }>(`/api/assets/list?mode=${mode}`);
      return response.assets;
  }
}

export const assetService = new AssetService();
