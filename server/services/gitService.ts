import { simpleGit, SimpleGit } from 'simple-git';
import deepDiff from 'deep-diff';
import path from 'path';
import fs from 'fs';
import { Change, Patch } from '../../src/domain/schemas/index.js';
import { logger } from '../utils/logger.js';

export class GitService {
  private git: SimpleGit;

  constructor(rootDir: string) {
    this.git = simpleGit(rootDir);
  }

  // Helper to get git instance for specific data dir root
  // In the original code, this was somewhat dynamic.
  // We'll keep it simple: assume the repo root is 2 levels up from dataDir (standard structure)
  private getGitForDataDir(dataDir: string): SimpleGit {
     const repoRoot = path.resolve(dataDir, '..');
     return simpleGit(repoRoot);
  }

  async getDiff(dataDir: string): Promise<Change[]> {
    const git = this.getGitForDataDir(dataDir);
    const repoRoot = path.resolve(dataDir, '..');

    try {
      const status = await git.status();
      // Filter for JSON files
      const modifiedFiles = status.modified.filter(f => f.endsWith('.json'));
      
      const changes: Change[] = [];

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
                    target_id: path.basename(file), // Use filename as ID for consistency
                    name: diskContent.name,
                    field: field,
                    old: d.lhs,
                    new: d.rhs
                  });
                }
              });
            }
        } catch (e: unknown) {
            logger.warn(`Could not show HEAD:${file}`, { error: e });
        }
      }
      return changes;
    } catch (err: unknown) {
      logger.error("Diff Error:", { error: err });
      return [];
    }
  }

  async commitPatch(dataDir: string, patch: Patch, message: string, filesToStage: string[]): Promise<void> {
     const git = this.getGitForDataDir(dataDir);
     const repoRoot = path.resolve(dataDir, '..');

     // Convert absolute paths to repo-relative paths for git add
     const relativePaths = filesToStage.map(f => 
         path.relative(repoRoot, f).replace(/\\/g, '/')
     );

     if (relativePaths.length > 0) {
         await git.add(relativePaths);
     }
     await git.commit(message, { '--allow-empty': null });
  }

  /**
   * Returns the staged diff (after `git add`, before `git commit`).
   * Used to capture a small diff string for patch entries.
   */
  async getStagedDiff(dataDir: string, filesToStage: string[]): Promise<string> {
     const git = this.getGitForDataDir(dataDir);
     const repoRoot = path.resolve(dataDir, '..');

     const relativePaths = filesToStage.map(f => 
         path.relative(repoRoot, f).replace(/\\/g, '/')
     );

     try {
         // Stage first so diff --cached works
         if (relativePaths.length > 0) {
             await git.add(relativePaths);
         }
         const diff = await git.diff(['--cached', '--stat', ...relativePaths]);
         return diff || '';
     } catch {
         return '';
     }
  }
}

export const gitService = new GitService('.');
