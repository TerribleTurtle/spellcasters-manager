import fs from 'fs';
import path from 'path';

export class FileService {
  constructor() {}

  ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  readJson<T>(filePath: string): T {
    if (!this.exists(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  writeJson(filePath: string, data: any) {
    const dirPath = path.dirname(filePath);
    this.ensureDir(dirPath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  listFiles(dirPath: string, extension: string = '.json'): string[] {
    if (!this.exists(dirPath)) return [];
    return fs.readdirSync(dirPath).filter(f => f.endsWith(extension));
  }
}

export const fileService = new FileService();
