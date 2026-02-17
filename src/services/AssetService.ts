import { httpClient } from "@/lib/httpClient";


export class AssetService {
  async upload(file: File, targetFilename: string): Promise<{ success: boolean; filename: string }> {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);

      return httpClient.request(`/api/assets/upload`, {
          method: 'POST',
          body: formData
      });
  }

  async list(): Promise<string[]> {
      const response = await httpClient.request<{ assets: string[] }>(`/api/assets/list`);
      return response.assets;
  }
}

export const assetService = new AssetService();
