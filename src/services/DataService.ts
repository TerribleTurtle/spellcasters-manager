import { httpClient } from "@/lib/httpClient";
import { AppMode } from "@/types";
import { z } from "zod";
import { stripInternalFields } from "@/domain/utils";
import { HttpError } from "@/lib/httpClient";

export interface FieldError {
    path: string;
    message: string;
}

export class ValidationError extends Error {
    fields: FieldError[];
    constructor(message: string, fields: FieldError[]) {
        super(message);
        this.name = "ValidationError";
        this.fields = fields;
    }
}

export class DataService {
  private cache: Map<string, unknown> = new Map();

  /**
   * Retrieves a list of filenames for a given category.
   * @param category Entity category (e.g., 'heroes', 'units')
   * @param mode App mode ('dev' or 'live') to determine data source
   * @returns Promise<string[]> Array of filenames
   */
  async getAll(category: string, mode: AppMode): Promise<string[]> {
    const cacheKey = `list-${category}-${mode}`;
    if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) as string[];
    }
    
    // API V2 Endpoint structure: /api/list/:category
    const data = await httpClient.request<string[]>(`/api/list/${category}?mode=${mode}`);
    this.cache.set(cacheKey, data);
    return data;
  }

  async getBulk<T>(category: string, mode: AppMode): Promise<T[]> {
      return httpClient.request<T[]>(`/api/bulk/${category}?mode=${mode}`);
  }

  async getById<T>(category: string, filename: string, mode: AppMode, schema?: z.ZodType<T>): Promise<T> {
    const cacheKey = `data-${category}-${filename}-${mode}`;
    if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) as T;
    }

    const data = await httpClient.request<unknown>(`/api/data/${category}/${filename}?mode=${mode}`);
    
    // Optional Runtime validation
    let parsedData = data as T;
    if (schema) {
        parsedData = schema.parse(data);
    }

    this.cache.set(cacheKey, parsedData);
    return parsedData;
  }

  /**
   * Saves an entity to the file system.
   * @param category Entity category
   * @param filename Filename including extension
   * @param data Entity data
   * @param mode App mode
   * @param queue If true, adds the change to the patch queue
   * @param schema Optional Zod schema for validation before saving
   */
  async save<T>(category: string, filename: string, data: T, mode: AppMode, queue?: boolean, schema?: z.ZodType<T>): Promise<void> {
    // Validate
    let validData = data;
    if (schema) {
        validData = schema.parse(data);
    }
    
    const query = new URLSearchParams({ mode });
    if (queue) query.append('queue', 'true');

    // Sanitize data (remove internal _ properties)
    const sanitizedData = stripInternalFields(validData);

    try {
        await httpClient.request(`/api/save/${category}/${filename}?${query.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sanitizedData)
        });
    } catch (e) {
        if (e instanceof HttpError && e.status === 400 && e.body?.fields) {
            throw new ValidationError("Validation Failed", e.body.fields);
        }
        throw e;
    }

    // Invalidate cache
    this.cache.delete(`list-${category}-${mode}`);
    this.cache.delete(`data-${category}-${filename}-${mode}`);
  }

  /**
   * Saves multiple entities in a single batch request.
   * @param category Entity category
   * @param updates Array of { filename, data } objects
   * @param mode App mode
   * @param queue If true, adds changes to the patch queue
   */
  async saveBatch<T>(category: string, updates: { filename: string; data: T }[], mode: AppMode, queue?: boolean): Promise<void> {
      const query = new URLSearchParams({ mode });
      if (queue) query.append('queue', 'true');

      const sanitizedUpdates = updates.map(u => ({
          ...u,
          data: stripInternalFields(u.data)
      }));

      await httpClient.request(`/api/save/${category}/batch?${query.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanitizedUpdates)
      });

      // Invalidate cache for the whole list and specific items
      this.cache.delete(`list-${category}-${mode}`);
      updates.forEach(u => {
          this.cache.delete(`data-${category}-${u.filename}-${mode}`);
      });
  }

  async delete(category: string, filename: string, mode: AppMode): Promise<void> {

      await httpClient.request(`/api/data/${category}/${filename}?mode=${mode}`, {
          method: 'DELETE'
      });

      // Invalidate cache
      this.cache.delete(`list-${category}-${mode}`);
      this.cache.delete(`data-${category}-${filename}-${mode}`);
  }

  async resetDevData(): Promise<{ success: boolean; error?: string; details?: string }> {
      try {
          await httpClient.request<{ success: boolean; message: string; details?: string; error?: string }>('/api/admin/reset', {
              method: 'POST'
          });
          // Clear all cache
          this.cache.clear();
          return { success: true };
      } catch (err: unknown) {
          // Check if it's our structured error
          const error = err as { message: string; details?: string; error?: string };
          if (error.details) {
              return { success: false, error: error.error || error.message, details: error.details };
          }
          return { success: false, error: error.message };
      }
  }
}

/**
 * Helper to recursively strip internal fields (keys starting with '_').
 * This ensures UI-specific state doesn't leak into persistent storage.
 * @param obj The object to sanitize
 */


export const dataService = new DataService();
