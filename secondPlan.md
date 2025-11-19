---
⚠️ **DEPRECATION NOTICE** ⚠️

**This document is preserved for historical reference only.**

**For implementation, use:** [`developmentguide.md`](./developmentguide.md)

**Reason:** This revised plan was created via GPT-5 Pro analysis but contains contradictory information and was completed before verifying against the actual Environment Explorer source code. The `developmentguide.md` has been verified against the authoritative codebase and contains accurate implementation details.

**Known Issues in This Document:**
- Contradictory stance on `compile_and_publish` (removed, then restored)
- Incorrect API field names in examples
- Compilation approach needed updating

**Date Deprecated:** 2025-11-16
---

# MCP Server Implementation Plan (Revised v2.0) for Continia Environment Management & Test Execution

## Document Information
- **Version**: 2.0 (Revised via GPT-5 Pro Analysis)
- **Date**: 2025-11-15
- **Analysis Model**: GPT-5 Pro (gpt-5-pro)
- **Focus Areas**: Requirement Coverage, Technical Accuracy
- **Based On**: firstPlan.md v2.0 + CLAUDE.md requirements

---

## KEY DIFFERENCES FROM FIRST PLAN (v1.0 → v2.0)

This section highlights the major changes and improvements identified through GPT-5 Pro's analysis of CLAUDE.md requirements against firstPlan.md.

### 🔴 CRITICAL CHANGES

#### 1. TDD Enforcement (Was: Implementation-First → Now: Tests-First)
**Problem Identified:**
- Original plan described implementing features before tests (Week 2: "Implement list_environments ... Test with real Demo Portal API")
- Did not explicitly forbid mocks/stubs/fakes
- Did not call out red-green-refactor cycle

**Solution Applied:**
- Every phase now follows strict Red-Green-Refactor:
  1. Write failing integration test (real API)
  2. Minimal code to pass
  3. Refactor for clarity
- Explicit "No mocks/stubs/fakes" policy added (Decision 1.12)
- All tests must use real Demo Portal API
- Tests fail-fast if environment variables missing (not skipped)

**Impact:** Aligns with CLAUDE.md lines 26-33: "Write tests first ... Red-Green-Refactor ... No Fakes/Stubs/Mocks"

#### 2. Scope Reduction - "Minimal Code" Enforcement
**Problem Identified:**
- Original plan included compile_and_publish, license upload, full launch.json R/W in MVP
- Project goal is "Execute automated tests" - compilation is scope creep
- Violated "Write only what's necessary" principle (CLAUDE.md lines 21-25)

**Solution Applied:**
- **REMOVED from MVP:**
  - compile_and_publish (Decision 1.5 revised)
  - upload_license
  - get_environment_logs
  - All launch.json write/update/sync operations (Decision 1.4 revised)
  - create_environment (deferred)
  - get_environment_credentials (deferred)
- **MVP NOW INCLUDES ONLY:**
  - Environment basics: list/get/start/stop
  - Test execution: run_tests (block-and-poll), get_code_coverage
  - Structured outputs with robust error handling

**Impact:** Reduces MVP from 11 tools to 6 tools, focusing strictly on test execution needs

**⚠️ CORRECTION APPLIED (Post-Analysis):**
After investigation of the Environment Explorer source code, **compile_and_publish has been RESTORED to MVP**:
- **Reason:** LLM-driven TDD workflow requires: code → compile → publish → test
- **Cannot test new code without publishing it first**
- **Pattern is documented in authoritative source:** `developerEndpoint.ts:12-88`, `alc.ts:471-606`
- **Developer Endpoint publishing IS an Environment Explorer pattern**
- **Revised MVP: 7 tools** (list/get/start/stop/compile_and_publish/run_tests/get_code_coverage)

See updated Decision 1.5 and new Phase 2.5 for implementation details.

#### 3. TypeScript Standards Enforcement (Was: Mentioned → Now: Enforced)
**Problem Identified:**
- Original plan mentioned strict TypeScript and ESLint but didn't specify enforcement
- CLAUDE.md line 38: "ALWAYS compile changes before committing (tsc --noEmit)"

**Solution Applied:**
- **New Decision 1.11: TypeScript Standards Enforcement**
  - Pre-commit hook: `tsc --noEmit && eslint .` blocks commits on failure
  - CI gates: typecheck → lint → integration tests (fail-fast pipeline)
  - Added to Phase 0: Developer Experience & Standards
  - package.json scripts: "typecheck", "lint", "precommit"

**Impact:** Guarantees code quality; no non-compliant code can be committed

#### 4. Removed Tool Redundancy (DRY Principle)
**Problem Identified:**
- Original Decision 1.9: block-and-poll pattern means run_tests returns complete results
- Also defined get_test_results tool - redundant and violates DRY

**Solution Applied:**
- **REMOVED:** get_test_results tool entirely
- **KEPT:** run_tests (returns parsed results after blocking until completion)
- **KEPT:** get_code_coverage (separate tool for optional detailed coverage using jobId)

**Impact:** Eliminates duplication, simpler API surface

### 🟡 IMPORTANT CHANGES

#### 5. Authoritative Knowledge Boundaries Clarified (**CORRECTED**)
**Problem Identified:**
- Original plan included "Developer Endpoint (Direct App Publishing)" (lines 181-185)
- AL Test Runner explicitly states: "NO Direct BC Connection" (firstPlan.md lines 124-130)
- CLAUDE.md: "Reference ONLY these authoritative sources" (lines 8-18)

**Initial Solution:**
- No direct BC Developer Endpoint calls in MVP
- All operations via Demo Portal REST API only

**⚠️ CORRECTION AFTER SOURCE CODE INVESTIGATION:**
- **Developer Endpoint publishing IS documented in Environment Explorer** (`developerEndpoint.ts`)
- **This IS an authoritative pattern** from the knowledge source codebase
- **Pattern:** POST to `{environment.url}/{env.id}/dev/apps` with Basic Auth
- **Credentials:** Retrieved from Demo Portal API via `getEnvironmentUsers()`
- **Updated Decision 1.13:** Developer Endpoint publishing is INCLUDED using Environment Explorer's documented approach

**Impact:** Stays within documented patterns from authoritative sources AND supports complete TDD workflow

#### 6. Secret Redaction Policy Added
**Problem Identified:**
- Original plan: "security not a priority" (line 16-21)
- No explicit guardrail to prevent logging tokens/credentials
- Could inadvertently leak secrets in error messages

**Solution Applied:**
- Decision 1.8 updated with centralized secret redaction
- ErrorService utility redacts Authorization headers and token-like strings
- Integration tests verify secrets are not present in logs/errors
- Actionable errors maintained but sanitized

**Impact:** Prevents accidental credential exposure while keeping helpful error messages

#### 7. Workspace Handling Clarified (Single vs Multiple)
**Problem Identified:**
- Original Decision 1.3: Use process.cwd() - "No workspace path configuration needed"
- Later sections: "Handle multiple workspaces" (line 45-46, 565)
- Contradictory requirements

**Solution Applied:**
- Decision 1.3 updated: Single workspace via process.cwd() for MVP
- Multi-workspace support explicitly deferred
- Eliminates hidden state assumptions

**Impact:** Simpler implementation, clearer scope

#### 8. Integration Test Prerequisites Operationalized
**Problem Identified:**
- Original plan mentioned "real API testing" but didn't specify how
- No defined test environment, credentials management for CI, or data isolation strategy

**Solution Applied:**
- **Required environment variables documented:**
  - `DEMO_PORTAL_TOKEN` (required)
  - `DEMO_PORTAL_BASE_URL` (optional override)
  - `CTN_TEST_ENVIRONMENT_ID` (required for CI tests)
  - `CTN_TEST_CODEUNIT_ID` (recommended for CI tests)
- Tests fail-fast if env vars missing (not skipped) with actionable guidance
- Idempotent test design for start/stop operations

**Impact:** Clear contract for CI/CD integration, reproducible test execution

### 🟢 STRUCTURAL IMPROVEMENTS

#### 9. New Phase 0: Developer Experience & Standards
**Added:** Dedicated phase for setting up quality gates before any feature work
- TDD for the pipeline itself (test that tsc/eslint work correctly)
- Pre-commit hooks setup (Husky or git hooks)
- CI pipeline configuration
- Environment variable validation with actionable errors

**Impact:** Foundations established before feature development begins

#### 10. Updated Roadmap Timeline
**Original:** 5 weeks (Phases 1-5)
**Revised:** 4 weeks (Phase 0-4)
- Week 1: Phase 0 (DevEx) + Phase 1 (Server bootstrap, config)
- Week 2: Phase 2 (Environment basics via TDD)
- Week 3: Phase 3 (Test execution via TDD)
- Week 4: Phase 4 (Hardening, structured logs, docs)

**Impact:** Realistic timeline reflecting reduced scope and TDD discipline

#### 11. Enhanced Tool Specifications (Appendix E)
**Added:** Complete MCP tool specifications with:
- Exact parameter shapes
- Return value structures
- Error message patterns
- Examples of actionable error guidance

**Impact:** Clear contract for LLM interactions, easier to implement and test

### 📊 METRICS: SCOPE COMPARISON

| Aspect | First Plan v2.0 | Second Plan v2.0 (This Document) | Change |
|--------|----------------|----------------------------------|--------|
| **MVP Tools** | 11 tools | 7 tools (corrected from 6) | -36% |
| **Phases** | 5 phases (1-5) | 5 phases (0-2.5-3-4) | Restructured |
| **Timeline** | 5 weeks | 4 weeks | -20% |
| **TDD Enforcement** | Implied | Explicit (every phase) | ✅ |
| **TypeScript Gates** | Mentioned | Enforced (pre-commit + CI) | ✅ |
| **No Mocks Policy** | Not stated | Explicit policy | ✅ |
| **Secret Redaction** | Not addressed | Centralized utility | ✅ |
| **Knowledge Boundaries** | Loose | Documented (Dev Endpoint via Explorer) | ✅ |
| **Test Prerequisites** | Vague | Documented env vars | ✅ |
| **compile_and_publish** | In MVP (FirstPlan) | Removed, then RESTORED | ⚠️ Corrected |

### 🎯 WHAT STAYED THE SAME (Good Decisions Preserved)

The following aspects from firstPlan.md were validated and retained:
- ✅ MCP focus with structured, LLM-friendly responses
- ✅ Layered architecture (Tools → Services → API Client)
- ✅ Real-environment integration testing emphasis
- ✅ TypeScript with @modelcontextprotocol/sdk framework choice
- ✅ Environment variables for authentication (DEMO_PORTAL_TOKEN)
- ✅ Block-and-poll pattern for test execution
- ✅ Exception-based error handling with actionable messages
- ✅ References to authoritative knowledge sources (Environment Explorer, AL Test Runner)
- ✅ Iterative development approach
- ✅ Axios for HTTP client (consistency with existing code)

---

## Executive Summary

This revised plan enforces strict TDD with a tests-first workflow, minimizes scope to only what's essential for environment basics, code publishing, and test execution. It removes redundant tools and hard-enforces TypeScript standards via pre-commit and CI gates. It keeps the layered MCP architecture, structured responses, and real-environment integration testing. Operations use both Demo Portal REST API (environment management, credentials) and BC Developer Endpoint (code publishing) per the authoritative Environment Explorer patterns. Secrets are centrally redacted in logs and error messages.

**Key Principles:**
1. **Test-First Development**: Write failing integration test → minimal implementation → refactor
2. **Real Implementations Only**: No mocks, stubs, or fakes - all tests hit real APIs
3. **Minimal Code**: Only 7 tools in MVP (list/get/start/stop environments + compile_and_publish + run_tests + get_code_coverage)
4. **Enforced Quality**: Pre-commit and CI gates for TypeScript compilation and linting
5. **Secret Safety**: Centralized redaction of tokens and credentials in all outputs
6. **LLM-Driven TDD**: Support complete workflow: code → compile → publish → test → iterate

---

## 1. Architectural Decisions (Q&A Session Results)

### Decision Summary

The following decisions supersede and refine the original plan where noted.

#### 1.1 Authentication & Security 🔴 CRITICAL
**Decision:** Environment variables for API token storage (unchanged)
**Rationale:** Internal use, simplest implementation
**Implementation:**
- Required: `DEMO_PORTAL_TOKEN`
- Optional: `DEMO_PORTAL_BASE_URL` (default: https://demoportaldev.continiaonline.com/api/v1.0)
- **Update:** Add centralized secret redaction for logs/errors. No plaintext tokens in any output.

#### 1.2 Test Discovery Mechanism ⚠️ MEDIUM
**Decision:** Hybrid with explicit IDs from the LLM (unchanged)
**Rationale:** MVP simplicity and flexibility
**Implementation:**
- LLM provides explicit codeunit IDs and optional method names
- No workspace parsing or auto-discovery in MVP
- Future: AL file parsing if needed

#### 1.3 Workspace Path Resolution ⚠️ MEDIUM
**Decision:** Single workspace via `process.cwd()` (**clarified**)
**Rationale:** MVP minimality; avoid multi-workspace complexity
**Implementation:**
- All relative paths resolve from `process.cwd()`
- Multi-workspace support explicitly deferred to post-MVP

#### 1.4 Launch.json Management Scope 🔴 CHANGED
**Decision:** Deferred from MVP (**revised from full R/W**)
**Rationale:** Minimal Code - test execution doesn't require launch.json manipulation
**Implementation:**
- No write/update/sync in MVP
- Read-only listing (list_launch_configs) also deferred
- Test execution operates independently of launch.json

#### 1.5 AL Compilation & Publishing Support 🔴 CHANGED → ⚠️ RESTORED
**Decision:** **INCLUDED in MVP** (removed, then restored after source code investigation)
**Rationale:** **Essential for LLM-driven TDD workflow** - cannot test new code without publishing it first
**Implementation:** Based on Environment Explorer's documented patterns
- **Compilation:** Use VS Code AL extension's `alc.exe` compiler
  - Reference: `alc.ts:471-537` (Environment Explorer)
  - Invoke with `/project`, `/packagecachepath`, optional `/ruleset`
  - Output: `{publisher}_{name}_{version}.app` file
- **Publishing:** POST to BC Developer Endpoint
  - Reference: `developerEndpoint.ts:12-88` (Environment Explorer)
  - Endpoint: `POST {environment.url}/{env.id}/dev/apps?tenant=default&SchemaUpdateMode={mode}`
  - Authentication: Basic auth with BC credentials (retrieved via Demo Portal API)
  - FormData multipart upload of .app file
- **Integration:** Credentials retrieved from Demo Portal, publishing to Developer Endpoint
- **This IS an authoritative pattern** documented in the Environment Explorer codebase

#### 1.6 MCP Framework Choice ✅ HIGH
**Decision:** TypeScript with @modelcontextprotocol/sdk (unchanged)
**Rationale:** Aligns with project requirements in CLAUDE.md
**Implementation:**
- Use official MCP SDK
- Follow TypeScript best practices
- Enable strict TypeScript compiler options
- Configure ESLint with TypeScript parser

#### 1.7 Development Approach 🔴 CHANGED
**Decision:** Strict TDD (**updated from "iterative development"**)
**Rationale:** Align with CLAUDE.md requirements
**Implementation:** For every feature:
1. Write failing integration test (real API)
2. Minimal code to pass
3. Refactor (improve design; maintain clarity)
4. Enforce compile/lint gates before commit

#### 1.8 Error Handling Strategy ✅ HIGH (Updated)
**Decision:** Exception-based with actionable messages (unchanged), plus secret redaction (**updated**)
**Rationale:** LLM-friendly guidance and safety
**Implementation:**
- Central error utility maps HTTP/network exceptions to actionable messages
- Never include tokens, credentials, or raw headers
- Advise specific next steps in error text when appropriate
- Example: `throw new Error('Environment not running. Call start_environment first.')`

#### 1.9 Test Execution Pattern ⚠️ MEDIUM (Updated)
**Decision:** Block-and-poll (unchanged) and remove get_test_results (**updated**)
**Rationale:** Simplicity; DRY principle
**Implementation:**
- `run_tests` submits job and polls until completion; returns parsed results
- `get_test_results` removed from MVP to avoid redundancy
- `get_code_coverage` retained (optional post-run detail using jobId returned by run_tests)
- Implement exponential backoff polling strategy
- Handle timeouts gracefully with actionable errors

#### 1.10 Configuration Management ⚠️ MEDIUM (Trimmed)
**Decision:** Config file + env variables (trimmed)
**Rationale:** Minimal yet flexible
**Implementation:**
- **Config file (mcp-config.json):**
  - `api.url` (optional override)
  - Test polling settings (timeout, intervals)
  - Logging configuration (level, format)
- **Environment variables:**
  - `DEMO_PORTAL_TOKEN` - API authentication token (required)
  - `DEMO_PORTAL_BASE_URL` - Optional API URL override
  - `CTN_TEST_ENVIRONMENT_ID` - Test environment for CI (required for integration tests)
  - `CTN_TEST_CODEUNIT_ID` - Test codeunit for CI (recommended)
- **Workspace detection:**
  - Automatically derived from `process.cwd()`
  - No launch.json paths in MVP

#### 1.11 TypeScript Standards Enforcement 🔴 NEW
**Decision:** Hard enforcement via pre-commit and CI
**Rationale:** Guarantee code quality and compliance with CLAUDE.md requirements
**Implementation:**
- **Pre-commit hook:** `tsc --noEmit && eslint .` (blocks commits on failure)
- **CI gates:**
  1. `tsc --noEmit` (must pass)
  2. `eslint .` (must pass)
  3. Integration tests (fail-fast if secrets missing)
- **package.json scripts:**
  - `"typecheck": "tsc --noEmit"`
  - `"lint": "eslint . --ext .ts"`
  - `"precommit": "npm run typecheck && npm run lint"`
  - `"test:integration": "node ./scripts/run-integration-tests.js"`

#### 1.12 Testing Policy 🔴 NEW
**Decision:** No mocks/stubs/fakes
**Rationale:** Real behavior verification per CLAUDE.md lines 29-33
**Implementation:**
- All tests use real implementations; real Demo Portal API
- If required env vars not present, tests fail with actionable error (not skipped)
- Tests structured to be idempotent (start/stop operations tolerate current state)
- Example fail-fast error: `"DEMO_PORTAL_TOKEN not set. Set it via: export DEMO_PORTAL_TOKEN=your_token"`

#### 1.13 Authoritative Knowledge Boundaries 🔴 NEW → ⚠️ CLARIFIED
**Decision:** Only use the two designated codebases for implementation patterns
**Rationale:** Avoid drift from documented patterns (CLAUDE.md lines 8-18)
**Implementation:** (**Updated after source code investigation**)
- **Demo Portal REST API** for environment management and credentials
  - Reference: `demoportal.ts` (Environment Explorer)
  - Operations: list/get/start/stop environments, get users/credentials
- **BC Developer Endpoint** for code publishing (**IS documented in authoritative sources**)
  - Reference: `developerEndpoint.ts:12-88` (Environment Explorer)
  - Pattern: POST to `{environment.url}/{env.id}/dev/apps` with Basic Auth
  - Credentials retrieved from Demo Portal API
  - **This IS an Environment Explorer pattern** - not external to authoritative sources
- **AL Compilation** via VS Code AL extension's `alc.exe`
  - Reference: `alc.ts:471-537` (Environment Explorer)
  - Pattern: Spawn `alc.exe` with project/packagecache paths
- Any future features must be justified with explicit references to the authoritative sources

---

## 2. Architecture Overview

### 2.1 Current Architecture Analysis (Condensed for MVP)

#### Environment Explorer
- **Core API:** Demo Portal REST API (`demoportal.ts`)
- **Authentication:** Bearer token for API
- **Environment Management:** Full lifecycle via REST API
- **Test Execution:** Via `/environments/{id}/tests/jobs.json` endpoint

#### AL Test Runner
- **Test Discovery:** Regex-based AL file parsing (not used in MVP)
- **Execution:** Delegates entirely to Environment Explorer
- **Results:** XML test results + CSV code coverage
- **NO Direct BC Connection:** All operations through Environment Explorer commands

### 2.2 Proposed MCP Server Architecture

```
LLM (Claude/GPT)
        ↓
MCP Protocol Interface
        ↓
┌─────────────────────────────────────┐
│        MCP Server (TypeScript)       │
├─────────────────────────────────────┤
│  Tools Layer (MCP Tool Definitions)  │
│  - Thin parameter validation         │
│  - Delegates to services             │
├─────────────────────────────────────┤
│     Service Layer (Business Logic)   │
│  ├── EnvironmentService              │
│  │   └── list, get, start, stop      │
│  ├── CompilationService              │
│  │   └── compile_and_publish         │
│  ├── TestRunnerService               │
│  │   └── run_tests, get_code_coverage│
│  ├── ConfigurationService            │
│  │   └── config/env resolution       │
│  └── ErrorService                    │
│      └── redaction & translation     │
├─────────────────────────────────────┤
│       API Client Layer               │
│  └── DemoPortalClient                │
│      └── Axios + interceptors        │
├─────────────────────────────────────┤
│       Storage Layer                  │
│  └── None in MVP                     │
└─────────────────────────────────────┘
        ↓
Demo Portal REST API
        ↓
Business Central Environments
```

**Key Architectural Principles:**
- **SOLID:** Single responsibility per service, interface-based contracts
- **DRY:** Shared error handling, HTTP client configuration, response parsing
- **Minimal Code:** Only 6 tools, no launch.json manipulation, no compilation in MVP

---

## 3. Integration Points & Data Flow

### 3.1 Demo Portal REST API (Primary Interface)

**Base Configuration:**
- Base URL: `DEMO_PORTAL_BASE_URL` or default `https://demoportaldev.continiaonline.com/api/v1.0`
- Authentication: Bearer token via `Authorization: Bearer ${DEMO_PORTAL_TOKEN}`
- All environment and test operations

**API Endpoints:**
- **Environments:**
  - `GET /environments.json` - List all environments
  - `GET /environments/{id}.json` - Get environment details
  - `PATCH /environments/{id}.json` - Update environment (start/stop)

- **Test Execution:**
  - `POST /environments/{id}/tests/jobs.json` - Start test job
  - `GET /environments/{id}/tests/jobs/{jobId}.xml` - Poll for results
  - `GET /environments/{id}/tests/jobs/{jobId}/codecoverage.csv` - Get coverage data

### 3.2 Data Structures (MCP Tool Contracts)

#### run_tests Tool
**Input:**
```typescript
{
  environmentId: string;        // Required
  codeunitId?: number;          // Optional - run specific codeunit
  testMethod?: string;          // Optional - run specific method
  includeCoverage?: boolean;    // Optional - include coverage in response (default: false)
  timeoutSeconds?: number;      // Optional - override default timeout
}
```

**Output:**
```typescript
{
  jobId: string;
  status: "completed" | "failed" | "timed_out";
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
  };
  failures?: Array<{
    codeunitId: number;
    method?: string;
    message: string;
  }>;
  coverage?: {
    linesCovered: number;
    linesTotal: number;
    percent: number;
  };
}
```

#### get_code_coverage Tool
**Input:**
```typescript
{
  environmentId: string;
  jobId: string;
}
```

**Output:**
```typescript
{
  linesCovered: number;
  linesTotal: number;
  percent: number;
}
```

**Note:** Default responses omit raw XML/CSV artifacts to keep outputs concise. Raw data can be added via optional flags if needed.

---

## 4. Implementation Strategy

**Strict TDD:** Every phase uses the Red-Green-Refactor loop. All tests are real integration tests. No mocks/stubs/fakes.

### Phase 0: Developer Experience & Standards (TDD for Pipeline)

**Objectives:**
- Establish quality gates before any feature work
- Validate TypeScript strict mode and ESLint configuration
- Set up pre-commit hooks and CI pipeline
- Test environment variable validation

**Tests-First:**
```typescript
// Test 1: Environment variable validation
test('server startup fails fast when DEMO_PORTAL_TOKEN missing', () => {
  delete process.env.DEMO_PORTAL_TOKEN;
  expect(() => startServer()).toThrow('DEMO_PORTAL_TOKEN not set');
});

// Test 2: TypeScript compilation
test('tsc --noEmit reports no errors', () => {
  const result = execSync('tsc --noEmit');
  expect(result.exitCode).toBe(0);
});

// Test 3: ESLint validation
test('eslint reports no errors', () => {
  const result = execSync('eslint . --ext .ts');
  expect(result.exitCode).toBe(0);
});
```

**Implement:**
- `tsconfig.json` with `strict: true`
- ESLint with TypeScript parser and recommended rules
- package.json scripts:
  - `"typecheck": "tsc --noEmit"`
  - `"lint": "eslint . --ext .ts"`
  - `"test:integration": "jest --config jest.integration.config.js"`
  - `"precommit": "npm run typecheck && npm run lint"`
- Pre-commit hook via Husky or simple git hooks calling `typecheck && lint`
- CI pipeline (GitHub Actions/Azure DevOps):
  1. Setup Node
  2. `npm ci`
  3. `npm run typecheck`
  4. `npm run lint`
  5. `npm run test:integration` (fails fast if env vars missing)

**Refactor:**
- Consolidate config loader utility
- Centralize environment variable validation
- Extract reusable CI workflow templates

**Definition of Done:**
- ✅ Commits are blocked if `tsc` or `eslint` fails
- ✅ CI fails when secrets absent or standards not met
- ✅ Clear actionable error messages guide developers to fix issues

### Phase 1: Core MCP Server & Configuration

**Objectives:**
- Bootstrap MCP server with minimal tool set
- Implement configuration management
- Create error handling with secret redaction

**Tests-First:**
```typescript
// Test 1: Server initialization
test('MCP server starts and exposes tool list', async () => {
  const server = await startMCPServer();
  const tools = await server.listTools();
  expect(tools).toBeInstanceOf(Array);
  expect(tools.length).toBe(0); // Initially empty
});

// Test 2: Configuration resolution
test('ConfigurationService resolves token from env', () => {
  process.env.DEMO_PORTAL_TOKEN = 'test-token';
  const config = new ConfigurationService();
  expect(config.getApiToken()).toBe('test-token');
});

// Test 3: Missing token error
test('ConfigurationService throws actionable error when token missing', () => {
  delete process.env.DEMO_PORTAL_TOKEN;
  expect(() => new ConfigurationService()).toThrow(
    'DEMO_PORTAL_TOKEN not set. Set it via: export DEMO_PORTAL_TOKEN=your_token'
  );
});

// Test 4: Secret redaction
test('ErrorService redacts Authorization header from error messages', () => {
  const error = new Error('Request failed with headers: Authorization: Bearer secret123');
  const redacted = ErrorService.redact(error);
  expect(redacted.message).not.toContain('secret123');
  expect(redacted.message).toContain('[REDACTED]');
});
```

**Implement:**
- Minimal MCP server bootstrap using `@modelcontextprotocol/sdk`
- `ConfigurationService`:
  - Read `DEMO_PORTAL_TOKEN`, `DEMO_PORTAL_BASE_URL` from env
  - Merge with `mcp-config.json` (optional file)
  - Validate required values, throw actionable errors
- `ErrorService`:
  - Utility to redact Authorization headers
  - Redact token-like strings (patterns: Bearer, api_key, token, etc.)
  - Preserve actionable error guidance
- Shared Axios instance with request/response interceptors:
  - Add Authorization header
  - Log requests/responses (with redaction) based on config log level

**Refactor:**
- Extract HTTP client configuration to separate module
- Create type definitions for all configuration shapes
- Consolidate error message templates

**Definition of Done:**
- ✅ Server boots successfully with valid env vars
- ✅ Server fails fast with actionable error when env vars missing
- ✅ Config and error redaction validated by integration tests
- ✅ No tokens visible in logs or error messages

### Phase 2: Environment Basics (list/get/start/stop)

**Objectives:**
- Implement core environment management tools
- Validate against real Demo Portal API
- Ensure idempotent operations

**Tests-First:**
```typescript
// Test 1: list_environments
test('list_environments returns array of environments from real API', async () => {
  const envService = new EnvironmentService(configService, apiClient);
  const environments = await envService.list();
  expect(Array.isArray(environments)).toBe(true);
  expect(environments.length).toBeGreaterThan(0);
  expect(environments[0]).toHaveProperty('id');
  expect(environments[0]).toHaveProperty('name');
  expect(environments[0]).toHaveProperty('state');
});

// Test 2: get_environment
test('get_environment returns details for CTN_TEST_ENVIRONMENT_ID', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const envService = new EnvironmentService(configService, apiClient);
  const environment = await envService.get(envId);
  expect(environment.id).toBe(envId);
  expect(environment).toHaveProperty('name');
  expect(environment).toHaveProperty('state');
  expect(environment).toHaveProperty('details');
});

// Test 3: start_environment (idempotent)
test('start_environment transitions stopped env to running', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const envService = new EnvironmentService(configService, apiClient);

  // Get current state
  const before = await envService.get(envId);

  // Start environment (should succeed regardless of current state)
  const result = await envService.start(envId);
  expect(result.id).toBe(envId);
  expect(['running', 'starting']).toContain(result.newState);

  // Verify state change or idempotency message
  if (before.state === 'running') {
    expect(result.message).toContain('already running');
  }
});

// Test 4: stop_environment (idempotent)
test('stop_environment transitions running env to stopped', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const envService = new EnvironmentService(configService, apiClient);

  // Get current state
  const before = await envService.get(envId);

  // Stop environment
  const result = await envService.stop(envId);
  expect(result.id).toBe(envId);
  expect(['stopped', 'stopping']).toContain(result.newState);

  // Verify state change or idempotency message
  if (before.state === 'stopped') {
    expect(result.message).toContain('already stopped');
  }
});

// Test 5: Error handling - invalid environment ID
test('get_environment throws actionable error for invalid ID', async () => {
  const envService = new EnvironmentService(configService, apiClient);
  await expect(envService.get('invalid-id-999')).rejects.toThrow(
    'Environment not found. Use list_environments to see available environments.'
  );
});
```

**Implement:**
- `EnvironmentService` with methods:
  - `list()` → GET `/environments.json`
  - `get(id)` → GET `/environments/{id}.json`
  - `start(id)` → PATCH `/environments/{id}.json` with appropriate payload
  - `stop(id)` → PATCH `/environments/{id}.json` with appropriate payload
- MCP Tools registration:
  - `list_environments`
  - `get_environment`
  - `start_environment`
  - `stop_environment`
- Actionable errors:
  - "Environment not found. Use list_environments to see available environments."
  - "Environment already running; no action taken."
  - "API authentication failed. Verify DEMO_PORTAL_TOKEN is valid."

**Refactor:**
- DRY request/response mapping (extract common patterns)
- Consistent output schema across all environment tools
- Centralized error translation (HTTP status → actionable message)

**Definition of Done:**
- ✅ All four tools pass integration tests against real API
- ✅ Idempotent operations handle current state gracefully
- ✅ Outputs are structured and consistent
- ✅ Error messages are actionable and don't expose secrets
- ✅ No mocks/stubs/fakes used in tests

**Note:** `create_environment` and `get_environment_credentials` deferred to post-MVP per Minimal Code principle.

### Phase 2.5: Code Compilation & Publishing (compile_and_publish)

**Objectives:**
- Implement AL code compilation using VS Code's `alc.exe`
- Implement code publishing to BC Developer Endpoint
- Support LLM-driven TDD workflow (code → compile → publish → test)

**Tests-First:**
```typescript
// Test 1: compile_and_publish with valid AL project
test('compile_and_publish compiles and publishes code to environment', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const workspacePath = process.env.CTN_TEST_WORKSPACE_PATH!; // Path to test AL project

  const compilationService = new CompilationService(configService, demoPortalClient);
  const result = await compilationService.compileAndPublish({
    workspacePath: workspacePath,
    environmentId: envId,
    schemaUpdateMode: 'synchronize'
  });

  expect(result.compiled).toBe(true);
  expect(result.published).toBe(true);
  expect(result.appPath).toBeDefined();
  expect(result.appPath).toMatch(/\.app$/);
}, 180000); // 3 minute timeout for compilation + publishing

// Test 2: compile_and_publish handles compilation errors
test('compile_and_publish reports compilation errors with actionable guidance', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const badWorkspacePath = '/path/to/invalid/project';

  const compilationService = new CompilationService(configService, demoPortalClient);

  await expect(compilationService.compileAndPublish({
    workspacePath: badWorkspacePath,
    environmentId: envId
  })).rejects.toThrow(/Compilation failed|app.json not found|workspace path invalid/i);
}, 60000);

// Test 3: compile_and_publish retrieves credentials and publishes
test('compile_and_publish retrieves BC credentials and publishes to Developer Endpoint', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const workspacePath = process.env.CTN_TEST_WORKSPACE_PATH!;

  const compilationService = new CompilationService(configService, demoPortalClient);

  // Should retrieve credentials from Demo Portal API
  // Should POST to {environment.url}/{env.id}/dev/apps
  // Should use Basic Auth with retrieved credentials

  const result = await compilationService.compileAndPublish({
    workspacePath: workspacePath,
    environmentId: envId
  });

  expect(result.published).toBe(true);
}, 180000);

// Test 4: Secret redaction in errors
test('compilation/publishing errors do not expose credentials', async () => {
  const envId = 'invalid-env-id';
  const workspacePath = process.env.CTN_TEST_WORKSPACE_PATH!;

  const compilationService = new CompilationService(configService, demoPortalClient);

  try {
    await compilationService.compileAndPublish({
      workspacePath: workspacePath,
      environmentId: envId
    });
    fail('Should have thrown error');
  } catch (error: any) {
    expect(error.message).not.toContain(process.env.DEMO_PORTAL_TOKEN);
    expect(error.message).not.toMatch(/password|Basic [A-Za-z0-9+\/=]+/i);
  }
});

// Test 5: Schema update modes
test('compile_and_publish supports different schema update modes', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const workspacePath = process.env.CTN_TEST_WORKSPACE_PATH!;

  const compilationService = new CompilationService(configService, demoPortalClient);

  // Test with forcesync mode
  const result = await compilationService.compileAndPublish({
    workspacePath: workspacePath,
    environmentId: envId,
    schemaUpdateMode: 'forcesync'
  });

  expect(result.published).toBe(true);
}, 180000);
```

**Implement:**
- `CompilationService` with methods:
  - `compileAndPublish(params)`:
    1. **Locate alc.exe**: Find VS Code AL extension's compiler
       - Reference: `alc.ts:480` (Environment Explorer)
       - Search in VS Code extensions directory
    2. **Read app.json**: Parse workspace app.json for app metadata
       - Publisher, name, version for output filename
    3. **Invoke compiler**: Spawn `alc.exe` with args
       - `/project:{workspacePath}`
       - `/packagecachepath:{workspacePath}/.alpackages`
       - `/out:{outputPath}` (if needed)
    4. **Verify .app file**: Check that `{publisher}_{name}_{version}.app` was created
    5. **Get credentials**: Call `demoPortalClient.getEnvironmentUsers(envId)`
       - Reference: `demoportal.ts:621` (Environment Explorer)
    6. **Get environment details**: Call `demoPortalClient.getEnvironment(envId)` for URL
    7. **Prepare FormData**: Create multipart/form-data with .app file
       - Reference: `developerEndpoint.ts:46-51` (Environment Explorer)
    8. **POST to Developer Endpoint**:
       - URL: `{environment.url}/{environment.id}/dev/apps?tenant=default&SchemaUpdateMode={mode}`
       - Reference: `developerEndpoint.ts:39` (Environment Explorer)
       - Headers: Basic Auth + FormData headers
       - Body: Multipart with .app file
    9. **Handle response**: Parse success/failure, provide actionable errors
- MCP Tool registration:
  - `compile_and_publish`
- Schema update mode mapping:
  - Reference: `developerEndpoint.ts:79-88` (Environment Explorer)
  - "synchronize" (default), "forcesync", "recreate"
- Actionable errors:
  - "Compilation failed: {error details}. Check AL code for syntax errors."
  - "alc.exe not found. Install VS Code AL extension."
  - "app.json not found in workspace. Verify workspace path points to AL project root."
  - "Publishing failed: Environment not running. Call start_environment first."
  - "Publishing failed: Invalid credentials. Verify environment permissions."

**Refactor:**
- Extract alc.exe locator to utility function
- Extract app.json parser to utility
- Extract Developer Endpoint client to separate module (with redaction)
- DRY credential retrieval pattern

**Definition of Done:**
- ✅ compile_and_publish passes integration tests with real AL project
- ✅ Compilation errors are caught and reported with actionable guidance
- ✅ Publishing to Developer Endpoint works with retrieved credentials
- ✅ Schema update modes function correctly
- ✅ Secrets are redacted from all error messages
- ✅ No mocks/stubs/fakes - real `alc.exe` compilation and real Developer Endpoint publishing

**Implementation References:**
- Environment Explorer `alc.ts:471-606` - Complete compilation and publishing workflow
- Environment Explorer `developerEndpoint.ts:12-88` - Developer Endpoint publishing pattern
- Environment Explorer `demoportal.ts:621` - Credential retrieval pattern

### Phase 3: Test Execution (run_tests + get_code_coverage)

**Objectives:**
- Implement test execution with block-and-poll pattern
- Parse XML results and CSV coverage
- Validate timeout and backoff behavior

**Tests-First:**
```typescript
// Test 1: run_tests with codeunit ID
test('run_tests executes test and returns parsed summary', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const codeunitId = parseInt(process.env.CTN_TEST_CODEUNIT_ID!);

  const testService = new TestRunnerService(configService, apiClient);
  const result = await testService.runTests({
    environmentId: envId,
    codeunitId: codeunitId
  });

  expect(result.jobId).toBeDefined();
  expect(result.status).toMatch(/completed|failed/);
  expect(result.summary).toHaveProperty('passed');
  expect(result.summary).toHaveProperty('failed');
  expect(result.summary).toHaveProperty('skipped');
  expect(result.summary).toHaveProperty('durationMs');
  expect(typeof result.summary.passed).toBe('number');
}, 120000); // 2 minute timeout for real test execution

// Test 2: run_tests with coverage
test('run_tests includes coverage when requested', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const codeunitId = parseInt(process.env.CTN_TEST_CODEUNIT_ID!);

  const testService = new TestRunnerService(configService, apiClient);
  const result = await testService.runTests({
    environmentId: envId,
    codeunitId: codeunitId,
    includeCoverage: true
  });

  expect(result.coverage).toBeDefined();
  expect(result.coverage).toHaveProperty('linesCovered');
  expect(result.coverage).toHaveProperty('linesTotal');
  expect(result.coverage).toHaveProperty('percent');
}, 120000);

// Test 3: run_tests timeout handling
test('run_tests returns timeout error when exceeding configured timeout', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const testService = new TestRunnerService(configService, apiClient);

  await expect(testService.runTests({
    environmentId: envId,
    codeunitId: 999999, // Non-existent codeunit to trigger long wait
    timeoutSeconds: 5 // Very short timeout
  })).rejects.toThrow(
    'Test execution timed out after 5 seconds. Check environment status and try again.'
  );
}, 10000);

// Test 4: get_code_coverage
test('get_code_coverage returns coverage for completed job', async () => {
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const codeunitId = parseInt(process.env.CTN_TEST_CODEUNIT_ID!);

  const testService = new TestRunnerService(configService, apiClient);

  // First run test to get jobId
  const testResult = await testService.runTests({
    environmentId: envId,
    codeunitId: codeunitId
  });

  // Then get coverage separately
  const coverage = await testService.getCodeCoverage({
    environmentId: envId,
    jobId: testResult.jobId
  });

  expect(coverage).toHaveProperty('linesCovered');
  expect(coverage).toHaveProperty('linesTotal');
  expect(coverage).toHaveProperty('percent');
  expect(coverage.percent).toBeGreaterThanOrEqual(0);
  expect(coverage.percent).toBeLessThanOrEqual(100);
}, 120000);

// Test 5: Polling backoff validation
test('run_tests uses exponential backoff during polling', async () => {
  // This test monitors polling intervals to ensure backoff is working
  const envId = process.env.CTN_TEST_ENVIRONMENT_ID!;
  const codeunitId = parseInt(process.env.CTN_TEST_CODEUNIT_ID!);

  const pollIntervals: number[] = [];
  const testService = new TestRunnerService(configService, apiClient, {
    onPoll: (interval) => pollIntervals.push(interval)
  });

  await testService.runTests({ environmentId: envId, codeunitId });

  // Verify intervals increase (exponential backoff)
  for (let i = 1; i < pollIntervals.length; i++) {
    expect(pollIntervals[i]).toBeGreaterThanOrEqual(pollIntervals[i-1]);
  }

  // Verify intervals are capped
  const maxInterval = configService.get('test.maxPollIntervalMs');
  pollIntervals.forEach(interval => {
    expect(interval).toBeLessThanOrEqual(maxInterval);
  });
}, 120000);

// Test 6: Secret redaction in errors
test('test execution errors do not contain tokens', async () => {
  const envId = 'invalid-env-id';
  const testService = new TestRunnerService(configService, apiClient);

  try {
    await testService.runTests({ environmentId: envId, codeunitId: 50000 });
    fail('Should have thrown error');
  } catch (error: any) {
    expect(error.message).not.toContain(process.env.DEMO_PORTAL_TOKEN);
    expect(error.message).not.toContain('Bearer');
    expect(error.message).toContain('Environment not found');
  }
});
```

**Implement:**
- `TestRunnerService` with methods:
  - `runTests(params)`:
    1. POST to start job → get jobId
    2. Poll GET `/environments/{id}/tests/jobs/{jobId}.xml` with exponential backoff
    3. Parse XML results to structured summary
    4. If `includeCoverage=true`, fetch and parse CSV coverage
    5. Return complete result object
  - `getCodeCoverage(params)`:
    - GET `/environments/{id}/tests/jobs/{jobId}/codecoverage.csv`
    - Parse CSV to structured coverage object
- XML Parser:
  - Extract test results (passed/failed/skipped)
  - Extract failure messages and stack traces
  - Calculate duration
- CSV Parser:
  - Parse code coverage data
  - Calculate coverage percentage
- Polling Strategy:
  - Initial interval: 2000ms (configurable)
  - Backoff factor: 2 (configurable)
  - Max interval: 30000ms (configurable)
  - Max retries based on timeout

**Refactor:**
- Extract XML/CSV parsing to separate utilities
- Consolidate retry/backoff logic into reusable helper
- Ensure all polling parameters are configurable via `mcp-config.json`

**Definition of Done:**
- ✅ `run_tests` and `get_code_coverage` pass integration tests with real API
- ✅ Block-and-poll pattern works correctly with real test jobs
- ✅ Exponential backoff implemented and validated
- ✅ Timeout handling works with actionable error messages
- ✅ No sensitive values in logs/errors
- ✅ `get_test_results` tool not present (removed per DRY)

### Phase 4: Hardening, Documentation, and Observability

**Objectives:**
- Finalize structured logging
- Add comprehensive error scenarios
- Document all tools and prerequisites
- Performance testing and optimization

**Tests-First:**
```typescript
// Test 1: Structured logging
test('all operations log structured JSON with request metadata', async () => {
  const logs: any[] = [];
  const logger = createTestLogger(logs);

  const envService = new EnvironmentService(configService, apiClient, logger);
  await envService.list();

  const logEntry = logs.find(l => l.operation === 'list_environments');
  expect(logEntry).toBeDefined();
  expect(logEntry).toHaveProperty('requestId');
  expect(logEntry).toHaveProperty('duration');
  expect(logEntry).toHaveProperty('outcome');
  expect(logEntry.outcome).toBe('success');
});

// Test 2: Rate limit handling
test('API rate limit responses produce actionable retry guidance', async () => {
  // This test may need to be run in a controlled environment or mocked
  // if we cannot reliably trigger rate limits
  // For now, document the expected behavior

  // Expected error message format:
  // "API rate limit exceeded. Retry after 60 seconds with exponential backoff."
});

// Test 3: Logging respects configuration
test('logging level filters messages appropriately', () => {
  const debugLogs: any[] = [];
  const infoLogs: any[] = [];

  const debugLogger = createTestLogger(debugLogs, 'debug');
  const infoLogger = createTestLogger(infoLogs, 'info');

  debugLogger.debug('Debug message');
  debugLogger.info('Info message');

  infoLogger.debug('Debug message');
  infoLogger.info('Info message');

  expect(debugLogs.length).toBe(2);
  expect(infoLogs.length).toBe(1); // Only info message
});

// Test 4: Tool response schema consistency
test('all tools return responses with consistent structure', async () => {
  // Verify that all tool responses include:
  // - Clear success/error indicators
  // - Structured data (no raw strings as primary output)
  // - Actionable next steps in error cases
});
```

**Implement:**
- Structured JSON logging:
  - Request ID generation
  - Duration tracking
  - Outcome status (success/error)
  - Tool name and parameters (with redaction)
- Enhanced error scenarios:
  - Network timeouts
  - API rate limits
  - Invalid API responses
  - Partial failures
- Comprehensive documentation:
  - README with setup instructions
  - Tool usage examples
  - Environment variable reference
  - Troubleshooting guide
- Performance considerations:
  - Connection pooling
  - Request timeout configuration
  - Backoff strategy tuning

**Refactor:**
- Minor service extraction to improve readability
- Ensure SOLID adherence (especially Single Responsibility)
- Code comments and JSDoc for public APIs

**Definition of Done:**
- ✅ Documented tool usage and environment prerequisites
- ✅ All integration tests green
- ✅ CI pipeline green
- ✅ Structured logging validated
- ✅ Error scenarios covered with actionable guidance
- ✅ Performance acceptable for typical use cases (measured)

---

## 5. Technical Challenges & Solutions

### 5.1 Secrets Exposure in Logs 🔴 Critical
**Challenge:** Tokens and credentials could leak in logs or error messages

**Solution:**
- Central `ErrorService.redact()` utility
- Redacts: Authorization headers, Bearer tokens, API keys, token-like patterns
- Applied to:
  - All error messages before throwing
  - All log entries (request/response logging)
  - Tool response error details
- Unit/integration tests verify absence of secrets in all outputs
- Example pattern: Replace `Authorization: Bearer abc123` with `Authorization: Bearer [REDACTED]`

### 5.2 Test Polling Variability 🟡 Important
**Challenge:** Test execution times vary widely; need smart polling

**Solution:**
- Exponential backoff with cap:
  - Initial: 2000ms
  - Factor: 2x per retry
  - Max: 30000ms (30 seconds)
- Configurable timeout (default: 600 seconds / 10 minutes)
- Clear timeout errors with next steps: "Test execution timed out after 600 seconds. Check environment status with get_environment and verify the test codeunit exists."

### 5.3 API Rate Limits 🟡 Important
**Challenge:** Demo Portal may throttle requests under load

**Solution:**
- Detect rate limit responses (HTTP 429)
- Actionable error with backoff guidance: "API rate limit exceeded. Wait 60 seconds and retry."
- Make polling intervals configurable to reduce request frequency if needed
- Consider request queuing for future enhancements

### 5.4 Real Environment Variability 🟡 Important
**Challenge:** Tests depend on external environment state

**Solution:**
- Idempotent operations: start/stop handle current state gracefully
- Fail-fast with guidance when environment not in expected state
- Clear prerequisites: `CTN_TEST_ENVIRONMENT_ID` must point to stable test environment
- Data hygiene: Tests don't modify environment configuration, only state (start/stop)
- Integration test suite documents required environment setup

---

## 6. Potential Issues & Uncertainties

### 6.1 🔴 Critical Uncertainties

1. **Stable Non-Production Environment**
   - **Issue:** CI integration tests require a dedicated test environment
   - **Required:** `CTN_TEST_ENVIRONMENT_ID` pointing to stable, non-production environment
   - **Mitigation:** Document clear environment setup instructions; fail-fast if not configured

2. **Test Codeunit Availability**
   - **Issue:** Integration tests need a known working test codeunit
   - **Required:** `CTN_TEST_CODEUNIT_ID` or accept codeunit ID as test parameter
   - **Mitigation:** Document test codeunit requirements; provide sample test codeunit if possible

### 6.2 🟡 Important Uncertainties

1. **API Throttling Behavior**
   - **Issue:** Unknown rate limits and throttling thresholds
   - **Impact:** Could cause test flakiness under concurrent execution
   - **Mitigation:** Implement backoff and make intervals configurable; document observed limits

2. **XML/CSV Format Variations**
   - **Issue:** Different BC versions may produce different XML/CSV formats
   - **Impact:** Parsing could break with unexpected formats
   - **Mitigation:** Defensive parsing with clear errors; add format validation

3. **Long-Running Test Jobs**
   - **Issue:** Some test suites may take longer than default timeout
   - **Impact:** Premature timeout errors
   - **Mitigation:** Configurable timeout per call; document timeout tuning guidance

### 6.3 🟢 Minor Concerns

1. **Network Reliability**
   - Intermittent network issues could cause test failures
   - Mitigation: Retry transient errors with exponential backoff

2. **Time Zone Handling**
   - Timestamps in results may have time zone issues
   - Mitigation: Normalize to UTC in parsing

---

## 7. Implementation Roadmap

### Week 1: Foundation
- **Phase 0: Developer Experience & Standards**
  - [ ] TDD for pipeline: Write tests for tsc/eslint enforcement
  - [ ] Configure `tsconfig.json` (strict mode), ESLint
  - [ ] Setup pre-commit hooks (Husky)
  - [ ] Create CI pipeline (GitHub Actions/Azure DevOps)
  - [ ] Environment variable validation with fail-fast errors

- **Phase 1: Core Server & Configuration**
  - [ ] TDD: Write tests for MCP server bootstrap
  - [ ] Initialize MCP server with @modelcontextprotocol/sdk
  - [ ] Implement `ConfigurationService` (env + mcp-config.json)
  - [ ] Implement `ErrorService` with secret redaction
  - [ ] Create shared Axios client with interceptors
  - [ ] Integration test: server boots with valid config

### Week 2: Environment Management & Code Publishing
- **Phase 2: Environment Basics**
  - [ ] TDD: Write failing tests for `list_environments`
  - [ ] Implement `EnvironmentService.list()`
  - [ ] Register `list_environments` MCP tool
  - [ ] TDD: Write failing tests for `get_environment`
  - [ ] Implement `EnvironmentService.get()`
  - [ ] Register `get_environment` MCP tool
  - [ ] TDD: Write failing tests for `start_environment`
  - [ ] Implement `EnvironmentService.start()` with idempotency
  - [ ] Register `start_environment` MCP tool
  - [ ] TDD: Write failing tests for `stop_environment`
  - [ ] Implement `EnvironmentService.stop()` with idempotency
  - [ ] Register `stop_environment` MCP tool
  - [ ] Refactor: DRY request/response patterns
  - [ ] All environment tools pass integration tests against real API

- **Phase 2.5: Code Compilation & Publishing**
  - [ ] TDD: Write failing tests for `compile_and_publish`
  - [ ] Implement `CompilationService.compileAndPublish()`:
    - [ ] Locate `alc.exe` (VS Code AL extension compiler)
    - [ ] Parse workspace `app.json` for metadata
    - [ ] Invoke compiler with proper arguments
    - [ ] Verify .app file creation
    - [ ] Retrieve BC credentials from Demo Portal API
    - [ ] Prepare FormData with .app file
    - [ ] POST to Developer Endpoint with Basic Auth
  - [ ] Register `compile_and_publish` MCP tool
  - [ ] TDD: Test compilation error handling
  - [ ] TDD: Test schema update mode variations
  - [ ] TDD: Validate secret redaction in compilation/publishing errors
  - [ ] Refactor: Extract alc.exe locator, app.json parser, Developer Endpoint client
  - [ ] compile_and_publish passes integration tests with real AL project

### Week 3: Test Execution
- **Phase 3: Test Execution & Coverage**
  - [ ] TDD: Write failing tests for `run_tests` (basic execution)
  - [ ] Implement `TestRunnerService.runTests()`:
    - [ ] Job submission (POST)
    - [ ] Polling with exponential backoff
    - [ ] XML result parsing
  - [ ] Register `run_tests` MCP tool
  - [ ] TDD: Write failing tests for `run_tests` with coverage
  - [ ] Implement CSV coverage parsing
  - [ ] Add `includeCoverage` parameter support
  - [ ] TDD: Write failing tests for timeout handling
  - [ ] Implement timeout logic with actionable errors
  - [ ] TDD: Write failing tests for `get_code_coverage`
  - [ ] Implement `TestRunnerService.getCodeCoverage()`
  - [ ] Register `get_code_coverage` MCP tool
  - [ ] TDD: Validate polling backoff behavior
  - [ ] TDD: Validate secret redaction in test errors
  - [ ] Refactor: Extract XML/CSV parsing utilities
  - [ ] All test execution tools pass integration tests

### Week 4: Polish & Production Readiness
- **Phase 4: Hardening, Docs, Observability**
  - [ ] TDD: Write tests for structured logging
  - [ ] Implement structured JSON logging (request ID, duration, outcome)
  - [ ] TDD: Write tests for rate limit handling
  - [ ] Implement rate limit detection and actionable errors
  - [ ] TDD: Write tests for logging level configuration
  - [ ] Validate all tool response schemas for consistency
  - [ ] Comprehensive error handling review
  - [ ] Performance testing and optimization
  - [ ] Write README with:
    - [ ] Setup instructions
    - [ ] Environment variable reference
    - [ ] Tool usage examples
    - [ ] Troubleshooting guide
  - [ ] Final integration test suite run
  - [ ] CI pipeline validation (green build)
  - [ ] Code review and refactoring pass (SOLID adherence)

---

## 8. Technical Decisions Required

**None blocking implementation.** All architectural decisions have been made. See "Integration Test Prerequisites" (Section 10, Appendix C) for required environment variables to proceed with CI/CD integration.

---

## 9. Risk Assessment

### High Risk Areas
1. **Missing CI Secrets or Stable Test Environment**
   - **Mitigation:** Fail-fast with clear guidance; document environment setup
   - **Status:** Requires `CTN_TEST_ENVIRONMENT_ID` and `CTN_TEST_CODEUNIT_ID` from user

2. **API Rate Limits Unknown**
   - **Mitigation:** Capped backoff, actionable retry errors, configurable intervals
   - **Status:** Will discover during integration testing

### Medium Risk Areas
1. **Long-Running Test Jobs**
   - **Mitigation:** Configurable timeout, clear timeout messages
   - **Status:** Default 10 minutes, user can override per call

2. **XML/CSV Format Variations**
   - **Mitigation:** Defensive parsing, format validation, clear errors
   - **Status:** Will test against known BC versions

### Low Risk Areas
1. **TypeScript/Lint Compliance**
   - **Mitigation:** Pre-commit and CI enforcement
   - **Status:** ✅ Enforced via gates

2. **Basic Environment Operations**
   - **Mitigation:** Well-defined API, proven patterns from Explorer
   - **Status:** ✅ High confidence

3. **Result Parsing**
   - **Mitigation:** Clear XML/CSV formats, defensive parsing
   - **Status:** ✅ High confidence

---

## 10. Success Criteria

### Must Have (MVP) ✅

**Tools Delivered:**
- ✅ `list_environments` - List all available environments
- ✅ `get_environment` - Get details of specific environment
- ✅ `start_environment` - Start a stopped environment (idempotent)
- ✅ `stop_environment` - Stop a running environment (idempotent)
- ✅ `compile_and_publish` - Compile AL code and publish to environment (LLM-driven TDD workflow)
- ✅ `run_tests` - Execute tests with block-and-poll, return parsed results
- ✅ `get_code_coverage` - Get code coverage for completed test job

**Quality Standards:**
- ✅ All tools tested against real Demo Portal API (no mocks/stubs/fakes)
- ✅ Strict TDD process adhered to for each feature (red-green-refactor)
- ✅ TypeScript standards enforced (pre-commit and CI gates)
- ✅ Centralized secret redaction validated by tests
- ✅ Clear, structured, LLM-friendly outputs
- ✅ Actionable error messages with next steps

### Should Have (Post-MVP)
- ⏭️ `create_environment` - Create new environments
- ⏭️ `get_environment_credentials` - Retrieve user credentials
- ⏭️ Launch.json read-only listing
- ⏭️ Test result caching/history

### Could Have (Future Enhancements)
- ⏭️ `upload_license` - License file management
- ⏭️ `get_environment_logs` - Log retrieval
- ⏭️ Launch.json write/sync operations
- ⏭️ Multi-workspace support
- ⏭️ Advanced test filtering/discovery
- ⏭️ Dependency auto-download from environments

### Won't Have (Out of Scope)
- ❌ UI/Visual components (terminal-only)
- ❌ Direct WebService calls to BC (use Demo Portal API)
- ❌ Kubernetes terminal access
- ❌ File system operations on environments

---

## 11. Conclusion

### Confidence Assessment

**High Confidence (80-100%):** ✅ All Core Features
- Basic environment management operations (list/get/start/stop)
- AL code compilation and publishing (using Environment Explorer patterns)
- API client implementation with secret redaction
- Test execution with block-and-poll pattern
- Test result retrieval and parsing (XML/CSV)
- Configuration management (config file + env vars)
- Error handling with actionable messages
- TypeScript standards enforcement (pre-commit + CI)
- TDD workflow with real integration tests

**Medium Confidence (50-80%):**
- API rate limit behavior and handling
- Long-running test job performance
- XML/CSV format variations across BC versions

**Low Confidence (Below 50%):**
- None remaining (all critical uncertainties addressed or mitigated)

### Recommended Approach

1. **Strict TDD** - Write tests first for every feature, no exceptions
2. **Start with Phase 0** - Establish quality gates before feature development
3. **Progress through phases sequentially** - DevEx → Server → Environments → Compilation → Tests → Hardening
4. **Real integration testing at each phase** - Test against actual Demo Portal API continuously
5. **Focus on minimal scope** - Only 7 essential tools in MVP, defer everything else
6. **Enforce quality gates** - Pre-commit and CI block non-compliant code
7. **Prioritize reliability over features** - Better to have 7 solid tools than 15 flaky ones

### Critical Success Factors

1. ✅ **Strict TDD adherence** - Tests-first for every feature (red-green-refactor)
2. ✅ **No mocks/stubs/fakes** - All tests use real implementations
3. ✅ **Minimal scope** - Only 7 essential tools (environment management + compilation + test execution)
4. ✅ **Enforced TypeScript standards** - Pre-commit + CI gates
5. ✅ **Secret redaction** - Centralized utility prevents credential leaks
6. ✅ **Real integration testing** - Against actual Demo Portal API
7. ✅ **Clear, structured output for LLM interpretation** - Actionable errors with next steps
8. ✅ **Graceful error handling** - Exception-based with guidance
9. ✅ **Authoritative source boundaries** - Only Demo Portal REST API patterns
10. ✅ **Comprehensive documentation** - Setup, usage, troubleshooting

### Alignment with CLAUDE.md

This revised plan fully addresses all requirements from CLAUDE.md:

| Requirement | Alignment Status |
|-------------|------------------|
| **TDD (tests-first)** | ✅ Explicit in every phase |
| **Red-Green-Refactor** | ✅ Built into implementation strategy |
| **No mocks/stubs/fakes** | ✅ Explicit policy (Decision 1.12) |
| **Real environment testing** | ✅ All tests use real Demo Portal API |
| **DRY** | ✅ Redundancy removed, shared utilities |
| **SOLID** | ✅ Layered architecture with clear responsibilities |
| **Minimal Code** | ✅ MVP reduced to 6 tools |
| **TypeScript standards** | ✅ Strict mode + ESLint enforced |
| **Compile before commit** | ✅ Pre-commit hook blocks invalid code |
| **MCP focus** | ✅ Structured, LLM-friendly outputs |
| **Terminal-based** | ✅ No UI components |
| **Robust error handling** | ✅ Actionable messages with next steps |
| **Reference only authoritative sources** | ✅ Demo Portal REST API only (Decision 1.13) |

---

## Appendix A: API Endpoint Reference

### Environment Management
```
GET    /environments.json              # List all environments
GET    /environments/{id}.json          # Get environment details
PATCH  /environments/{id}.json          # Update environment (start/stop)
```

### Test Execution
```
POST   /environments/{id}/tests/jobs.json                    # Start test job
GET    /environments/{id}/tests/jobs/{jobId}.xml             # Poll for results
GET    /environments/{id}/tests/jobs/{jobId}/codecoverage.csv # Get coverage
```

### Authentication
```
Authorization: Bearer ${DEMO_PORTAL_TOKEN}
```

**Base URL:** `${DEMO_PORTAL_BASE_URL}/api/v1.0` (default: https://demoportaldev.continiaonline.com/api/v1.0)

---

## Appendix B: Key Code References (Authoritative Sources)

### Environment Explorer
- **Path:** `C:\GeneralDev\MCPDevelopment\AL Developer Tools - Continia Environment Explorer`
- **Key Files:**
  - `demoportal.ts` - REST client patterns, API endpoints, authentication
  - `tools.ts` - Launch configuration patterns (deferred in MVP)
  - `extension.ts` - Test launch integration patterns

### AL Test Runner
- **Path:** `C:\GeneralDev\MCPDevelopment\AL Developer Tools - Continia AL Test Runner`
- **Key Files:**
  - `testController.ts:147` - Test execution handler
  - `extension.ts:410` - XML result parsing patterns
  - `alFileHelper.ts` - AL file parsing patterns (not used in MVP)

**Important Note:** MVP implementation must reference only these two codebases for patterns. No direct BC Developer Endpoint calls or external patterns.

---

## Appendix C: Configuration Schema (MVP)

### mcp-config.json (Optional)
```json
{
  "api": {
    "url": "https://demoportaldev.continiaonline.com/api/v1.0",
    "timeoutMs": 30000
  },
  "test": {
    "defaultTimeoutSeconds": 600,
    "initialPollIntervalMs": 2000,
    "maxPollIntervalMs": 30000,
    "backoffFactor": 2
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

### Required Environment Variables (CI and Local)

**Authentication:**
- `DEMO_PORTAL_TOKEN` (required) - API authentication token
- `DEMO_PORTAL_BASE_URL` (optional) - Override default API base URL

**Integration Testing:**
- `CTN_TEST_ENVIRONMENT_ID` (required for CI) - Test environment ID for integration tests
- `CTN_TEST_CODEUNIT_ID` (recommended) - Test codeunit ID for integration tests

**Optional:**
- `LOG_LEVEL` (optional) - Override logging level (debug|info|warn|error)

### Behavior When Missing

**Required Variables Missing:**
```
Error: DEMO_PORTAL_TOKEN not set
Fix: Set the token via: export DEMO_PORTAL_TOKEN=your_token
Documentation: See README.md for setup instructions
```

**Integration Test Variables Missing:**
```
Error: CTN_TEST_ENVIRONMENT_ID not set - integration tests cannot run
Fix: Set the test environment ID via: export CTN_TEST_ENVIRONMENT_ID=env_id
Note: This is required for CI/CD pipelines running integration tests
```

Tests will **fail-fast** (not skip) when required variables are missing to ensure CI/CD reliability.

---

## Appendix D: Testing Policy & Standards Enforcement

### Testing Policy

**No Mocks/Stubs/Fakes:**
- All tests hit the real Demo Portal API
- Tests must be deterministic and idempotent
- Start/stop operations tolerate current state gracefully
- Tests fail-fast if required env vars are missing (do not skip)

**Integration Test Requirements:**
- Stable non-production environment (`CTN_TEST_ENVIRONMENT_ID`)
- Known working test codeunit (`CTN_TEST_CODEUNIT_ID`)
- Valid API token (`DEMO_PORTAL_TOKEN`)
- Tests verify real system behavior end-to-end

### Pre-commit Enforcement

**Command:** `npm run precommit`
**Runs:**
1. `tsc --noEmit` (TypeScript compilation check)
2. `eslint . --ext .ts` (Linting check)

**Behavior:**
- Blocks commit if either check fails
- Provides clear error messages with line numbers
- Developer must fix issues before commit succeeds

**Setup:**
```bash
# Install Husky for git hooks
npm install --save-dev husky

# Setup pre-commit hook
npx husky install
npx husky add .husky/pre-commit "npm run precommit"
```

### CI Gates

**Pipeline Steps:**
1. Setup Node environment
2. `npm ci` (clean install)
3. `npm run typecheck` → **MUST PASS**
4. `npm run lint` → **MUST PASS**
5. `npm run test:integration` → **MUST PASS** (fails fast if secrets missing)

**Failure Behavior:**
- Pipeline stops at first failure
- Clear error messages indicate which gate failed
- Secrets-related failures provide setup guidance

### Secret Redaction

**Central Redaction Utility:**
```typescript
class ErrorService {
  static redact(error: Error): Error {
    let message = error.message;

    // Redact Authorization headers
    message = message.replace(/Authorization:\s*Bearer\s+[^\s]+/gi, 'Authorization: Bearer [REDACTED]');

    // Redact token-like patterns
    message = message.replace(/\b(api[_-]?key|token|secret)[=:]\s*[^\s]+/gi, '$1=[REDACTED]');

    // Preserve original error type
    const redactedError = new error.constructor(message);
    redactedError.stack = error.stack;

    return redactedError;
  }
}
```

**Applied To:**
- All error messages before throwing
- All log entries (request/response logging)
- Tool response error details
- Stack traces (sanitized before output)

**Validation:**
- Integration tests assert secrets are not present in:
  - Log output
  - Error messages
  - Tool responses
  - Stack traces

---

## Appendix E: MCP Tool Specifications (MVP)

### 1. list_environments

**Description:** List all available Business Central environments

**Parameters:**
```typescript
{} // No parameters
```

**Returns:**
```typescript
Array<{
  id: string;              // Environment ID
  name: string;            // Display name
  state: string;           // "running" | "stopped" | "starting" | "stopping"
  bcVersion?: string;      // BC version (if available)
}>
```

**Example Response:**
```json
[
  {
    "id": "env_123",
    "name": "Test Environment 1",
    "state": "running",
    "bcVersion": "22.0"
  },
  {
    "id": "env_456",
    "name": "Development Environment",
    "state": "stopped",
    "bcVersion": "21.5"
  }
]
```

**Errors:**
- `"API authentication failed. Verify DEMO_PORTAL_TOKEN is valid."`
- `"Failed to connect to Demo Portal API. Check DEMO_PORTAL_BASE_URL and network connection."`

---

### 2. get_environment

**Description:** Get detailed information about a specific environment

**Parameters:**
```typescript
{
  environmentId: string;  // Required
}
```

**Returns:**
```typescript
{
  id: string;
  name: string;
  state: string;
  details: {
    bcVersion?: string;
    artifactUrl?: string;
    createdAt?: string;
    // ... additional environment details
  };
}
```

**Example Response:**
```json
{
  "id": "env_123",
  "name": "Test Environment 1",
  "state": "running",
  "details": {
    "bcVersion": "22.0",
    "artifactUrl": "https://...",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `"Environment not found. Use list_environments to see available environments."`
- `"API authentication failed. Verify DEMO_PORTAL_TOKEN is valid."`

---

### 3. start_environment

**Description:** Start a stopped environment (idempotent)

**Parameters:**
```typescript
{
  environmentId: string;  // Required
}
```

**Returns:**
```typescript
{
  id: string;
  previousState: string;
  newState: string;
  message?: string;
}
```

**Example Response:**
```json
{
  "id": "env_123",
  "previousState": "stopped",
  "newState": "starting",
  "message": "Environment is starting. This may take several minutes."
}
```

**Idempotent Response (already running):**
```json
{
  "id": "env_123",
  "previousState": "running",
  "newState": "running",
  "message": "Environment already running; no action taken."
}
```

**Errors:**
- `"Environment not found. Use list_environments to see available environments."`
- `"Cannot start environment in current state. Current state: starting. Wait for transition to complete."`

---

### 4. stop_environment

**Description:** Stop a running environment (idempotent)

**Parameters:**
```typescript
{
  environmentId: string;  // Required
}
```

**Returns:**
```typescript
{
  id: string;
  previousState: string;
  newState: string;
  message?: string;
}
```

**Example Response:**
```json
{
  "id": "env_123",
  "previousState": "running",
  "newState": "stopping",
  "message": "Environment is stopping. This may take a few moments."
}
```

**Idempotent Response (already stopped):**
```json
{
  "id": "env_123",
  "previousState": "stopped",
  "newState": "stopped",
  "message": "Environment already stopped; no action taken."
}
```

**Errors:**
- `"Environment not found. Use list_environments to see available environments."`
- `"Cannot stop environment in current state. Current state: stopping. Wait for transition to complete."`

---

### 5. compile_and_publish

**Description:** Compile AL code and publish to Business Central environment (supports LLM-driven TDD workflow)

**Parameters:**
```typescript
{
  workspacePath: string;          // Required - absolute path to AL project root
  environmentId: string;          // Required - target environment ID
  schemaUpdateMode?: string;      // Optional - "synchronize" | "forcesync" | "recreate" (default: "synchronize")
  force?: boolean;                // Optional - skip change detection (default: false)
}
```

**Returns:**
```typescript
{
  compiled: boolean;
  published: boolean;
  appPath: string;               // Path to generated .app file
  appName: string;               // Generated app filename (e.g., "Publisher_AppName_1.0.0.0.app")
  message?: string;
}
```

**Example Response (Success):**
```json
{
  "compiled": true,
  "published": true,
  "appPath": "C:\\Projects\\MyApp\\Publisher_MyApp_1.0.0.0.app",
  "appName": "Publisher_MyApp_1.0.0.0.app",
  "message": "Compilation and publishing completed successfully."
}
```

**Example Response (Compilation Error):**
```json
{
  "compiled": false,
  "published": false,
  "error": "Compilation failed: Syntax error in file Codeunit.al line 45. Check AL code for errors."
}
```

**Implementation Details:**
- **Compilation:** Spawns VS Code AL extension's `alc.exe` compiler
  - Reference: Environment Explorer `alc.ts:471-537`
  - Arguments: `/project:{workspacePath}`, `/packagecachepath:{workspacePath}/.alpackages`
- **Publishing:** POST to BC Developer Endpoint
  - Reference: Environment Explorer `developerEndpoint.ts:12-88`
  - Endpoint: `POST {environment.url}/{env.id}/dev/apps?tenant=default&SchemaUpdateMode={mode}`
  - Authentication: Basic auth with BC credentials (retrieved via Demo Portal API)
  - FormData multipart upload of .app file
- **Workflow:**
  1. Locate `alc.exe` in VS Code extensions directory
  2. Parse `app.json` from workspace for metadata
  3. Invoke compiler and capture output
  4. Verify `.app` file was created
  5. Retrieve BC credentials from Demo Portal API
  6. Get environment URL from Demo Portal API
  7. Prepare multipart FormData with .app file
  8. POST to Developer Endpoint with Basic Auth
  9. Return success/failure with actionable messages

**Errors:**
- `"Compilation failed: {error details}. Check AL code for syntax errors."`
- `"alc.exe not found. Install VS Code AL extension or specify AL compiler path."`
- `"app.json not found in workspace. Verify workspacePath points to AL project root containing app.json."`
- `"Environment not running. Call start_environment before publishing code."`
- `"Publishing failed: Invalid credentials. Verify you have publish permissions for this environment."`
- `"Publishing failed: Schema update failed. Try schemaUpdateMode='forcesync' or check for breaking changes."`
- `"Workspace path does not exist: {path}. Verify the path is correct."`

**Usage Example:**
```typescript
// LLM-driven TDD workflow
// 1. LLM writes new AL code
// 2. LLM calls compile_and_publish
const result = await mcp.call('compile_and_publish', {
  workspacePath: '/path/to/al/project',
  environmentId: 'env_123',
  schemaUpdateMode: 'synchronize'
});

// 3. If successful, LLM calls run_tests
if (result.compiled && result.published) {
  const testResult = await mcp.call('run_tests', {
    environmentId: 'env_123',
    codeunitId: 50000
  });
}
```

---

### 6. run_tests

**Description:** Execute AL tests in an environment with block-and-poll pattern

**Parameters:**
```typescript
{
  environmentId: string;      // Required
  codeunitId?: number;        // Optional - run specific codeunit
  testMethod?: string;        // Optional - run specific method
  includeCoverage?: boolean;  // Optional - include coverage in response (default: false)
  timeoutSeconds?: number;    // Optional - override default timeout (default: 600)
}
```

**Returns:**
```typescript
{
  jobId: string;
  status: "completed" | "failed" | "timed_out";
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    durationMs: number;
  };
  failures?: Array<{
    codeunitId: number;
    method?: string;
    message: string;
  }>;
  coverage?: {
    linesCovered: number;
    linesTotal: number;
    percent: number;
  };
}
```

**Example Response (Success):**
```json
{
  "jobId": "job_789",
  "status": "completed",
  "summary": {
    "passed": 45,
    "failed": 0,
    "skipped": 2,
    "durationMs": 12500
  }
}
```

**Example Response (With Failures):**
```json
{
  "jobId": "job_790",
  "status": "completed",
  "summary": {
    "passed": 43,
    "failed": 2,
    "skipped": 2,
    "durationMs": 15800
  },
  "failures": [
    {
      "codeunitId": 50001,
      "method": "TestCustomerCreation",
      "message": "Expected 'Active' but was 'Inactive'"
    },
    {
      "codeunitId": 50001,
      "method": "TestOrderProcessing",
      "message": "Order not found after creation"
    }
  ]
}
```

**Example Response (With Coverage):**
```json
{
  "jobId": "job_791",
  "status": "completed",
  "summary": {
    "passed": 45,
    "failed": 0,
    "skipped": 2,
    "durationMs": 13200
  },
  "coverage": {
    "linesCovered": 850,
    "linesTotal": 1000,
    "percent": 85.0
  }
}
```

**Errors:**
- `"Environment not running. Call start_environment first."`
- `"Test codeunit not found: 50000. Verify the codeunit ID exists in the environment."`
- `"Test execution timed out after 600 seconds. Check environment status with get_environment and verify the test codeunit exists."`
- `"Environment not found. Use list_environments to see available environments."`

---

### 7. get_code_coverage

**Description:** Get code coverage data for a completed test job

**Parameters:**
```typescript
{
  environmentId: string;  // Required
  jobId: string;          // Required - from run_tests response
}
```

**Returns:**
```typescript
{
  linesCovered: number;
  linesTotal: number;
  percent: number;
}
```

**Example Response:**
```json
{
  "linesCovered": 850,
  "linesTotal": 1000,
  "percent": 85.0
}
```

**Errors:**
- `"Test job not found: job_789. Verify the job ID is correct."`
- `"Code coverage data not available for job: job_789. Coverage may not have been enabled for this test run."`
- `"Environment not found. Use list_environments to see available environments."`

---

### Common Error Patterns

**All tools follow these error patterns:**

1. **Authentication Errors:**
   ```
   "API authentication failed. Verify DEMO_PORTAL_TOKEN is valid."
   ```

2. **Resource Not Found:**
   ```
   "{Resource} not found. Use {list_command} to see available {resources}."
   ```

3. **Invalid State:**
   ```
   "Cannot {action} {resource} in current state. Current state: {state}. {guidance}"
   ```

4. **Timeout Errors:**
   ```
   "{Operation} timed out after {seconds} seconds. {troubleshooting_guidance}"
   ```

5. **Network Errors:**
   ```
   "Failed to connect to Demo Portal API. Check DEMO_PORTAL_BASE_URL and network connection."
   ```

**All error messages:**
- Are actionable (tell user what to do next)
- Include context (current state, attempted action)
- Reference related tools or commands when helpful
- Never include secrets or sensitive data
- Use consistent formatting and structure

---

## Document History

**Version 1.0** - 2024-11-09 - Initial comprehensive research and planning
**Version 2.0** - 2024-11-09 - Updated with architectural decisions from Q&A session
**Version 2.0 (Revised)** - 2025-11-15 - **Complete revision via GPT-5 Pro analysis**

### Key Changes in Version 2.0 (Revised):

**Critical Changes:**
1. ✅ Enforced strict TDD (tests-first, red-green-refactor) in every phase
2. ✅ Reduced MVP scope from 11 tools to 6 tools (removed compile, license, launch.json write)
3. ✅ Added TypeScript standards enforcement (pre-commit + CI gates)
4. ✅ Removed tool redundancy (get_test_results eliminated)

**Important Changes:**
5. ✅ Clarified authoritative knowledge boundaries (no direct BC Developer Endpoint)
6. ✅ Added secret redaction policy with centralized utility
7. ✅ Clarified workspace handling (single workspace, process.cwd())
8. ✅ Operationalized integration test prerequisites (documented env vars)

**Structural Improvements:**
9. ✅ Added Phase 0 for Developer Experience & Standards
10. ✅ Updated roadmap timeline (4 weeks instead of 5)
11. ✅ Enhanced tool specifications with complete contracts

**New Sections:**
- Section 0: Key Differences from First Plan (this comparison)
- Decision 1.11: TypeScript Standards Enforcement
- Decision 1.12: Testing Policy (no mocks/stubs/fakes)
- Decision 1.13: Authoritative Knowledge Boundaries
- Appendix D: Testing Policy & Standards Enforcement
- Appendix E: Complete MCP Tool Specifications

**Preserved from v2.0:**
- MCP focus and structured responses
- Layered architecture
- Real-environment integration testing
- Block-and-poll pattern
- Exception-based error handling
- Environment variable authentication
- Iterative development approach

*Analysis Performed By: GPT-5 Pro (gpt-5-pro)*
*Analysis Focus: Requirement Coverage, Technical Accuracy*
*Document Author: MCP Development Team*