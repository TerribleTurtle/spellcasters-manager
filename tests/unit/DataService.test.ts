import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataService } from '@/services/DataService';
import { httpClient } from '@/lib/httpClient';

describe('DataService', () => {
    let dataService: DataService;

    beforeEach(() => {
        vi.restoreAllMocks();
        // Instantiate fresh service for each test to ensure empty cache
        dataService = new DataService();
    });

    it('getAll fetches units correctly', async () => {
        const mockData = ['unit1.json', 'unit2.json'];
        const spy = vi.spyOn(httpClient, 'request').mockResolvedValue(mockData);
        
        const units = await dataService.getAll('units', 'dev');
        
        expect(spy).toHaveBeenCalledWith('/api/list/units?mode=dev');
        expect(units).toEqual(mockData);
    });

    it('getById fetches and validates a unit', async () => {
        const mockUnit = {
            id: 'u1',
            name: 'Test Unit',
            tier: 1,
            health: 100,
            damage: 10,
            type: 'Unit'
        };
        const spy = vi.spyOn(httpClient, 'request').mockResolvedValue(mockUnit);

        const unit = await dataService.getById('units', 'unit1.json', 'dev');

        expect(spy).toHaveBeenCalledWith('/api/data/units/unit1.json?mode=dev');
        expect(unit).toEqual(mockUnit);
    });

    it('getById throws on invalid schema', async () => {
        // DataService validation is optional. Inject a mock schema that throws.
        const mockSchema = {
            parse: vi.fn().mockImplementation(() => { throw new Error('Validation failed'); })
        };

        const invalidUnit = { id: 'u1' }; 
        // @ts-ignore
        vi.spyOn(httpClient, 'request').mockResolvedValue(invalidUnit);

        // @ts-ignore
        await expect(dataService.getById('units', 'unit1.json', 'dev', mockSchema)).rejects.toThrow('Validation failed');
    });

    it('save sends correct data', async () => {
        const mockUnit = {
            id: 'u1',
            name: 'Saved Unit',
            tier: 2,
            type: 'Unit'
        };
        const spy = vi.spyOn(httpClient, 'request').mockResolvedValue(undefined);

        // @ts-ignore
        await dataService.save('units', 'unit1.json', mockUnit, 'dev');

        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining('/api/save/units/unit1.json?mode=dev'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.any(String)
          })
        );
        
        // Verify body content independently of key order
        const callArgs = spy.mock.calls[0];
        const requestInit = callArgs[1] as RequestInit;
        const bodyObj = JSON.parse(requestInit.body as string);
        expect(bodyObj).toEqual(mockUnit);
    });
});
