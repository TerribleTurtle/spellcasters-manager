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
}

export const assetService = new AssetService();
