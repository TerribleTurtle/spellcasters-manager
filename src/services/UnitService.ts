import { httpClient } from "@/lib/httpClient";
import { AppMode, Unit, UnitSchema } from "@/types";

export class UnitService {
  async getAll(mode: AppMode): Promise<string[]> {
    return httpClient.request<string[]>(`/api/list/units?mode=${mode}`);
  }

  async getById(filename: string, mode: AppMode): Promise<Unit> {
    const data = await httpClient.request<unknown>(`/api/data/units/${filename}?mode=${mode}`);
    // Runtime validation
    return UnitSchema.parse(data);
  }

  async save(filename: string, data: Unit, mode: AppMode): Promise<void> {
    // Validate before sending (optional but good practice)
    const validData = UnitSchema.parse(data);
    
    await httpClient.request(`/api/save/units/${filename}?mode=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData)
    });
  }
}

export const unitService = new UnitService();
