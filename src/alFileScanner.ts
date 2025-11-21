import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import { Logger } from './logger.js';

/**
 * Represents an AL object (codeunit, page, etc.)
 */
export interface ALObject {
  type: string;
  id: number;
  name: string;
}

/**
 * Represents an AL file with its metadata
 */
export interface ALFile {
  object: ALObject;
  path: string;
  content?: string;
}

/**
 * Represents a test method within a codeunit
 */
export interface ALTestMethod {
  name: string;
  lineNumber: number;
}

/**
 * Represents a test codeunit with its methods
 */
export interface ALTestCodeunit {
  file: ALFile;
  testMethods: ALTestMethod[];
}

/**
 * Scanner for AL files in a workspace
 */
export class ALFileScanner {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Scans the workspace for all AL files
   * @param workspacePath The root path of the workspace to scan
   * @param testCodeunitsOnly If true, only returns test codeunits
   * @returns Array of AL files found
   */
  async scanWorkspaceForALFiles(workspacePath: string, testCodeunitsOnly: boolean = false): Promise<ALFile[]> {
    this.logger.info(`Scanning workspace for AL files: ${workspacePath}`);

    try {
      // Find all .al files in the workspace
      const pattern = path.join(workspacePath, '**/*.al').replace(/\\/g, '/');
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/.git/**', '**/.alpackages/**'],
        nodir: true
      });

      this.logger.info(`Found ${files.length} AL files in workspace`);

      const alFiles: ALFile[] = [];

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');

          // Skip if test codeunits only and this isn't a test codeunit
          if (testCodeunitsOnly && !this.isTestCodeunit(content)) {
            continue;
          }

          const alObject = this.extractALObjectFromContent(content, filePath);

          if (alObject) {
            alFiles.push({
              object: alObject,
              path: filePath,
              content: content
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to process AL file ${filePath}: ${error}`);
        }
      }

      this.logger.info(`Processed ${alFiles.length} ${testCodeunitsOnly ? 'test codeunit' : 'AL'} files`);
      return alFiles;

    } catch (error) {
      this.logger.error(`Error scanning workspace: ${error}`);
      throw error;
    }
  }

  /**
   * Scans the workspace for test codeunits
   * @param workspacePath The root path of the workspace to scan
   * @returns Array of test codeunits with their test methods
   */
  async scanWorkspaceForTestCodeunits(workspacePath: string): Promise<ALTestCodeunit[]> {
    this.logger.info('Scanning workspace for test codeunits');

    const testFiles = await this.scanWorkspaceForALFiles(workspacePath, true);
    const testCodeunits: ALTestCodeunit[] = [];

    for (const file of testFiles) {
      const testMethods = this.extractTestMethodsFromContent(file.content ?? '');

      if (testMethods.length > 0 || this.isTestCodeunit(file.content ?? '')) {
        testCodeunits.push({
          file: file,
          testMethods: testMethods
        });

        this.logger.info(`Found test codeunit: ${file.object.name} (ID: ${file.object.id}) with ${testMethods.length} test methods`);
      }
    }

    this.logger.info(`Total test codeunits found: ${testCodeunits.length}`);
    return testCodeunits;
  }

  /**
   * Checks if the content represents a test codeunit
   * @param content The file content to check
   * @returns True if this is a test codeunit
   */
  private isTestCodeunit(content: string): boolean {
    // Check for Subtype = Test pattern (case-insensitive)
    const testCodeunitPattern = /Sub(t|T)ype\s*=\s*(t|T)est\s*;/;
    return testCodeunitPattern.test(content);
  }

  /**
   * Extracts AL object information from file content
   * @param content The file content
   * @param filePath The path to the file (for error reporting)
   * @returns The AL object or null if not found
   */
  private extractALObjectFromContent(content: string, filePath: string): ALObject | null {
    try {
      // Pattern to match AL object declarations
      // Matches: codeunit 50100 "Customer Tests"
      const objectPattern = /^\s*(codeunit|page|pageextension|pagecustomization|tableextension|table|report|reportextension|xmlport|query|enum|enumextension|permissionset|permissionsetextension|profile|controladdin)\s+(\d+)\s+(?:"([^"]+)"|([^\s{]+))/mi;

      const match = content.match(objectPattern);

      if (match?.[1] !== undefined && match[2] !== undefined) {
        const type = match[1].toLowerCase();
        const id = parseInt(match[2], 10);
        const name = match[3] ?? match[4] ?? `Unnamed ${type} ${id}`;

        return {
          type: type,
          id: id,
          name: name
        };
      }

      this.logger.warn(`Could not extract AL object from file: ${filePath}`);
      return null;

    } catch (error) {
      this.logger.error(`Error extracting AL object from ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Extracts test methods from codeunit content
   * @param content The codeunit file content
   * @returns Array of test methods found
   */
  private extractTestMethodsFromContent(content: string): ALTestMethod[] {
    const testMethods: ALTestMethod[] = [];

    try {
      // Split content into lines for line number tracking
      const lines = content.split(/\r?\n/);

      // Pattern to find [Test] attributes
      const testAttributePattern = /^\s*\[Test\]/i;

      // Pattern to find procedure declaration after [Test]
      const procedurePattern = /^\s*(?:local\s+)?procedure\s+([^\s(]+)/i;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined || line === '') {
          continue;
        }

        // Check if this line has a [Test] attribute
        if (testAttributePattern.test(line)) {
          // Look for the procedure declaration in the next few lines
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j];
            if (nextLine === undefined || nextLine === '') {
              continue;
            }

            const procMatch = nextLine.match(procedurePattern);

            if (procMatch?.[1] !== undefined) {
              const methodName = procMatch[1];

              // Skip if this test is commented out
              const blockBeforeTest = lines.slice(Math.max(0, i - 5), i).join('\n');
              if (blockBeforeTest.includes('/*') && !blockBeforeTest.includes('*/')) {
                break;
              }

              testMethods.push({
                name: methodName,
                lineNumber: j + 1 // 1-based line number
              });

              this.logger.debug(`Found test method: ${methodName} at line ${j + 1}`);
              break;
            }
          }
        }
      }

    } catch (error) {
      this.logger.error(`Error extracting test methods: ${error}`);
    }

    return testMethods;
  }

  /**
   * Gets a specific test codeunit by ID
   * @param workspacePath The workspace path
   * @param codeunitId The codeunit ID to find
   * @returns The test codeunit or null if not found
   */
  async getTestCodeunitById(workspacePath: string, codeunitId: number): Promise<ALTestCodeunit | null> {
    this.logger.info(`Looking for test codeunit with ID: ${codeunitId}`);

    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);

    const found = testCodeunits.find(tc => tc.file.object.id === codeunitId);

    if (found !== undefined) {
      this.logger.info(`Found test codeunit: ${found.file.object.name}`);
    } else {
      this.logger.warn(`Test codeunit with ID ${codeunitId} not found`);
    }

    return found ?? null;
  }

  /**
   * Gets all test codeunit IDs in the workspace
   * @param workspacePath The workspace path
   * @returns Array of codeunit IDs
   */
  async getAllTestCodeunitIds(workspacePath: string): Promise<number[]> {
    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);
    return testCodeunits.map(tc => tc.file.object.id);
  }

  /**
   * Creates a test summary report
   * @param workspacePath The workspace path
   * @returns A formatted summary of all tests
   */
  async createTestSummary(workspacePath: string): Promise<string> {
    const testCodeunits = await this.scanWorkspaceForTestCodeunits(workspacePath);

    if (testCodeunits.length === 0) {
      return 'No test codeunits found in workspace';
    }

    let summary = `Found ${testCodeunits.length} test codeunits:\n\n`;

    for (const tc of testCodeunits) {
      summary += `Codeunit ${tc.file.object.id} "${tc.file.object.name}"\n`;
      summary += `  Path: ${tc.file.path}\n`;
      summary += `  Test Methods: ${tc.testMethods.length}\n`;

      if (tc.testMethods.length > 0) {
        for (const method of tc.testMethods) {
          summary += `    - ${method.name} (line ${method.lineNumber})\n`;
        }
      }

      summary += '\n';
    }

    return summary;
  }
}