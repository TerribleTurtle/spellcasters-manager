import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitService } from '../../server/services/gitService';
import fs from 'fs';

// Mock simple-git
const mocks = vi.hoisted(() => ({
    status: vi.fn(),
    show: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
}));

vi.mock('simple-git', () => {
    return {
        simpleGit: () => mocks,
        SimpleGit: class {}
    };
});

// Mock fs to avoid disk reads
vi.mock('fs');
const mockedFs = vi.mocked(fs);

describe('GitService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getDiff detects changes', async () => {
        const service = new GitService('root');
        
        // Mock git status returning a modified json file
        mocks.status.mockResolvedValue({
            modified: ['data/units/test.json']
        } as any);

        // Mock disk content
        const diskContent = { id: 'u1', name: 'New Name', tier: 1 };
        mockedFs.existsSync.mockReturnValue(true);
        mockedFs.readFileSync.mockReturnValue(JSON.stringify(diskContent));

        // Mock HEAD content
        const headContent = { id: 'u1', name: 'Old Name', tier: 1 };
        mocks.show.mockResolvedValue(JSON.stringify(headContent));

        const changes = await service.getDiff('data');

        expect(changes).toHaveLength(1);
        expect(changes[0]).toEqual({
            target_id: 'u1',
            name: 'New Name',
            field: 'name',
            old: 'Old Name',
            new: 'New Name'
        });
    });

    it('commitPatch commits changes', async () => {
        const service = new GitService('root');
        const patch = { id: 'p1', version: '1.0', title: 'Test Patch' } as any;

        await service.commitPatch('data', patch, 'Test Commit');

        expect(mocks.add).toHaveBeenCalledWith('.');
        expect(mocks.commit).toHaveBeenCalledWith('Test Commit');
    });
});
