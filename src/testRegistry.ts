import { ALTestCodeunit, ALFileScanner } from './alFileScanner.js';
import { Logger } from './logger.js';
import * as path from 'path';

/**
 * Represents cached test information for a workspace
 */
export interface WorkspaceTestCache {
  workspacePath: string;
  lastScanTime: Date;
  testCodeunits: ALTestCodeunit[];
  totalTests: number;
  totalCodeunits: number;
}

/**
 * Registry for managing discovered tests with caching
 */
export class TestRegistry {
  private cache: Map<string, WorkspaceTestCache> = new Map();
  private scanner: ALFileScanner;
  private logger: Logger;
  private cacheExpirationMs: number = 5 * 60 * 1000; // 5 minutes default

  constructor(logger: Logger) {
    this.logger = logger;
    this.scanner = new ALFileScanner(logger);
  }

  /**
   * Sets the cache expiration time
   * @param ms Milliseconds before cache expires
   */
  setCacheExpiration(ms: number): void {
    this.cacheExpirationMs = ms;
  }

  /**
   * Gets test codeunits for a workspace, using cache if available
   * @param workspacePath The workspace path
   * @param forceRefresh If true, bypasses cache
   * @returns Array of test codeunits
   */
  async getTestCodeunits(workspacePath: string, forceRefresh: boolean = false): Promise<ALTestCodeunit[]> {
    const normalizedPath = path.normalize(workspacePath);

    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(normalizedPath);

      if (cached && this.isCacheValid(cached)) {
        this.logger.info(`Using cached test data for ${normalizedPath} (${cached.totalCodeunits} codeunits, ${cached.totalTests} tests)`);
        return cached.testCodeunits;
      }
    }

    // Scan workspace for tests
    this.logger.info(`Scanning workspace for tests: ${normalizedPath}`);
    const testCodeunits = await this.scanner.scanWorkspaceForTestCodeunits(normalizedPath);

    // Calculate totals
    const totalTests = testCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0);

    // Update cache
    const cacheEntry: WorkspaceTestCache = {
      workspacePath: normalizedPath,
      lastScanTime: new Date(),
      testCodeunits: testCodeunits,
      totalTests: totalTests,
      totalCodeunits: testCodeunits.length
    };

    this.cache.set(normalizedPath, cacheEntry);

    this.logger.info(`Cached test data: ${testCodeunits.length} codeunits with ${totalTests} tests`);

    return testCodeunits;
  }

  /**
   * Gets a specific test codeunit by ID
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID
   * @returns The test codeunit or null if not found
   */
  async getTestCodeunitById(workspacePath: string, codeunitId: number): Promise<ALTestCodeunit | null> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    return testCodeunits.find(tc => tc.file.object.id === codeunitId) || null;
  }

  /**
   * Gets a specific test method
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID
   * @param methodName The test method name
   * @returns True if the test exists
   */
  async hasTestMethod(workspacePath: string, codeunitId: number, methodName: string): Promise<boolean> {
    const codeunit = await this.getTestCodeunitById(workspacePath, codeunitId);

    if (!codeunit) {
      return false;
    }

    return codeunit.testMethods.some(tm => tm.name === methodName);
  }

  /**
   * Gets all test codeunit IDs
   * @param workspacePath The workspace path
   * @returns Array of codeunit IDs
   */
  async getAllTestCodeunitIds(workspacePath: string): Promise<number[]> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    return testCodeunits.map(tc => tc.file.object.id);
  }

  /**
   * Searches for test codeunits by name
   * @param workspacePath The workspace path
   * @param searchTerm The search term (partial match)
   * @returns Matching test codeunits
   */
  async searchTestCodeunitsByName(workspacePath: string, searchTerm: string): Promise<ALTestCodeunit[]> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);
    const lowerSearch = searchTerm.toLowerCase();

    return testCodeunits.filter(tc =>
      tc.file.object.name.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Gets test statistics for a workspace
   * @param workspacePath The workspace path
   * @returns Test statistics
   */
  async getTestStatistics(workspacePath: string): Promise<{
    totalCodeunits: number;
    totalTests: number;
    codeunitIds: number[];
    largestCodeunit: { id: number; name: string; testCount: number } | null;
  }> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);

    const totalTests = testCodeunits.reduce((sum, tc) => sum + tc.testMethods.length, 0);

    // Find the codeunit with the most tests
    let largestCodeunit = null;
    if (testCodeunits.length > 0) {
      const largest = testCodeunits.reduce((prev, current) =>
        current.testMethods.length > prev.testMethods.length ? current : prev
      );

      largestCodeunit = {
        id: largest.file.object.id,
        name: largest.file.object.name,
        testCount: largest.testMethods.length
      };
    }

    return {
      totalCodeunits: testCodeunits.length,
      totalTests: totalTests,
      codeunitIds: testCodeunits.map(tc => tc.file.object.id),
      largestCodeunit: largestCodeunit
    };
  }

  /**
   * Creates a formatted test inventory
   * @param workspacePath The workspace path
   * @returns Formatted test inventory string
   */
  async createTestInventory(workspacePath: string): Promise<string> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);

    if (testCodeunits.length === 0) {
      return 'No test codeunits found in workspace';
    }

    let inventory = `Test Inventory for ${workspacePath}\n`;
    inventory += `${'='.repeat(60)}\n\n`;

    // Statistics
    const stats = await this.getTestStatistics(workspacePath);
    inventory += `Total Codeunits: ${stats.totalCodeunits}\n`;
    inventory += `Total Test Methods: ${stats.totalTests}\n`;

    if (stats.largestCodeunit) {
      inventory += `Largest Codeunit: ${stats.largestCodeunit.name} (${stats.largestCodeunit.testCount} tests)\n`;
    }

    inventory += `\nCodeunits:\n${'─'.repeat(40)}\n`;

    // List each codeunit
    for (const tc of testCodeunits) {
      inventory += `\n📁 Codeunit ${tc.file.object.id} "${tc.file.object.name}"\n`;
      inventory += `   Path: ${tc.file.path}\n`;
      inventory += `   Tests: ${tc.testMethods.length}\n`;

      if (tc.testMethods.length > 0) {
        inventory += `   Methods:\n`;
        for (const method of tc.testMethods) {
          inventory += `     • ${method.name} (line ${method.lineNumber})\n`;
        }
      }
    }

    // Cache info
    const cached = this.cache.get(path.normalize(workspacePath));
    if (cached) {
      inventory += `\n${'─'.repeat(40)}\n`;
      inventory += `Cache Status: Valid\n`;
      inventory += `Last Scan: ${cached.lastScanTime.toISOString()}\n`;
      inventory += `Cache Expires: ${new Date(cached.lastScanTime.getTime() + this.cacheExpirationMs).toISOString()}\n`;
    }

    return inventory;
  }

  /**
   * Clears the cache for a specific workspace
   * @param workspacePath The workspace path
   */
  clearCache(workspacePath?: string): void {
    if (workspacePath) {
      const normalizedPath = path.normalize(workspacePath);
      this.cache.delete(normalizedPath);
      this.logger.info(`Cleared cache for ${normalizedPath}`);
    } else {
      this.cache.clear();
      this.logger.info('Cleared all test registry cache');
    }
  }

  /**
   * Checks if cache is valid (not expired)
   * @param cache The cache entry to check
   * @returns True if cache is still valid
   */
  private isCacheValid(cache: WorkspaceTestCache): boolean {
    const now = Date.now();
    const cacheTime = cache.lastScanTime.getTime();
    const isValid = (now - cacheTime) < this.cacheExpirationMs;

    if (!isValid) {
      this.logger.debug(`Cache expired for ${cache.workspacePath}`);
    }

    return isValid;
  }

  /**
   * Validates if test parameters match discovered tests
   * @param workspacePath The workspace path
   * @param codeunitId Optional codeunit ID to validate
   * @param testMethod Optional test method name to validate
   * @returns Validation result with details
   */
  async validateTestParameters(
    workspacePath: string,
    codeunitId?: number,
    testMethod?: string
  ): Promise<{
    valid: boolean;
    message: string;
    availableCodeunits?: number[];
    availableMethods?: string[];
  }> {
    const testCodeunits = await this.getTestCodeunits(workspacePath);

    // No filters - always valid
    if (!codeunitId && !testMethod) {
      return {
        valid: true,
        message: 'No filters specified - will run all tests',
        availableCodeunits: testCodeunits.map(tc => tc.file.object.id)
      };
    }

    // Validate codeunit ID if specified
    if (codeunitId) {
      const codeunit = testCodeunits.find(tc => tc.file.object.id === codeunitId);

      if (!codeunit) {
        return {
          valid: false,
          message: `Codeunit ${codeunitId} not found in workspace`,
          availableCodeunits: testCodeunits.map(tc => tc.file.object.id)
        };
      }

      // Validate test method if specified
      if (testMethod) {
        const method = codeunit.testMethods.find(tm => tm.name === testMethod);

        if (!method) {
          return {
            valid: false,
            message: `Test method "${testMethod}" not found in codeunit ${codeunitId}`,
            availableMethods: codeunit.testMethods.map(tm => tm.name)
          };
        }

        return {
          valid: true,
          message: `Found test method "${testMethod}" in codeunit ${codeunitId} "${codeunit.file.object.name}"`
        };
      }

      return {
        valid: true,
        message: `Found codeunit ${codeunitId} "${codeunit.file.object.name}" with ${codeunit.testMethods.length} tests`,
        availableMethods: codeunit.testMethods.map(tm => tm.name)
      };
    }

    // Test method specified without codeunit - search all codeunits
    if (testMethod) {
      const foundIn: { codeunitId: number; codeunitName: string }[] = [];

      for (const tc of testCodeunits) {
        const hasMethod = tc.testMethods.some(tm => tm.name === testMethod);
        if (hasMethod) {
          foundIn.push({
            codeunitId: tc.file.object.id,
            codeunitName: tc.file.object.name
          });
        }
      }

      if (foundIn.length === 0) {
        return {
          valid: false,
          message: `Test method "${testMethod}" not found in any test codeunit`
        };
      }

      if (foundIn.length === 1) {
        const found = foundIn[0];
        if (found) {
          return {
            valid: true,
            message: `Found test method "${testMethod}" in codeunit ${found.codeunitId} "${found.codeunitName}"`
          };
        }
      }

      // Multiple codeunits have this method
      const codeunitList = foundIn.map(f => `${f.codeunitId} "${f.codeunitName}"`).join(', ');
      return {
        valid: true,
        message: `Warning: Test method "${testMethod}" found in multiple codeunits: ${codeunitList}. All will be executed.`
      };
    }

    return {
      valid: true,
      message: 'Test parameters validated'
    };
  }
}