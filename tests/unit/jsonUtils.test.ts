
import { describe, it, expect } from 'vitest';
import { sortKeys } from '../../server/utils/jsonUtils.js';

describe('jsonUtils', () => {
    describe('sortKeys', () => {
        it('should sort keys alphabetically by default', () => {
            const input = { c: 3, a: 1, b: 2 };
            const sorted = sortKeys(input) as Record<string, number>;
            expect(Object.keys(sorted)).toEqual(['a', 'b', 'c']);
        });

        it('should place priority keys at the top', () => {
            const input = { name: 'Test', id: '123', $schema: 'schema', z: 1 };
            const sorted = sortKeys(input) as Record<string, unknown>;
            expect(Object.keys(sorted)).toEqual(['$schema', 'id', 'name', 'z']);
        });

        it('should place metadata keys at the bottom', () => {
            const input = { a: 1, last_modified: 'date', b: 2 };
            const sorted = sortKeys(input) as Record<string, unknown>;
            expect(Object.keys(sorted)).toEqual(['a', 'b', 'last_modified']);
        });

        it('should handle nested objects', () => {
            const input = {
                data: { c: 3, a: 1 },
                meta: { last_modified: 'now', id: '1' }
            };
            const sorted = sortKeys(input) as Record<string, any>;
            expect(Object.keys(sorted.data)).toEqual(['a', 'c']);
            expect(Object.keys(sorted.meta)).toEqual(['id', 'last_modified']);
        });

        it('should handle arrays of objects', () => {
            const input = [
                { c: 3, a: 1 },
                { z: 9, id: '2' }
            ];
            const sorted = sortKeys(input) as Record<string, any>[];
            expect(Object.keys(sorted[0])).toEqual(['a', 'c']);
            expect(Object.keys(sorted[1])).toEqual(['id', 'z']);
        });

        it('should handle null/undefined', () => {
            expect(sortKeys(null)).toBeNull();
            expect(sortKeys(undefined)).toBeUndefined();
        });
    });
});
