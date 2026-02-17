import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

export class FileService {


  /**
   * Ensures that the directory exists. If not, creates it recursively.
   * @param dirPath Absolute path to the directory
   */
  async ensureDir(dirPath: string) {
    try {
      await fsPromises.access(dirPath);
    } catch {
      await fsPromises.mkdir(dirPath, { recursive: true });
    }
  }

  ensureDirSync(dirPath: string) {
      if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
      }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  existsSync(filePath: string): boolean {
      return fs.existsSync(filePath);
  }

  /**
   * Reads a JSON file and parses it (Async).
   * @param filePath Absolute path to the file
   * @returns Parsed JSON object of type T
   * @throws Error if file does not exist
   */
  async readJson<T>(filePath: string): Promise<T> {
    if (!(await this.exists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Reads a JSON file and parses it (Sync).
   * Used for boot-time validation.
   */
  readJsonSync<T>(filePath: string): T {
    if (!this.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Writes data to a JSON file. Creates parent directories if needed.
   * @param filePath Absolute path to the file
   * @param data Data to write (will be stringified with 2-space indentation)
   */
  async writeJson(filePath: string, data: unknown) {
    const dirPath = path.dirname(filePath);
    await this.ensureDir(dirPath);
    
    // Atomic Write Strategy: Write to .tmp then rename
    const tempPath = `${filePath}.${Date.now()}.tmp`;
    
    try {
        await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2));
        await fsPromises.rename(tempPath, filePath);
    } catch (e) {
        // Clean up temp file on failure
        try {
            await fsPromises.unlink(tempPath);
        } catch { /* ignore */ }
        throw e;
    }
  }

  async deleteFile(filePath: string) {
    if (await this.exists(filePath)) {
      await fsPromises.unlink(filePath);
    }
  }

  /**
   * Lists files in a directory filtering by extension.
   * @param dirPath Absolute path to the directory
   * @param extensions Array of extensions to include (default: ['.json'])
   * @returns Array of filenames
   */
  async listFiles(dirPath: string, extensions: string[] = ['.json']): Promise<string[]> {
    if (!(await this.exists(dirPath))) return [];
    const files = await fsPromises.readdir(dirPath);
    return files.filter(f => extensions.some(ext => f.endsWith(ext)));
  }

  /**
   * Lists subdirectories in a directory, excluding hidden and system directories.
   * @param dirPath Absolute path to the directory
   * @param exclude Array of directory names to exclude
   * @returns Array of directory names
   */
  async listDirectories(dirPath: string, exclude: string[] = []): Promise<string[]> {
    if (!(await this.exists(dirPath))) return [];
    const entries = await fsPromises.readdir(dirPath);
    const results: string[] = [];
    for (const entry of entries) {
      if (entry.startsWith('.') || exclude.includes(entry)) continue;
      const stat = await fsPromises.stat(path.join(dirPath, entry));
      if (stat.isDirectory()) results.push(entry);
    }
    return results;
  }

  listFilesSync(dirPath: string, extensions: string[] = ['.json']): string[] {
      if (!this.existsSync(dirPath)) return [];
      return fs.readdirSync(dirPath).filter(f => extensions.some(ext => f.endsWith(ext)));
  }
}

export const fileService = new FileService();
