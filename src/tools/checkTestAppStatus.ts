/**
 * Tool to check test app compilation and publication status
 *
 * Provides comprehensive diagnostics about test app status including:
 * - Compilation status (if .app file exists)
 * - Test codeunit detection in source files
 * - Test availability in the environment
 * - Recommendations for fixing issues
 */

import { DemoPortalClient } from '../api/demoPortalClient.js';
import path from 'path';
import fs from 'fs/promises';

interface CheckTestAppStatusParams {
  workspacePath: string;
  environmentId?: string;
}

interface TestAppStatus {
  compilationStatus: {
    appFileExists: boolean;
    appFilePath?: string;
    appFileSize?: number;
    lastModified?: string;
  };
  sourceAnalysis: {
    testCodeunitsFound: string[];
    estimatedTestCount: number;
    isTestApp: boolean;
  };
  environmentStatus?: {
    testsAvailable: number;
    testJobSuccessful: boolean;
    message: string;
  };
  recommendations: string[];
}

interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class CheckTestAppStatusTool {
  constructor(
    private readonly demoPortalClient: DemoPortalClient
  ) {}

  get name() {
    return 'check_test_app_status';
  }

  get description() {
    return 'Check the compilation and publication status of a test app';
  }

  get schema() {
    return {
      type: 'object' as const,
      properties: {
        workspacePath: {
          type: 'string',
          description: 'Path to the AL project workspace'
        },
        environmentId: {
          type: 'string',
          description: 'Optional environment ID to check publication status'
        }
      },
      required: ['workspacePath']
    };
  }

  private async checkCompilationStatus(
    workspacePath: string
  ): Promise<TestAppStatus['compilationStatus']> {
    try {
      // Read app.json to get app details
      const appJsonPath = path.join(workspacePath, 'app.json');
      const appJsonContent = await fs.readFile(appJsonPath, 'utf8');
      const appJson = JSON.parse(appJsonContent);

      // Check if .app file exists in build directory
      const buildPath = path.join(workspacePath, 'build');
      const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`
        .replace(/ /g, '_');
      const appFilePath = path.join(buildPath, appFileName);

      try {
        const stats = await fs.stat(appFilePath);
        return {
          appFileExists: true,
          appFilePath,
          appFileSize: stats.size,
          lastModified: stats.mtime.toISOString()
        };
      } catch {
        return {
          appFileExists: false,
          appFilePath
        };
      }
    } catch (error) {
      return {
        appFileExists: false
      };
    }
  }

  private async analyzeSourceFiles(
    workspacePath: string
  ): Promise<TestAppStatus['sourceAnalysis']> {
    const testCodeunits: string[] = [];
    let estimatedTestCount = 0;

    try {
      // Find all .al files recursively
      const alFiles: string[] = [];
      const scanDirectory = async (dir: string) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && entry.name !== '.alpackages' && entry.name !== 'build') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.al')) {
            alFiles.push(fullPath);
          }
        }
      };

      await scanDirectory(workspacePath);

      // Scan each file for test codeunits and methods
      for (const filePath of alFiles) {
        const content = await fs.readFile(filePath, 'utf8');

        // Check for test codeunit
        const codeunitMatch = content.match(/codeunit\s+(\d+)\s+"?([^"{\n]+)"?\s*{/i);
        if (codeunitMatch && codeunitMatch[2]) {
          const codeunitId = codeunitMatch[1];
          const codeunitName = codeunitMatch[2];

          // Check if it has Subtype = Test
          const subtypeMatch = content.match(/Subtype\s*=\s*Test/i);
          if (subtypeMatch) {
            testCodeunits.push(`${codeunitId}: ${codeunitName}`);

            // Count [Test] methods
            const testMethodMatches = content.matchAll(/\[Test\]/gi);
            let methodCount = 0;
            for (const _ of testMethodMatches) {
              methodCount++;
            }
            estimatedTestCount += methodCount;
          }
        }
      }
    } catch (error) {
      // Silent failure - analysis is best effort
    }

    return {
      testCodeunitsFound: testCodeunits,
      estimatedTestCount,
      isTestApp: testCodeunits.length > 0
    };
  }

  private async checkEnvironmentStatus(
    environmentId: string
  ): Promise<TestAppStatus['environmentStatus']> {
    try {
      // Create a test job to check test availability
      const testParams = {};
      const { jobId } = await this.demoPortalClient.createTestJob(
        environmentId,
        testParams
      );

      // Poll for test results (short timeout for diagnostic)
      let attempts = 0;
      const maxAttempts = 10;
      let testsAvailable = 0;

      while (attempts < maxAttempts) {
        await new Promise<void>(resolve => setTimeout(resolve, 2000));

        try {
          const result = await this.demoPortalClient.getTestResultsXml(
            environmentId,
            jobId
          );

          if (result?.xml) {
            // Parse the XML to count available tests
            const testCountMatch = result.xml.match(/<testcase/g);
            testsAvailable = testCountMatch ? testCountMatch.length : 0;
            break;
          }
        } catch (pollError) {
          // Continue polling
        }

        attempts++;
      }

      return {
        testsAvailable,
        testJobSuccessful: true,
        message: testsAvailable > 0
          ? `Found ${testsAvailable} test(s) available in the environment`
          : 'No tests found in the environment'
      };
    } catch (error) {
      return {
        testsAvailable: 0,
        testJobSuccessful: false,
        message: `Failed to check environment: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateRecommendations(status: TestAppStatus): string[] {
    const recommendations: string[] = [];

    // Check compilation status
    if (!status.compilationStatus.appFileExists) {
      recommendations.push('App file not found - run compile_app to compile the test app');
      recommendations.push(`Expected location: ${status.compilationStatus.appFilePath}`);
    } else {
      recommendations.push(`App file found: ${status.compilationStatus.appFilePath} (${status.compilationStatus.appFileSize} bytes)`);
    }

    // Check source analysis
    if (status.sourceAnalysis.testCodeunitsFound.length === 0) {
      recommendations.push('No test codeunits found in source files');
      recommendations.push('Ensure codeunits have Subtype = Test');
      recommendations.push('Ensure test methods have [Test] attribute');
    } else {
      recommendations.push(`Found ${status.sourceAnalysis.testCodeunitsFound.length} test codeunit(s) with ${status.sourceAnalysis.estimatedTestCount} test method(s)`);
    }

    // Check environment status if provided
    if (status.environmentStatus) {
      if (status.environmentStatus.testsAvailable === 0) {
        if (status.compilationStatus.appFileExists) {
          recommendations.push('App is compiled but NOT published to the environment');
          recommendations.push('Action: Run compile_and_publish to publish the test app');
        } else {
          recommendations.push('App is neither compiled nor published');
          recommendations.push('Action: Run compile_and_publish to compile and publish the test app');
        }
      } else {
        recommendations.push(`Test app is published - ${status.environmentStatus.testsAvailable} test(s) available`);

        if (status.sourceAnalysis.estimatedTestCount > status.environmentStatus.testsAvailable) {
          recommendations.push('Warning: Source has more tests than environment - may need to republish');
        }
      }
    }

    return recommendations;
  }

  async execute(params: CheckTestAppStatusParams): Promise<ToolResult> {
    try {
      // Check compilation status
      const compilationStatus = await this.checkCompilationStatus(params.workspacePath);

      // Analyze source files
      const sourceAnalysis = await this.analyzeSourceFiles(params.workspacePath);

      // Check environment status if ID provided
      let environmentStatus: TestAppStatus['environmentStatus'] | undefined;
      if (params.environmentId) {
        environmentStatus = await this.checkEnvironmentStatus(params.environmentId);
      }

      // Generate status object
      const status: TestAppStatus = {
        compilationStatus,
        sourceAnalysis,
        recommendations: []
      };

      if (environmentStatus) {
        status.environmentStatus = environmentStatus;
      }

      // Generate recommendations
      status.recommendations = this.generateRecommendations(status);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: errorMessage,
              recommendations: [
                'Check that the workspace path is correct',
                'Ensure app.json exists in the workspace',
                'Verify AL project structure is valid'
              ]
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  }
}