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
        
        const units = await dataService.getAll('units');
        
        expect(spy).toHaveBeenCalledWith('/api/list/units');
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

        const unit = await dataService.getById('units', 'unit1.json');

        expect(spy).toHaveBeenCalledWith('/api/data/units/unit1.json');
        expect(unit).toEqual(mockUnit);
    });

    it('getById throws on invalid schema', async () => {
        // DataService validation is optional. Inject a mock schema that throws.
        const mockSchema = {
            parse: vi.fn().mockImplementation(() => { throw new Error('Validation failed'); })
        } as unknown as z.ZodType<unknown>;

        const invalidUnit = { id: 'u1' }; 
        vi.spyOn(httpClient, 'request').mockResolvedValue(invalidUnit);

        await expect(dataService.getById('units', 'unit1.json', mockSchema)).rejects.toThrow('Validation failed');
    });

    it('save sends correct data', async () => {
        const mockUnit = {
            id: 'u1',
            name: 'Saved Unit',
            tier: 2,
            type: 'Unit'
        };
        const spy = vi.spyOn(httpClient, 'request').mockResolvedValue(undefined);

        await dataService.save('units', 'unit1.json', mockUnit);

        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining('/api/save/units/unit1.json'),
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
