
import { Request } from 'express';
import { AppMode } from '../../src/types';

export interface MockContext {
  mode: AppMode;
  dataDir: string;
}

export type MockRequest = Request & {
  context: MockContext;
}

export const createMockRequest = (overrides: Partial<Request> & { context: MockContext }) => {
  return overrides as MockRequest;
}
