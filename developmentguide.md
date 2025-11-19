# MCP Server Development Guide

## Executive Summary

This guide provides comprehensive implementation details for the Continia Environment MCP Server, based on extensive analysis with GPT-5 Pro. The server enables LLMs to manage Business Central environments and execute automated tests through a structured, type-safe TypeScript implementation.

### Key Principles
- **Strict TDD**: Write failing tests first, then minimal code to pass, then refactor
- **No mocks/stubs/fakes**: All tests use real Demo Portal API
- **Minimal code**: Only 7 essential tools in MVP
- **TypeScript strict mode**: Enforced via pre-commit hooks and CI gates
- **Secret redaction**: Centralized utility prevents credential leaks
- **LLM-friendly**: Structured JSON responses with actionable error guidance

### Critical Implementation Notes (Verified Against Environment Explorer)

**API Field Names:**
- Environment status field: Use `status` (not `state`) - API returns "Running", "Stopped", "Draft", "Starting", "Stopping"
- Always use PascalCase values: "Running", "Stopped" (not lowercase)

**Environment Operations:**
- Start: `PATCH /environments/{id}.json` with `{ status: 'Running' }`
- Stop: `PATCH /environments/{id}.json` with `{ status: 'Stopped' }`
- Get: `GET /environments/{id}.json` returns full environment object

**Developer Endpoint Publishing:**
- URL format: `{baseUrl.origin}/{environmentId}/dev/apps?tenant=default&SchemaUpdateMode={mode}`
- Credentials: Fetch via `GET /environments/{id}/users.json` from Demo Portal
- Authentication: Basic auth with first user's username/password

**Test Execution:**
- Submit: `POST /environments/{id}/tests/jobs.json` → returns numeric `jobId`
- Poll: `GET /environments/{id}/tests/jobs/{jobId}.xml` (404 = pending, 200 = complete)
- Coverage: `GET /environments/{id}/tests/jobs/{jobId}/codecoverage.csv`

**AL Compilation:**
- Use `al compile` command (not `alc.exe` directly)
- Always include all three analyzers: CodeCop, AppSourceCop, UICop
- Required flags: `/continuebuildonerror:+` and `/ruleset`
- Locate analyzers from dotnet tools: `~/.dotnet/tools/.store/microsoft.dynamics.businesscentral.development.tools/{version}/...`

## Architecture Overview

### Layered Architecture
```
┌─────────────────────────────────────┐
│           LLM (Claude/GPT)           │
├─────────────────────────────────────┤
│      MCP Protocol Interface          │
├─────────────────────────────────────┤
│    Tools Layer (MCP Definitions)     │
│  - Parameter validation with Zod     │
│  - Delegates to services             │
├─────────────────────────────────────┤
│     Service Layer (Business Logic)   │
│  - EnvironmentService                │
│  - CompilationService                │
│  - TestRunnerService                 │
├─────────────────────────────────────┤
│        API Client Layer              │
│  - DemoPortalClient                  │
│  - DeveloperEndpointClient          │
├─────────────────────────────────────┤
│         External APIs                │
│  - Demo Portal REST API              │
│  - BC Developer Endpoint             │
└─────────────────────────────────────┘
```

### Dependency Injection Pattern
```typescript
// Composition root during server bootstrap
const httpClient = createHttpClient({
  baseUrl: config.demoPortalUrl,
  token: config.demoPortalToken,
  timeout: 10000,
  retries: 3
});

const demoPortalClient = new DemoPortalClient(httpClient);
const environmentService = new EnvironmentService(demoPortalClient);

// Tools resolve services from container
const listEnvironmentsTool = new ListEnvironmentsTool(environmentService);
```

## Phase 0: Developer Experience & Standards

### TypeScript Configuration
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"],
      "@errors/*": ["./src/errors/*"],
      "@services/*": ["./src/services/*"]
    }
  }
}
```

### ESLint Setup
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error'
  }
};
```

### Pre-commit Hooks
```json
// package.json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    "precommit": "npm run typecheck && npm run lint",
    "test:unit": "vitest run --config vitest.unit.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run precommit"
    }
  }
}
```

### Testing Framework Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'tests']
    },
    testTimeout: 60000, // 1 minute default
    hookTimeout: 30000
  }
});
```

## Phase 1: Core Infrastructure

### Error Taxonomy Implementation
```typescript
// src/errors/errors.ts
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;

  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: ErrorService.redact(this.message),
      retryable: this.retryable,
      details: this.details ? ErrorService.redactObject(this.details) : undefined
    };
  }
}

export class AuthError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly retryable = false;
}

export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT';
  readonly retryable = true;

  constructor(
    message: string,
    public readonly retryAfter?: number,
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly retryable = false;
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly retryable = true;
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly retryable = false;
}

export class CompileError extends AppError {
  readonly code = 'COMPILE_ERROR';
  readonly retryable = false;

  constructor(
    message: string,
    public readonly diagnostics: Diagnostic[],
    details?: Record<string, unknown>
  ) {
    super(message, details);
  }
}
```

### Secret Redaction Service
```typescript
// src/errors/redact.ts
export class ErrorService {
  private static readonly REDACTION_PATTERNS = [
    // Authorization headers
    /Authorization:\s*Bearer\s+[^\s]+/gi,
    /Authorization:\s*Basic\s+[^\s]+/gi,

    // Token patterns
    /\b(api[_-]?key|token|secret|password)[=:]\s*[^\s]+/gi,

    // Base64 encoded credentials
    /Basic\s+[A-Za-z0-9+/]+=*/g
  ];

  static redact(text: string): string {
    let redacted = text;

    for (const pattern of this.REDACTION_PATTERNS) {
      redacted = redacted.replace(pattern, (match, group1) => {
        if (group1) {
          return `${group1}=[REDACTED]`;
        }
        return match.replace(/[^\s:=]+$/, '[REDACTED]');
      });
    }

    return redacted;
  }

  static redactObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.redact(value);
      } else if (value && typeof value === 'object') {
        result[key] = Array.isArray(value)
          ? value.map(v => typeof v === 'string' ? this.redact(v) : v)
          : this.redactObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}
```

### Configuration Service
```typescript
// src/services/configurationService.ts
import { z } from 'zod';
import fs from 'fs/promises';

const ConfigSchema = z.object({
  api: z.object({
    url: z.string().url().default('https://demoportaldev.continiaonline.com/api/v1.0'),
    timeoutMs: z.number().min(1000).max(60000).default(30000)
  }),
  test: z.object({
    defaultTimeoutSeconds: z.number().min(10).max(3600).default(600),
    initialPollIntervalMs: z.number().min(500).max(10000).default(2000),
    maxPollIntervalMs: z.number().min(1000).max(60000).default(30000),
    backoffFactor: z.number().min(1.1).max(3).default(2)
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'text']).default('json')
  }),
  auth: z.object({
    devTenant: z.string().default('default'),
    allowInsecureCertificates: z.boolean().default(false),
    interactivePrompts: z.boolean().default(false)  // false for MCP, true for VS Code
  }),
  environment: z.object({
    defaultAuthMethod: z.enum(['NavUserPassword', 'Windows', 'AzureAd']).default('NavUserPassword')
  })
});

export class ConfigurationService {
  private config: z.infer<typeof ConfigSchema>;
  private apiToken: string;

  constructor() {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    // Load token with fallback strategy
    // 1. Try VS Code settings (for extension compatibility)
    const vsCodeToken = this.getVsCodeSetting('apiToken');
    // 2. Fall back to environment variable (for CLI/MCP)
    const envToken = process.env.DEMO_PORTAL_TOKEN;

    const token = vsCodeToken || envToken;
    if (!token) {
      throw new ValidationError(
        'DEMO_PORTAL_TOKEN not set. Set it via: export DEMO_PORTAL_TOKEN=your_token'
      );
    }
    this.apiToken = token;

    // Load config file if exists
    let fileConfig = {};
    try {
      const configPath = './mcp-config.json';
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        fileConfig = JSON.parse(content);
      }
    } catch (error) {
      // Config file is optional
    }

    // Merge with environment overrides
    const envOverrides = {
      api: {
        url: process.env.DEMO_PORTAL_BASE_URL
      },
      logging: {
        level: process.env.LOG_LEVEL
      }
    };

    // Validate and set defaults
    this.config = ConfigSchema.parse({
      ...fileConfig,
      ...envOverrides
    });
  }

  getApiToken(): string {
    return this.apiToken;
  }

  getApiUrl(): string {
    return this.config.api.url;
  }

  getConfig(): z.infer<typeof ConfigSchema> {
    return this.config;
  }
}
```

### HTTP Client Setup
```typescript
// src/api/httpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { ErrorService } from '@errors/redact';
import { AuthError, NetworkError, RateLimitError } from '@errors/errors';

interface HttpClientConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  retries?: number;
}

export function createHttpClient(config: HttpClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout || 10000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor - add auth
  client.interceptors.request.use((req) => {
    req.headers.Authorization = `Bearer ${config.token}`;
    req.headers['X-Request-Id'] = crypto.randomUUID();
    return req;
  });

  // Response interceptor - handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const message = ErrorService.redact(error.message);

      if (status === 401 || status === 403) {
        throw new AuthError(
          'API authentication failed. Verify DEMO_PORTAL_TOKEN is valid.'
        );
      }

      if (status === 429) {
        const retryAfter = error.response?.headers['retry-after'];
        throw new RateLimitError(
          'API rate limit exceeded. Wait and retry.',
          retryAfter ? parseInt(retryAfter) : 60
        );
      }

      if (status && status >= 500) {
        throw new NetworkError(
          `Server error (${status}). Try again later.`
        );
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new NetworkError('Request timed out. Check network connection.');
      }

      throw new NetworkError(message);
    }
  );

  return client;
}
```

### Credentials Service Implementation
```typescript
// src/services/credentialsService.ts
import { z } from 'zod';
import { DemoPortalClient } from '@api/demoPortalClient';
import { AuthError, ValidationError } from '@errors/errors';

// Schema for BC User response
const BcUserSchema = z.object({
  id: z.string(),
  environmentId: z.string(),
  username: z.string(),
  password: z.string(),
  description: z.string().optional(),
  fullName: z.string().optional()
});

type BcUser = z.infer<typeof BcUserSchema>;

interface AuthResult {
  authorization: string;
  user: BcUser;
}

export class CredentialsService {
  // Session-scoped cache for user selections
  private userCache = new Map<string, BcUser>();

  constructor(
    private readonly demoPortalClient: DemoPortalClient,
    private readonly configService: ConfigurationService
  ) {}

  /**
   * Get Developer Endpoint authentication header and selected user
   * Implements intelligent user selection with caching
   */
  async getDeveloperEndpointAuth(environment: {
    id: string;
    authenticationMethod?: string
  }): Promise<AuthResult> {
    // Check cache first
    const cachedUser = this.userCache.get(environment.id);
    if (cachedUser) {
      return this.createAuthResult(cachedUser);
    }

    // Fetch users from Demo Portal
    const users = await this.fetchEnvironmentUsers(environment.id);

    // Handle no users case
    if (users.length === 0) {
      return this.handleNoUsers(environment);
    }

    // Select user based on count
    const selectedUser = users.length === 1
      ? users[0]
      : await this.selectUser(users, environment.id);

    // Cache selection for session
    this.userCache.set(environment.id, selectedUser);

    return this.createAuthResult(selectedUser);
  }

  /**
   * Invalidate cached credentials (called on 401/403)
   */
  invalidateDeveloperEndpointAuth(environmentId: string): void {
    this.userCache.delete(environmentId);
  }

  /**
   * Get configured tenant for developer endpoint
   */
  getDevTenant(): string {
    return this.configService.get('devTenant', 'default');
  }

  /**
   * Get Demo Portal headers with token fallback
   */
  getDemoPortalHeaders(): Record<string, string> {
    const token = this.getDemoPortalToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private getDemoPortalToken(): string {
    // Try VS Code setting first (for extension compatibility)
    const settingToken = this.configService.get('apiToken');
    if (settingToken) return settingToken;

    // Fall back to environment variable (for CLI/MCP)
    const envToken = process.env.DEMO_PORTAL_TOKEN;
    if (envToken) return envToken;

    throw new AuthError(
      'Demo Portal token not configured. Set DEMO_PORTAL_TOKEN environment variable.'
    );
  }

  private async fetchEnvironmentUsers(environmentId: string): Promise<BcUser[]> {
    const response = await this.demoPortalClient.get(
      `/environments/${environmentId}/users.json`
    );

    return response.data.map((user: any) => BcUserSchema.parse(user));
  }

  private createAuthResult(user: BcUser): AuthResult {
    const encoded = Buffer.from(`${user.username}:${user.password}`).toString('base64');
    return {
      authorization: `Basic ${encoded}`,
      user
    };
  }

  private async handleNoUsers(environment: {
    id: string;
    authenticationMethod?: string
  }): Promise<AuthResult> {
    const isInteractive = this.configService.get('interactivePrompts', false);
    const authMethod = environment.authenticationMethod || 'NavUserPassword';

    if (authMethod !== 'NavUserPassword') {
      throw new AuthError(
        `Developer Endpoint publishing requires NavUserPassword authentication. ` +
        `Current method: ${authMethod}. Please create a NavUserPassword user first.`,
        {
          code: 'UNSUPPORTED_AUTH_METHOD',
          suggestedActions: ['CreateNavUserPasswordUser']
        }
      );
    }

    if (!isInteractive) {
      // Non-interactive mode (MCP): return structured error
      throw new AuthError(
        'No users found for environment. Create one to proceed.',
        {
          code: 'NO_USERS',
          suggestedActions: ['CreateUser'],
          environmentId: environment.id
        }
      );
    }

    // Interactive mode (VS Code): prompt for user creation
    const action = await this.promptUserCreation(environment.id);
    if (action === 'create') {
      await this.createEnvironmentUser(environment.id);
      // Recursive retry after creation
      return this.getDeveloperEndpointAuth(environment);
    }

    throw new AuthError('User creation cancelled');
  }

  private async selectUser(users: BcUser[], environmentId: string): Promise<BcUser> {
    const isInteractive = this.configService.get('interactivePrompts', false);

    if (!isInteractive) {
      // Non-interactive mode: use first user by convention
      return users[0];
    }

    // Interactive mode: prompt for selection
    const selected = await this.promptUserSelection(users);
    if (!selected) {
      throw new AuthError('User selection cancelled');
    }

    return selected;
  }

  private async promptUserCreation(environmentId: string): Promise<'create' | 'cancel'> {
    // Implementation depends on UI framework (VS Code, terminal, etc.)
    // For VS Code: vscode.window.showInformationMessage
    // For CLI: inquirer prompt
    // This is a placeholder
    console.log(`No users found for environment ${environmentId}`);
    return 'cancel';
  }

  private async promptUserSelection(users: BcUser[]): Promise<BcUser | null> {
    // Implementation depends on UI framework
    // For VS Code: vscode.window.showQuickPick
    // For CLI: inquirer select
    // Default to first user as fallback
    return users[0];
  }

  private async createEnvironmentUser(environmentId: string): Promise<void> {
    await this.demoPortalClient.post(
      `/environments/${environmentId}/users.json`,
      {
        username: `User${Date.now()}`,
        password: this.generateSecurePassword()
      }
    );
  }

  private generateSecurePassword(): string {
    // Generate cryptographically secure password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const crypto = require('crypto');
    let password = '';

    for (let i = 0; i < 16; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      password += chars[randomIndex];
    }

    return password;
  }
}
```

## Phase 2: Environment Management Features

### Environment Service Implementation
```typescript
// src/services/environmentService.ts
import { z } from 'zod';
import { DemoPortalClient } from '@api/demoPortalClient';
import { NotFoundError } from '@errors/errors';

// Schemas for validation
const RawEnvironmentSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  displayName: z.string().optional(),
  environmentName: z.string().optional(),
  status: z.string(), // Note: API uses "status" not "state"
  applicationVersion: z.string().optional(),
  bcVersion: z.string().optional(),
  version: z.string().optional()
}).passthrough();

const EnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(), // Maps to API's "status" field (Running, Stopped, Draft, etc.)
  bcVersion: z.string()
});

export class EnvironmentService {
  constructor(
    private readonly demoPortalClient: DemoPortalClient,
    private readonly logger?: Logger
  ) {}

  async listEnvironments(): Promise<ListEnvironmentsResult> {
    const startTime = Date.now();

    // Fetch raw data
    const raw = await this.demoPortalClient.listEnvironmentsRaw();

    // Validate and transform
    const rawEnvironments = z.array(RawEnvironmentSchema).parse(raw);
    const environments = rawEnvironments.map(this.transformEnvironment);

    // Sort for deterministic output
    environments.sort((a, b) => a.name.localeCompare(b.name));

    return {
      type: 'list_environments_result',
      environments,
      count: environments.length,
      source: { baseUrl: this.demoPortalClient.getBaseUrl() },
      fetchedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startTime
    };
  }

  async getEnvironment(environmentId: string): Promise<GetEnvironmentResult> {
    const startTime = Date.now();

    try {
      const raw = await this.demoPortalClient.getEnvironmentRaw(environmentId);
      const validated = RawEnvironmentSchema.parse(raw);

      const environment = {
        ...this.transformEnvironment(validated),
        details: this.extractDetails(validated)
      };

      return {
        type: 'get_environment_result',
        environment,
        source: { baseUrl: this.demoPortalClient.getBaseUrl() },
        fetchedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startTime
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(
          'Environment not found. Use list_environments to see available environments.',
          { environmentId }
        );
      }
      throw error;
    }
  }

  async startEnvironment(
    environmentId: string,
    options?: { wait?: 'none' | 'untilRunning' }
  ): Promise<StartEnvironmentResult> {
    // Get current status
    const current = await this.getEnvironment(environmentId);

    // Check if already running
    if (current.environment.status === 'Running') {
      return {
        type: 'start_environment_result',
        environmentId,
        previousStatus: 'Running',
        newStatus: 'Running',
        status: 'no_op',
        message: 'Environment already running; no action taken.',
        transition: { requested: 'start', from: 'Running', to: 'Running' },
        fetchedAt: new Date().toISOString()
      };
    }

    // Check for conflicts (environment transitioning)
    if (current.environment.status === 'Stopping') {
      return {
        type: 'start_environment_result',
        environmentId,
        previousStatus: current.environment.status,
        newStatus: current.environment.status,
        status: 'conflict_in_progress',
        message: 'Environment is stopping. Wait for it to complete before starting.',
        transition: { requested: 'start', from: current.environment.status, to: 'Running' },
        fetchedAt: new Date().toISOString()
      };
    }

    // Issue start command via PATCH with { status: 'Running' }
    await this.demoPortalClient.patchEnvironment(environmentId, { status: 'Running' });

    // Handle wait option
    if (options?.wait === 'untilRunning') {
      return await this.waitForStatus(environmentId, 'Running', 'start');
    }

    return {
      type: 'start_environment_result',
      environmentId,
      previousStatus: current.environment.status,
      newStatus: 'Starting',
      status: 'accepted',
      message: 'Environment is starting. This may take several minutes.',
      transition: {
        requested: 'start',
        from: current.environment.status,
        to: 'Running',
        intermediate: 'Starting'
      },
      fetchedAt: new Date().toISOString()
    };
  }

  async stopEnvironment(
    environmentId: string,
    options?: { wait?: 'none' | 'untilStopped' }
  ): Promise<StopEnvironmentResult> {
    // Get current status
    const current = await this.getEnvironment(environmentId);

    // Check if already stopped
    if (current.environment.status === 'Stopped') {
      return {
        type: 'stop_environment_result',
        environmentId,
        previousStatus: 'Stopped',
        newStatus: 'Stopped',
        status: 'no_op',
        message: 'Environment already stopped; no action taken.',
        fetchedAt: new Date().toISOString()
      };
    }

    // Issue stop command via PATCH with { status: 'Stopped' }
    await this.demoPortalClient.patchEnvironment(environmentId, { status: 'Stopped' });

    // Handle wait option
    if (options?.wait === 'untilStopped') {
      return await this.waitForStatus(environmentId, 'Stopped', 'stop');
    }

    return {
      type: 'stop_environment_result',
      environmentId,
      previousStatus: current.environment.status,
      newStatus: 'Stopping',
      status: 'accepted',
      message: 'Environment is stopping.',
      fetchedAt: new Date().toISOString()
    };
  }

  private transformEnvironment(raw: z.infer<typeof RawEnvironmentSchema>) {
    return {
      id: raw.id,
      name: raw.displayName || raw.name || raw.environmentName || raw.id,
      status: raw.status, // Use status as-is from API (Running, Stopped, Draft, etc.)
      bcVersion: String(raw.applicationVersion || raw.bcVersion || raw.version || 'unknown')
    };
  }

  private extractDetails(raw: z.infer<typeof RawEnvironmentSchema>) {
    const { id, name, status, ...rest } = raw;
    return {
      bcVersion: this.transformEnvironment(raw).bcVersion,
      ...rest // Preserve extra fields as "extras"
    };
  }

  private async waitForStatus(
    environmentId: string,
    targetStatus: string,
    action: string,
    timeoutMs: number = 300000
  ): Promise<any> {
    const startTime = Date.now();
    let attempts = 0;
    let delayMs = 2000;

    while (Date.now() - startTime < timeoutMs) {
      await this.delay(delayMs);

      const current = await this.getEnvironment(environmentId);

      if (current.environment.status === targetStatus) {
        return {
          type: `${action}_environment_result`,
          environmentId,
          previousStatus: 'various',
          newStatus: targetStatus,
          status: 'completed',
          message: `Environment successfully transitioned to ${targetStatus}`,
          fetchedAt: new Date().toISOString()
        };
      }

      // Exponential backoff
      attempts++;
      delayMs = Math.min(30000, delayMs * 2);
    }

    throw new Error(`Timeout waiting for environment to reach ${targetStatus} status`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### MCP Tool Implementation
```typescript
// src/tools/listEnvironments.ts
import { z } from 'zod';
import { EnvironmentService } from '@services/environmentService';

const ListEnvironmentsInputSchema = z.object({});

export class ListEnvironmentsTool {
  constructor(private readonly environmentService: EnvironmentService) {}

  async execute(input: unknown): Promise<any> {
    // Validate input (empty in this case)
    ListEnvironmentsInputSchema.parse(input);

    try {
      const result = await this.environmentService.listEnvironments();
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        return {
          type: 'error',
          kind: error.code.toLowerCase(),
          message: error.message,
          retryable: error.retryable,
          details: error.details,
          remediation: this.getRemediation(error)
        };
      }
      throw error;
    }
  }

  private getRemediation(error: AppError): string {
    switch (error.code) {
      case 'AUTH_ERROR':
        return 'Verify DEMO_PORTAL_TOKEN is valid and has necessary permissions.';
      case 'RATE_LIMIT':
        return `Wait ${error.retryAfter || 60} seconds before retrying.`;
      case 'NETWORK_ERROR':
        return 'Check network connection and API availability.';
      default:
        return 'Check error details and try again.';
    }
  }
}
```

## Phase 2.5: Compilation and Publishing

### Compilation Service
```typescript
// src/services/compilationService.ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { CompileError, ValidationError } from '@errors/errors';

const AppJsonSchema = z.object({
  id: z.string(),
  name: z.string(),
  publisher: z.string(),
  version: z.string()
});

export class CompilationService {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly devEndpointClient: DeveloperEndpointClient
  ) {}

  async compileAndPublish(params: CompileAndPublishParams): Promise<CompileAndPublishResult> {
    // Phase 1: Verify AL CLI tools are installed
    await this.verifyAlCliTools();

    // Phase 2: Compile using `al compile` command
    const compileResult = await this.compile({
      projectPath: params.workspacePath,
      packageCachePath: params.packageCachePath || path.join(params.workspacePath, '.alpackages'),
      rulesetPath: params.rulesetPath
    });

    // Phase 3: Get environment details from Demo Portal
    const environment = await this.demoPortalClient.getEnvironment(params.environmentId);

    // Phase 4: Publish to Developer Endpoint (credentials handled internally)
    const publishResult = await this.devEndpointClient.publishApp({
      appPath: compileResult.appPath,
      appFileName: path.basename(compileResult.appPath),
      environmentId: params.environmentId,
      environmentUrl: environment.url,
      authenticationMethod: environment.authenticationMethod,
      schemaUpdateMode: params.schemaUpdateMode || 'synchronize'
    });

    return {
      type: 'compile_and_publish_result',
      compile: compileResult,
      publish: publishResult,
      fetchedAt: new Date().toISOString()
    };
  }

  private async verifyAlCliTools(): Promise<void> {
    // Verify AL CLI tools are installed using dotnet tool list
    const result = await this.executeCommand('dotnet tool list -g');

    if (!result.stdout.includes('microsoft.dynamics.businesscentral.development.tools')) {
      throw new ValidationError(
        'AL CLI tools not installed. Install via: dotnet tool install -g Microsoft.Dynamics.BusinessCentral.Development.Tools'
      );
    }
  }

  private async getAnalyzerPath(): Promise<string> {
    // Get AL CLI tool version
    const result = await this.executeCommand('dotnet tool list -g');
    const match = result.stdout.match(/microsoft\.dynamics\.businesscentral\.development\.tools\s+([\d\.-]+[a-z]*)/i);

    if (!match) {
      throw new ValidationError('Could not determine AL CLI tools version');
    }

    const version = match[1];
    const userProfile = process.env.USERPROFILE || process.env.HOME;

    // Build analyzer path based on platform
    if (process.platform === 'win32') {
      return path.join(
        userProfile,
        '.dotnet', 'tools', '.store',
        'microsoft.dynamics.businesscentral.development.tools',
        version,
        'microsoft.dynamics.businesscentral.development.tools',
        version,
        'lib', 'net8.0', 'win-x64'
      );
    } else {
      throw new ValidationError(
        'AL compilation is only supported on Windows. Use a Windows host or container.'
      );
    }
  }

  private async compile(params: {
    projectPath: string;
    packageCachePath: string;
    rulesetPath?: string;
  }): Promise<CompileResult> {
    // Read and validate app.json
    const appJsonPath = path.join(params.projectPath, 'app.json');
    const appJsonContent = await fs.readFile(appJsonPath, 'utf-8');
    const appJson = AppJsonSchema.parse(JSON.parse(appJsonContent));

    // Prepare output path
    const outputDir = path.join(params.projectPath, 'build');
    await fs.mkdir(outputDir, { recursive: true });

    const appFileName = `${appJson.publisher}_${appJson.name}_${appJson.version}.app`;
    const outputPath = path.join(outputDir, appFileName);

    // Get analyzer path
    const analyzerBasePath = await this.getAnalyzerPath();
    const analyzers = [
      path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.CodeCop.dll'),
      path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.AppSourceCop.dll'),
      path.join(analyzerBasePath, 'Microsoft.Dynamics.Nav.UICop.dll')
    ];

    // Build al compile command with all analyzers
    const args = [
      'compile',
      `/project:"${params.projectPath}"`,
      `/packagecachepath:"${params.packageCachePath}"`,
      `/out:"${outputPath}"`,
      `/analyzer:"${analyzers.join(';')}"`,
      '/continuebuildonerror:+'
    ];

    // Add ruleset if provided or exists
    const rulesetPath = params.rulesetPath || path.join(params.projectPath, '.ruleset.json');
    if (await this.fileExists(rulesetPath)) {
      args.push(`/ruleset:"${rulesetPath}"`);
    }

    // Execute al compile command
    return new Promise((resolve, reject) => {
      const child = spawn('al', args, {
        cwd: params.projectPath,
        shell: true,
        windowsVerbatimArguments: true
      });

      let stdout = '';
      let stderr = '';
      const diagnostics: Diagnostic[] = [];

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        this.parseDiagnostics(data.toString(), diagnostics);
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('error', (error) => {
        reject(new CompileError(
          `Failed to start AL compiler: ${error.message}. Ensure AL CLI tools are installed.`,
          []
        ));
      });

      child.on('exit', async (code) => {
        // Note: With /continuebuildonerror:+, exit code 0 even with errors
        // Check for actual compilation failure vs warnings
        const hasErrors = diagnostics.some(d => d.severity === 'error');

        if (code !== 0 && hasErrors) {
          reject(new CompileError(
            `Compilation failed with ${diagnostics.filter(d => d.severity === 'error').length} errors`,
            diagnostics,
            { exitCode: code, stdout, stderr }
          ));
          return;
        }

        // Verify output exists
        try {
          const stats = await fs.stat(outputPath);
          resolve({
            success: true,
            appPath: outputPath,
            appSize: stats.size,
            app: appJson,
            diagnostics,
            compilerOutput: stdout
          });
        } catch {
          reject(new CompileError(
            'Compilation command completed but .app file was not created',
            diagnostics
          ));
        }
      });
    });
  }

  private async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], { shell: true });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  private parseDiagnostics(output: string, diagnostics: Diagnostic[]): void {
    const lines = output.split('\n');
    const diagnosticPattern = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)$/;

    for (const line of lines) {
      const match = diagnosticPattern.exec(line.trim());
      if (match) {
        diagnostics.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] as 'error' | 'warning',
          code: match[5],
          message: match[6]
        });
      }
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
```

### Developer Endpoint Client
```typescript
// src/api/developerEndpointClient.ts
import { createReadStream } from 'fs';
import FormData from 'form-data';
import axios, { AxiosError } from 'axios';
import https from 'https';
import { CredentialsService } from '@services/credentialsService';
import { ErrorService } from '@errors/redact';

export class DeveloperEndpointClient {
  constructor(
    private readonly credentialsService: CredentialsService
  ) {}

  async publishApp(params: PublishAppParams): Promise<PublishResult> {
    const formData = new FormData();
    // Use standard field name 'file' with stream to avoid buffering
    formData.append('file', createReadStream(params.appPath), {
      filename: params.appFileName || 'app.app'
    });

    // Get authenticated user and build auth header
    const { authorization, user } = await this.credentialsService.getDeveloperEndpointAuth({
      id: params.environmentId,
      authenticationMethod: params.authenticationMethod
    });

    // Build URL preserving pathname from environment URL
    const baseUrl = new URL(params.environmentUrl);
    const basePath = `${baseUrl.origin}${baseUrl.pathname.replace(/\/$/, '')}`;
    const tenant = this.credentialsService.getDevTenant();
    const url = `${basePath}/dev/apps?` +
      `tenant=${tenant}&SchemaUpdateMode=${params.schemaUpdateMode}`;

    // Configure HTTPS agent with conditional certificate validation
    const allowInsecure = this.credentialsService.configService.get('allowInsecureCertificates', false);
    const isLocalhost = baseUrl.hostname === 'localhost' || baseUrl.hostname === '127.0.0.1';
    const httpsAgent = new https.Agent({
      rejectUnauthorized: !(allowInsecure || isLocalhost)
    });

    // Attempt publish with single retry on auth failure
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const response = await axios.post(url, formData, {
          headers: {
            ...formData.getHeaders(),
            'Authorization': authorization,
            'Accept': 'application/json',
            'X-Request-Id': crypto.randomUUID()
          },
          httpsAgent,
          timeout: 60000 // 1 minute timeout for upload
        });

        return {
          success: true,
          status: 'completed',
          schemaUpdateMode: params.schemaUpdateMode,
          response: response.data,
          user: user.username
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;

          // Handle auth failures with retry
          if ((status === 401 || status === 403) && attempt < maxAttempts) {
            // Invalidate cached credentials and retry once
            this.credentialsService.invalidateDeveloperEndpointAuth(params.environmentId);

            // Get fresh credentials for retry
            const freshAuth = await this.credentialsService.getDeveloperEndpointAuth({
              id: params.environmentId,
              authenticationMethod: params.authenticationMethod
            });
            authorization = freshAuth.authorization;
            user = freshAuth.user;
            continue; // Retry with fresh credentials
          }

          // Final auth failure after retry
          if (status === 401 || status === 403) {
            throw new AuthError(
              'Publishing failed: Invalid credentials after retry. Verify environment permissions.',
              {
                environmentId: params.environmentId,
                user: ErrorService.redact(user.username)
              }
            );
          }

        if (status === 409) {
          throw new ConflictError(
            'Publishing failed: Schema conflict. Try schemaUpdateMode=forcesync.',
            { currentMode: params.schemaUpdateMode }
          );
        }
      }

      throw error;
    }
  }
}
```

## Phase 3: Test Execution

### Test Runner Service
```typescript
// src/services/testRunnerService.ts
import { XMLParser } from 'fast-xml-parser';
import { parse } from 'csv-parse/sync';

export class TestRunnerService {
  private xmlParser: XMLParser;

  constructor(
    private readonly demoPortalClient: DemoPortalClient,
    private readonly config: ConfigurationService
  ) {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      allowBooleanAttributes: true
    });
  }

  async runTests(params: RunTestsParams): Promise<RunTestsResult> {
    const startTime = Date.now();
    const timeoutMs = (params.timeoutSeconds || 600) * 1000;
    const signal = params.signal || AbortSignal.timeout(timeoutMs);

    // Submit job
    const { jobId } = await this.demoPortalClient.createTestJob(
      params.environmentId,
      {
        codeunitId: params.codeunitId,
        testMethod: params.testMethod
      },
      { signal }
    );

    // Poll for completion
    const result = await this.pollForResults(
      params.environmentId,
      jobId,
      signal,
      timeoutMs
    );

    // Parse XML results
    const summary = this.parseTestResults(result.xml);

    // Optionally fetch coverage
    let coverage;
    if (params.includeCoverage) {
      const csv = await this.demoPortalClient.getCoverageCsv(
        params.environmentId,
        jobId
      );
      coverage = this.parseCoverage(csv);
    }

    return {
      type: 'run_tests_result',
      environmentId: params.environmentId,
      job: {
        jobId,
        submittedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startTime
      },
      summary,
      failures: summary.failures || [],
      coverage,
      fetchedAt: new Date().toISOString()
    };
  }

  private async pollForResults(
    environmentId: string,
    jobId: string,
    signal: AbortSignal,
    timeoutMs: number
  ): Promise<{ xml: string }> {
    const startTime = Date.now();
    let attempts = 0;
    let delayMs = this.config.getConfig().test.initialPollIntervalMs;
    const maxDelay = this.config.getConfig().test.maxPollIntervalMs;
    const backoffFactor = this.config.getConfig().test.backoffFactor;

    while (Date.now() - startTime < timeoutMs) {
      // Check for cancellation
      if (signal.aborted) {
        throw new Error('Test execution cancelled');
      }

      // Wait with backoff
      await this.delay(delayMs);

      try {
        const result = await this.demoPortalClient.getTestResultsXml(
          environmentId,
          jobId,
          { signal }
        );

        if (result.statusCode === 200 && result.xml) {
          return { xml: result.xml };
        }

        // Still pending, continue polling
      } catch (error) {
        if (error instanceof NotFoundError) {
          // Job not ready yet, continue polling
        } else {
          throw error;
        }
      }

      // Exponential backoff with jitter
      attempts++;
      delayMs = Math.min(maxDelay, delayMs * backoffFactor);

      // Add jitter to prevent thundering herd
      delayMs = Math.floor(delayMs * (0.5 + Math.random() * 0.5));
    }

    throw new Error(
      `Test execution timed out after ${timeoutMs / 1000} seconds. ` +
      `Check environment status with get_environment.`
    );
  }

  private parseTestResults(xml: string): TestSummary {
    const parsed = this.xmlParser.parse(xml);

    // Handle different XML structures
    const testsuites = parsed.testsuites || parsed.testsuite || parsed;
    const suites = Array.isArray(testsuites.testsuite)
      ? testsuites.testsuite
      : [testsuites.testsuite || testsuites];

    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let durationSec = 0;
    const failures: TestFailure[] = [];

    for (const suite of suites) {
      if (!suite) continue;

      total += parseInt(suite.tests || '0');
      failed += parseInt(suite.failures || '0');
      skipped += parseInt(suite.skipped || '0');
      durationSec += parseFloat(suite.time || '0');

      // Extract failures
      const testcases = Array.isArray(suite.testcase)
        ? suite.testcase
        : [suite.testcase].filter(Boolean);

      for (const testcase of testcases) {
        if (testcase?.failure) {
          failures.push({
            suite: suite.name || 'Unknown',
            test: testcase.name || 'Unknown',
            classname: testcase.classname,
            message: testcase.failure.message || testcase.failure,
            details: testcase.failure['#text'] || testcase.failure,
            timeSec: parseFloat(testcase.time || '0')
          });
        }
      }
    }

    passed = total - failed - skipped;

    return {
      total,
      passed,
      failed,
      skipped,
      durationSec,
      failures
    };
  }

  private parseCoverage(csv: string): CoverageSummary {
    // Remove BOM if present
    const cleanCsv = csv.replace(/^\uFEFF/, '');

    const records = parse(cleanCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    let linesCovered = 0;
    let linesTotal = 0;
    const byObject: CoverageObject[] = [];

    for (const record of records) {
      const covered = parseInt(record.linesCovered || '0');
      const notCovered = parseInt(record.linesNotCovered || '0');
      const total = covered + notCovered;

      linesCovered += covered;
      linesTotal += total;

      if (record.objectType && record.objectId) {
        byObject.push({
          objectType: record.objectType,
          objectId: parseInt(record.objectId),
          objectName: record.objectName || 'Unknown',
          linesCovered: covered,
          linesTotal: total,
          coveredPercent: total > 0 ? (covered / total) * 100 : 0
        });
      }
    }

    return {
      summary: {
        linesCovered,
        linesTotal,
        coveredPercent: linesTotal > 0 ? (linesCovered / linesTotal) * 100 : 0
      },
      byObject
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Authentication Configuration

### Environment Variables
```bash
# Required for MCP/CLI operation
export DEMO_PORTAL_TOKEN="your-api-token-here"

# Optional configuration
export DEV_TENANT="default"                  # Developer endpoint tenant
export ALLOW_INSECURE_CERTS="false"         # Allow self-signed certificates
export INTERACTIVE_PROMPTS="false"          # Disable for MCP (non-interactive)
export DEFAULT_AUTH_METHOD="NavUserPassword" # Default environment auth method
```

### Configuration File (mcp-config.json)
```json
{
  "api": {
    "url": "https://demoportaldev.continiaonline.com/api/v1.0",
    "timeoutMs": 30000
  },
  "auth": {
    "devTenant": "default",
    "allowInsecureCertificates": false,
    "interactivePrompts": false
  },
  "environment": {
    "defaultAuthMethod": "NavUserPassword"
  }
}
```

### Authentication Flow Summary

#### 1. Demo Portal Authentication
- **Token Source Priority**: VS Code settings → Environment variable
- **Header Format**: `Authorization: Bearer {token}`
- **Error Handling**: Structured errors with retry guidance

#### 2. Developer Endpoint Authentication
- **User Selection**:
  - Single user: Auto-select
  - Multiple users: Prompt (VS Code) or use first (MCP)
  - No users: Create prompt (VS Code) or error (MCP)
- **Credential Caching**: Session-scoped, invalidated on 401/403
- **Retry Logic**: Single retry with fresh credentials on auth failure
- **Header Format**: `Authorization: Basic {base64(username:password)}`

#### 3. Security Features
- **Secret Redaction**: All logs sanitized before output
- **TLS Validation**: Conditional based on localhost or configuration
- **Token Protection**: Never logged or exposed in errors

#### 4. MVP Limitations
- **Supported Auth Methods**: NavUserPassword only
- **Azure AD/Windows**: Deferred to future release
- **Multi-tenancy**: Basic support via configuration

### Authentication Error Codes
```typescript
// Structured error responses for LLM consumption
{
  "code": "NO_USERS",
  "message": "No users found for environment",
  "suggestedActions": ["CreateUser"],
  "environmentId": "env-123"
}

{
  "code": "UNSUPPORTED_AUTH_METHOD",
  "message": "Developer Endpoint requires NavUserPassword",
  "suggestedActions": ["CreateNavUserPasswordUser"],
  "currentMethod": "AzureAd"
}

{
  "code": "AUTH_ERROR",
  "message": "Invalid credentials after retry",
  "suggestedActions": ["VerifyCredentials", "CheckPermissions"],
  "retryable": false
}
```

## Phase 4: Production Readiness

### Structured Logging
```typescript
// src/utils/logger.ts
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  operation: string;
  requestId: string;
  duration?: number;
  outcome?: 'success' | 'error';
  details?: Record<string, unknown>;
}

export class Logger {
  constructor(
    private readonly level: string = 'info',
    private readonly format: 'json' | 'text' = 'json'
  ) {}

  log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const sanitized = {
      ...entry,
      details: entry.details ? ErrorService.redactObject(entry.details) : undefined
    };

    if (this.format === 'json') {
      console.log(JSON.stringify(sanitized));
    } else {
      console.log(
        `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.operation} ` +
        `(${entry.duration}ms) ${entry.outcome || ''}`
      );
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}
```

### Integration Test Examples
```typescript
// tests/integration/environments.spec.ts
import { describe, it, expect, beforeAll, skipIf } from 'vitest';
import { EnvironmentService } from '@services/environmentService';
import { createTestClient } from '../helpers';

const SKIP_INTEGRATION = !process.env.DEMO_PORTAL_TOKEN;

describe.skipIf(SKIP_INTEGRATION)('Environment Integration Tests', () => {
  let service: EnvironmentService;

  beforeAll(() => {
    if (SKIP_INTEGRATION) {
      console.log('Skipping integration tests: DEMO_PORTAL_TOKEN not set');
      return;
    }

    const client = createTestClient();
    service = new EnvironmentService(client);
  });

  describe('list_environments', () => {
    it('should return array of environments from real API', async () => {
      const result = await service.listEnvironments();

      expect(result.type).toBe('list_environments_result');
      expect(Array.isArray(result.environments)).toBe(true);
      expect(result.environments.length).toBeGreaterThan(0);

      const env = result.environments[0];
      expect(env).toHaveProperty('id');
      expect(env).toHaveProperty('name');
      expect(env).toHaveProperty('status');
      expect(env).toHaveProperty('bcVersion');

      expect(result.count).toBe(result.environments.length);
      expect(result.source.baseUrl).toBeDefined();
      expect(new Date(result.fetchedAt).getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should handle auth errors with redaction', async () => {
      const badClient = createTestClient({ token: 'invalid_token_123' });
      const badService = new EnvironmentService(badClient);

      await expect(badService.listEnvironments()).rejects.toThrow(AuthError);

      try {
        await badService.listEnvironments();
      } catch (error) {
        expect(error.message).not.toContain('invalid_token_123');
        expect(error.message).toContain('[REDACTED]');
      }
    });
  });

  describe('get_environment', () => {
    it('should return environment details', async () => {
      const envId = process.env.CTN_TEST_ENVIRONMENT_ID;
      if (!envId) {
        console.log('Skipping: CTN_TEST_ENVIRONMENT_ID not set');
        return;
      }

      const result = await service.getEnvironment(envId);

      expect(result.type).toBe('get_environment_result');
      expect(result.environment.id).toBe(envId);
      expect(result.environment.details).toBeDefined();
    });

    it('should handle not found with actionable error', async () => {
      const fakeId = crypto.randomUUID();

      await expect(service.getEnvironment(fakeId))
        .rejects.toThrow('Environment not found. Use list_environments');
    });
  });

  describe('start_environment (idempotent)', () => {
    it('should handle already running status gracefully', async () => {
      const envId = process.env.CTN_TEST_ENVIRONMENT_ID;
      if (!envId) return;

      // First ensure it's running
      const current = await service.getEnvironment(envId);
      if (current.environment.status !== 'Running') {
        await service.startEnvironment(envId, { wait: 'untilRunning' });
      }

      // Now test idempotency
      const result = await service.startEnvironment(envId);

      expect(result.status).toBe('no_op');
      expect(result.message).toContain('already running');
      expect(result.previousStatus).toBe('Running');
      expect(result.newStatus).toBe('Running');
    });
  });
});
```

## Project Structure

```
test-env-mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── api/
│   │   ├── httpClient.ts        # Shared HTTP client factory
│   │   ├── demoPortalClient.ts  # Demo Portal API client
│   │   └── devEndpointClient.ts # BC Developer Endpoint client
│   ├── services/
│   │   ├── configurationService.ts
│   │   ├── environmentService.ts
│   │   ├── compilationService.ts
│   │   ├── credentialsService.ts
│   │   └── testRunnerService.ts
│   ├── tools/
│   │   ├── index.ts              # Tool registration
│   │   ├── listEnvironments.ts
│   │   ├── getEnvironment.ts
│   │   ├── startEnvironment.ts
│   │   ├── stopEnvironment.ts
│   │   ├── compileAndPublish.ts
│   │   ├── runTests.ts
│   │   └── getCodeCoverage.ts
│   ├── errors/
│   │   ├── errors.ts             # Error taxonomy
│   │   └── redact.ts             # Secret redaction utility
│   ├── schemas/
│   │   ├── validation.ts         # Zod schemas
│   │   └── transforms.ts         # Data transformations
│   └── utils/
│       ├── logger.ts             # Structured logging
│       └── backoff.ts            # Retry/backoff utilities
├── tests/
│   ├── setup.ts                 # Test configuration
│   ├── helpers.ts               # Test utilities
│   ├── unit/
│   │   ├── transform.spec.ts
│   │   ├── redaction.spec.ts
│   │   └── backoff.spec.ts
│   ├── integration/
│   │   ├── environments.spec.ts
│   │   ├── compilation.spec.ts
│   │   └── tests.spec.ts
│   └── fixtures/
│       ├── hello/                # Test AL project
│       │   ├── app.json
│       │   └── HelloWorld.Page.al
│       ├── test-results.xml      # Sample XML
│       └── coverage.csv          # Sample CSV
├── .env.example
├── .eslintrc.js
├── .gitignore
├── mcp-config.json               # Optional config
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Implementation Timeline

### Week 1: Foundation (Days 1-4)
- **Day 1-2**: Phase 0 - Setup TypeScript, ESLint, testing, CI
- **Day 3-4**: Phase 1 - Core server, configuration, error handling

### Week 2: Environment Management (Days 5-9)
- **Day 5-7**: Phase 2 - Environment tools (list/get/start/stop)
- **Day 8-9**: Phase 2.5 - Compilation and publishing

### Week 3: Test Execution (Days 10-14)
- **Day 10-12**: Phase 3 - Test execution with polling
- **Day 13-14**: Phase 3 - Code coverage parsing

### Week 4: Production Ready (Days 15-20)
- **Day 15-16**: Phase 4 - Structured logging, enhanced errors
- **Day 17-18**: Phase 4 - Performance optimization
- **Day 19-20**: Phase 4 - Documentation and final testing

## Critical Success Factors

1. **Strict TDD Adherence**
   - Write tests first for every feature
   - Use real API, no mocks
   - Verify secret redaction

2. **TypeScript Excellence**
   - Strict mode always on
   - No any types
   - Pre-commit enforcement

3. **Error Handling**
   - Centralized redaction
   - Actionable messages
   - Structured error types

4. **LLM Integration**
   - Consistent JSON structures
   - Clear success/error distinction
   - Helpful remediation guidance

5. **Production Quality**
   - Comprehensive logging
   - Graceful degradation
   - Timeout handling

## Conclusion

This guide provides a complete roadmap for implementing the MCP server with enterprise-grade quality. Follow the phases sequentially, maintain strict TDD discipline, and ensure all code passes TypeScript and linting checks before committing. The result will be a robust, maintainable MCP server that enables LLMs to effectively manage Business Central environments and execute tests.