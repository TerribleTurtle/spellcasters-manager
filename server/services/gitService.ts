import { simpleGit, SimpleGit } from 'simple-git';
import deepDiff from 'deep-diff';
import path from 'path';
import fs from 'fs';
import { Change, Patch } from '../../src/types/index.js';

export class GitService {
  private git: SimpleGit;

  constructor(rootDir: string) {
    this.git = simpleGit(rootDir);
  }

  // Helper to get git instance for specific data dir root
  // In the original code, this was somewhat dynamic.
  // We'll keep it simple: assume the repo root is 2 levels up from dataDir (standard structure)
  private getGitForDataDir(dataDir: string): SimpleGit {
     const repoRoot = path.resolve(dataDir, '../..');
     return simpleGit(repoRoot);
  }

  async getDiff(dataDir: string): Promise<Change[]> {
    const git = this.getGitForDataDir(dataDir);
    const repoRoot = path.resolve(dataDir, '../..');

    try {
      const status = await git.status();
      // Filter for JSON files
      const modifiedFiles = status.modified.filter(f => f.endsWith('.json'));
      
      let changes: Change[] = [];

      for (const file of modifiedFiles) {
        // Current Content (Disk)
        const fullPath = path.join(repoRoot, file);
        if (!fs.existsSync(fullPath)) continue;
        
        const diskContent = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        
        // Previous Content (Git HEAD)
        // We need to catch error if file is new or verify it exists in HEAD
        try {
            const headContentRaw = await git.show([`HEAD:${file}`]);
            const headContent = JSON.parse(headContentRaw);

            // Diff
            const differences = deepDiff.diff(headContent, diskContent);
            
            if (differences) {
              differences.forEach(d => {
                const field = d.path ? d.path.join('.') : 'unknown';
                
                if (d.kind === 'E') { // Edit
                  changes.push({
                    target_id: diskContent.id,
                    name: diskContent.name,
                    field: field,
                    old: d.lhs,
                    new: d.rhs
                  });
                }
              });
            }
        } catch (e) {
            console.warn(`Could not show HEAD:${file}`, e);
        }
      }
      return changes;
    } catch (err) {
      console.error("Diff Error:", err);
      return [];
    }
  }

  async commitPatch(dataDir: string, patch: Patch, message: string): Promise<void> {
     const git = this.getGitForDataDir(dataDir);
     await git.add('.');
     await git.commit(message);
  }
}

// We export a factory or class, instance depends on root.
// For now, let's export the class.
