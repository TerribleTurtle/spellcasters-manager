
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadAsset, listAssets } from '../../server/controllers/assetController';
import { Response } from 'express';
import { createMockRequest, MockRequest } from '../helpers/mockRequest';
import fs from 'fs';

vi.mock('fs');

describe('AssetController', () => {
    let mockReq: MockRequest;
    let mockRes: Partial<Response>;
    let jsonSpy: any;
    let statusSpy: any;
    let sendSpy: any;
    let nextSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonSpy = vi.fn();
        sendSpy = vi.fn();
        nextSpy = vi.fn();
        statusSpy = vi.fn().mockReturnValue({ send: sendSpy, json: jsonSpy });
        
        mockRes = {
            json: jsonSpy,
            status: statusSpy,
            send: sendSpy,
        } as unknown as Response;

        mockReq = createMockRequest({
            body: {},
            context: { dataDir: 'root/data', assetsDir: 'root/assets', mode: 'dev' },
            file: {
                path: 'temp/upload.png',
                filename: 'upload.png',
                destination: 'temp',
                fieldname: 'file',
                mimetype: 'image/png',
                size: 100,
                originalname: 'upload.png',
                buffer: Buffer.from(''),
                stream: null as any,
                encoding: '7bit'
            }
        });
    });

    describe('uploadAsset', () => {
        it('rejects if no file uploaded', () => {
            mockReq.file = undefined;
            uploadAsset(mockReq, mockRes as Response, nextSpy);
            expect(nextSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'No file uploaded.' }));
        });

        it('moves uploaded file to assets dir', () => {
            mockReq.body = { targetFilename: 'hero.png' };
            (fs.existsSync as any).mockReturnValue(true);

            uploadAsset(mockReq, mockRes as Response, nextSpy);

            expect(fs.renameSync).toHaveBeenCalledWith(
                'temp/upload.png', 
                expect.stringMatching(/root[/\\]assets[/\\]hero\.png/)
            );
            expect(jsonSpy).toHaveBeenCalledWith({ success: true, filename: 'hero.png' });
        });

        it('sanitizes malicious filenames', () => {
            mockReq.body = { targetFilename: '../../hack.exe' };
            (fs.existsSync as any).mockReturnValue(true);

            uploadAsset(mockReq, mockRes as Response, nextSpy);

            // path.basename('../../hack.exe') -> 'hack.exe'
            expect(fs.renameSync).toHaveBeenCalledWith(
                'temp/upload.png',
                expect.stringMatching(/root[/\\]assets[/\\]hack\.exe/)
            );
        });

        it('creates assets dir if missing', () => {
            mockReq.body = { targetFilename: 'hero.png' };
            (fs.existsSync as any).mockReturnValue(false);

            uploadAsset(mockReq, mockRes as Response, nextSpy);

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringMatching(/root[/\\]assets/), 
                { recursive: true }
            );
        });
    });

    describe('listAssets', () => {
        it('returns filtered image files', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readdirSync as any).mockReturnValue(['a.png', 'b.txt', 'c.JPG']);

            listAssets(mockReq, mockRes as Response);

            expect(jsonSpy).toHaveBeenCalledWith({ assets: ['a.png', 'c.JPG'] });
        });
        
        it('returns empty if dir missing', () => {
            (fs.existsSync as any).mockReturnValue(false);
            listAssets(mockReq, mockRes as Response);
            expect(jsonSpy).toHaveBeenCalledWith({ assets: [] });
        });
    });
});
