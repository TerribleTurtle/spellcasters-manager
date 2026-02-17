import { resolveEntityTarget } from './resolveEntityTarget';
import { BaseEntity } from '@/types';

describe('resolveEntityTarget', () => {
    const mockRegistry: Record<string, BaseEntity[]> = {
        'units': [
            { id: 'unit_1', _filename: 'unit_1.json', name: 'Soldier', category: 'units' },
            { id: 'unit_2', _filename: 'unit_2.json', name: 'Archer', category: 'units' }
        ],
        'heroes': [
            { id: 'hero_1', _filename: 'hero_1.json', name: 'Paladin', category: 'heroes' }
        ]
    };

    it('should resolve by direct filename match', () => {
        const result = resolveEntityTarget('unit_1.json', mockRegistry);
        expect(result).toEqual({ filename: 'unit_1.json', category: 'units' });
    });

    it('should resolve by filename match without extension', () => {
        const result = resolveEntityTarget('unit_1', mockRegistry);
        expect(result).toEqual({ filename: 'unit_1.json', category: 'units' });
    });

    it('should resolve by id match', () => {
        const result = resolveEntityTarget('unit_2', mockRegistry);
        expect(result).toEqual({ filename: 'unit_2.json', category: 'units' });
    });

    it('should resolve by name match', () => {
        const result = resolveEntityTarget('Paladin', mockRegistry);
        expect(result).toEqual({ filename: 'hero_1.json', category: 'heroes' });
    });

    it('should return null if not found', () => {
        const result = resolveEntityTarget('unknown_entity', mockRegistry);
        expect(result).toBeNull();
    });

    it('should return null for empty input', () => {
        const result = resolveEntityTarget('', mockRegistry);
        expect(result).toBeNull();
    });
});
