import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompilationService } from '@/services/compilationService.js';
import type { DemoPortalClient } from '@/api/demoPortalClient.js';
import type { DeveloperEndpointClient } from '@/api/developerEndpointClient.js';
import type { CredentialsService } from '@/services/credentialsService.js';
import type { ConfigurationService } from '@/services/configurationService.js';

describe('CompilationService', () => {
  let compilationService: CompilationService;
  let mockDemoPortalClient: DemoPortalClient;
  let mockDevEndpointClient: DeveloperEndpointClient;
  let mockCredentialsService: CredentialsService;
  let mockConfigService: ConfigurationService;

  beforeEach(() => {
    // Create mocks
    mockDemoPortalClient = {} as DemoPortalClient;
    mockDevEndpointClient = {} as DeveloperEndpointClient;
    mockCredentialsService = {
      getDeveloperEndpointAuth: vi.fn(),
      invalidateDeveloperEndpointAuth: vi.fn()
    } as unknown as CredentialsService;
    mockConfigService = {
      get: vi.fn().mockReturnValue('default')
    } as unknown as ConfigurationService;

    compilationService = new CompilationService(
      mockDemoPortalClient,
      mockDevEndpointClient,
      mockCredentialsService,
      mockConfigService
    );
  });

  describe('isTestApp detection', () => {
    it('should detect test app by name containing "Test"', () => {
      const appJson = {
        name: 'Continia Banking - Base App - Test Suite',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should detect test app by name containing "test" (case insensitive)', () => {
      const appJson = {
        name: 'My test application',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should detect test app by ID range [94999..95999]', () => {
      const appJson = {
        name: 'Regular App',
        idRanges: [{ from: 94999, to: 95999 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should detect test app by test dependencies', () => {
      const appJson = {
        name: 'Regular App',
        idRanges: [{ from: 50000, to: 60000 }],
        dependencies: [
          { name: 'Library Assert', publisher: 'Microsoft' },
          { name: 'Test Runner', publisher: 'Microsoft' }
        ]
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should detect test app by multiple test library dependencies', () => {
      const appJson = {
        name: 'Regular App',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: [
          { name: 'Tests-TestLibraries', publisher: 'Microsoft' },
          { name: 'System Application Test Library', publisher: 'Microsoft' },
          { name: 'Library Variable Storage', publisher: 'Microsoft' }
        ]
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should NOT detect regular app as test app', () => {
      const appJson = {
        name: 'Continia Banking',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: [
          { name: 'Base Application', publisher: 'Microsoft' },
          { name: 'System Application', publisher: 'Microsoft' }
        ]
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(false);
    });

    it('should NOT detect app with "Contest" in name as test app', () => {
      const appJson = {
        name: 'Contest Management',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(false);
    });

    it('should handle missing optional fields gracefully', () => {
      const appJson = {
        name: 'Regular App'
        // No idRanges or dependencies
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(false);
    });

    it('should detect mock apps as test apps', () => {
      const appJson = {
        name: 'Mock Service Provider',
        idRanges: [{ from: 1000, to: 2000 }],
        dependencies: []
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });

    it('should detect test app with customer range and test dependencies', () => {
      const appJson = {
        name: 'Customer App',
        idRanges: [{ from: 50000, to: 99999 }],
        dependencies: [
          { name: 'Library Assert', publisher: 'Microsoft' }
        ]
      };

      // @ts-ignore - Accessing private method for testing
      expect(compilationService.isTestApp(appJson)).toBe(true);
    });
  });
});