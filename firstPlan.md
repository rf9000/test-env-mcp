---
⚠️ **DEPRECATION NOTICE** ⚠️

**This document is preserved for historical reference only.**

**For implementation, use:** [`developmentguide.md`](./developmentguide.md)

**Reason:** This planning document was created before verifying implementation details against the authoritative source code (Environment Explorer). The `developmentguide.md` has been updated with verified, correct information including:
- Correct API field names (`status` not `state`)
- Proper compilation approach (`al compile` with analyzers)
- Verified URL formats and endpoint patterns
- Developer Endpoint publishing patterns (confirmed from Environment Explorer source)

**Date Deprecated:** 2025-11-16
---

# MCP Server Implementation Plan for Continia Environment Management & Test Execution

## Executive Summary

After comprehensive research of the **AL Developer Tools - Continia Environment Explorer** and **AL Developer Tools - Continia AL Test Runner** codebases, this document outlines the plan to create an MCP (Model Context Protocol) server that enables LLMs to manage Business Central environments and execute tests through terminal-based interactions.

---

## 1. Architectural Decisions (Q&A Session Results)

### Decision Summary

The following architectural decisions were made during the planning Q&A session:

#### 1.1 Authentication & Security 🔴 CRITICAL
**Decision:** Environment variables for API token storage
**Rationale:** Internal company use only, security not a priority. Simplest implementation.
**Implementation:**
- Store Demo Portal API token in environment variable
- No encryption or keychain integration required
- Document secure practices in README

#### 1.2 Test Discovery Mechanism ⚠️ MEDIUM
**Decision:** Hybrid approach
**Rationale:** Maximum flexibility for LLM interactions
**Implementation:**
- LLM can provide explicit test codeunit IDs when calling test tools
- No automatic test discovery required for MVP
- Future enhancement: Add AL file parsing for auto-discovery

#### 1.3 Workspace Path Resolution ⚠️ MEDIUM
**Decision:** Use `process.cwd()` - MCP server always invoked within workspace
**Rationale:** Server runs in workspace context, eliminating need for complex path detection
**Implementation:**
- Workspace root = `process.cwd()`
- Launch.json path = `{workspace}/.vscode/launch.json`
- No workspace path configuration needed

#### 1.4 Launch.json Management Scope ⚠️ MEDIUM
**Decision:** Full read/write capabilities in MVP
**Rationale:** Complete environment lifecycle management from LLM
**Implementation:**
- Implement all three tools: `list_launch_configs`, `add_launch_config`, `sync_launch_configs`
- Support adding, updating, and removing configurations
- Handle multiple workspaces

#### 1.5 AL Compilation Support ✅ HIGH
**Decision:** Include `compile_and_publish` in MVP
**Rationale:** `al compile` CLI tool available as .NET global tool, enables full dev lifecycle
**Implementation:**
- Detect AL CLI version: `dotnet tool list -g`
- Build analyzer paths dynamically
- Execute `al compile` with all required analyzers (CodeCop, AppSourceCop, UICop)
- Verify compilation with `/continuebuildonerror:+` flag
- Publish resulting .app file to environment

#### 1.6 MCP Framework Choice ✅ HIGH
**Decision:** TypeScript with @modelcontextprotocol/sdk
**Rationale:** Aligns with project requirements in CLAUDE.md (TypeScript standards, linting, strict compilation)
**Implementation:**
- Use official MCP SDK from @modelcontextprotocol/sdk
- Follow TypeScript best practices from mcp-builder skill
- Enable strict TypeScript compiler options
- Configure ESLint with TypeScript parser

#### 1.7 Development Approach ✅ HIGH
**Decision:** Iterative development (phase by phase)
**Rationale:** Build, test, and validate each phase before moving to next
**Implementation:**
- Phase 1: Core server + config → Test with real API
- Phase 2: Environment tools → Test with real environments
- Phase 3: Test execution → Test with real test jobs
- Phase 4: Launch.json → Test with real workspace
- Phase 5: AL compilation → Test with real compilation

#### 1.8 Error Handling Strategy ✅ HIGH
**Decision:** Exception-based with actionable messages
**Rationale:** Cleaner code, SDK handles formatting, standard MCP pattern
**Implementation:**
- Throw exceptions for all error conditions
- Write actionable error messages that guide LLM toward solutions
- Include specific next steps in error messages
- Preserve stack traces for debugging
- Example: `throw new Error('Environment not running. Use start_environment first.')`

#### 1.9 Test Execution Pattern ⚠️ MEDIUM
**Decision:** Block and poll (synchronous-style)
**Rationale:** Simpler for LLM - call tool once, get results
**Implementation:**
- `run_tests` tool submits job and polls until completion
- Implement exponential backoff polling strategy
- Return complete test results when done
- Handle timeouts gracefully with actionable errors
- LLM doesn't need to manage polling logic

#### 1.10 Configuration Management ⚠️ MEDIUM
**Decision:** Config file + environment variables
**Rationale:** Balance between flexibility and security
**Implementation:**
- **Config file (mcp-config.json):**
  - API URL (default: `https://demoportaldev.continiaonline.com/api/v1.0`)
  - Test polling settings (timeout, interval, max retries)
  - Logging configuration (level, format)
- **Environment variables:**
  - `DEMO_PORTAL_TOKEN` - API authentication token
  - `BC_ARTIFACT_SHARED_KEY` - Optional BC artifact key
- **Workspace detection:**
  - Automatically derived from `process.cwd()`

---

## 2. Architecture Overview

### 2.1 Current Architecture Analysis

#### Environment Explorer
- **Core API:** Demo Portal REST API (`demoportal.ts`)
- **Authentication:** Bearer token for API, Basic auth for BC environments
- **Environment Management:** Full lifecycle (create, start, stop, delete, reset)
- **Test Execution:** Via `/environments/{id}/tests/jobs.json` endpoint
- **File Operations:** Upload/download capabilities
- **Kubernetes Integration:** Direct container access via kubectl

#### AL Test Runner
- **Test Discovery:** Regex-based AL file parsing
- **Execution:** Delegates entirely to Environment Explorer
- **Results:** XML test results + CSV code coverage
- **Integration:** VS Code Testing API
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
├─────────────────────────────────────┤
│     Service Layer (Business Logic)   │
│  ├── EnvironmentService              │
│  ├── TestRunnerService               │
│  └── ConfigurationService            │
├─────────────────────────────────────┤
│       API Client Layer               │
│  └── DemoPortalClient (from Explorer)│
├─────────────────────────────────────┤
│       Storage Layer                  │
│  └── launch.json management          │
└─────────────────────────────────────┘
        ↓
Demo Portal REST API
        ↓
Business Central Environments
```

---

## 3. Integration Points & Data Flow

### 3.1 Key Integration Points Identified

1. **Demo Portal REST API** (Primary Interface)
   - Base URL: `https://demoportaldev.continiaonline.com/api/v1.0`
   - Authentication: Bearer token
   - All environment and test operations

2. **Launch.json Configuration** (Environment Registry)
   - Location: `.vscode/launch.json` in workspace
   - Contains environment connection details
   - Managed by Environment Explorer's `tools.ts`

3. **Test Job Execution** (Test Runner Integration)
   - Start: POST `/environments/{id}/tests/jobs.json`
   - Poll: GET `/environments/{id}/tests/jobs/{jobId}.xml`
   - Coverage: GET `/environments/{id}/tests/jobs/{jobId}/codecoverage.csv`

4. **Developer Endpoint** (Direct App Publishing)
   - URL: `{environment-url}/dev/apps`
   - Authentication: Basic auth with BC credentials
   - Used for app deployment before test execution

### 3.2 Critical Data Structures

#### Environment Configuration (launch.json)
```json
{
  "type": "al",
  "request": "launch",
  "name": "Environment Name",
  "server": "https://environmenturl.com",
  "serverInstance": "environment_id",
  "authentication": "UserPassword|AAD",
  "startupObjectId": 130451,  // Test Runner Page
  "startupObjectType": "Page",
  "schemaUpdateMode": "Synchronize|ForceSync|Recreate",
  "breakOnError": "None|All|ExcludeTry",
  "dependencyPublishingOption": "Default|Strict|Ignore"
}
```

#### Test Job Structure
```typescript
type ALTestJob = {
  testCodeunitId: number;
  testFunctionName: string;  // Empty for full codeunit
}
```

---

## 4. Implementation Strategy

### 4.1 Phase 1: Core MCP Server Setup ✅ High Confidence

**Objectives:**
- Initialize MCP server with TypeScript
- Implement basic tool registration
- Set up configuration management

**Components:**
```typescript
// Core server structure
class MCPServer {
  async initialize()
  async registerTools()
  async handleToolCall()
}

// Configuration management
interface MCPConfig {
  apiToken: string
  apiUrl: string
  workspacePath: string
  bcArtifactSharedKey?: string
}
```

**Confidence:** ✅ **HIGH** - Standard MCP implementation pattern

### 4.2 Phase 2: Environment Management Tools ✅ High Confidence

**MCP Tools to Implement:**

```typescript
tools = [
  {
    name: "list_environments",
    description: "List all available BC environments",
    parameters: {}
  },
  {
    name: "get_environment",
    description: "Get details of a specific environment",
    parameters: { environmentId: string }
  },
  {
    name: "start_environment",
    description: "Start a stopped environment",
    parameters: { environmentId: string }
  },
  {
    name: "stop_environment",
    description: "Stop a running environment",
    parameters: { environmentId: string }
  },
  {
    name: "create_environment",
    description: "Create new BC environment",
    parameters: {
      name: string,
      bcVersion: string,
      artifactUrl?: string,
      isSandbox: boolean
    }
  },
  {
    name: "get_environment_credentials",
    description: "Get user credentials for environment",
    parameters: { environmentId: string }
  }
]
```

**Implementation:** Direct port of `demoportal.ts` methods

**Confidence:** ✅ **HIGH** - Clear API endpoints, proven implementation in Explorer

### 4.3 Phase 3: Test Execution Tools ⚠️ Medium Confidence

**MCP Tools:**

```typescript
tools = [
  {
    name: "run_tests",
    description: "Execute AL tests in environment",
    parameters: {
      environmentId: string,
      codeunitId?: number,
      testMethod?: string,
      pattern?: string  // For test filtering
    }
  },
  {
    name: "get_test_results",
    description: "Retrieve test execution results",
    parameters: {
      environmentId: string,
      jobId: string
    }
  },
  {
    name: "get_code_coverage",
    description: "Get code coverage data",
    parameters: {
      environmentId: string,
      jobId: string
    }
  }
]
```

**Challenge:** Test discovery without VS Code workspace context

**Solution:**
- Option A: Parse launch.json for test configurations
- Option B: Use fixed test codeunit ranges (50000-99999)
- Option C: Accept explicit codeunit IDs from LLM

**Confidence:** ⚠️ **MEDIUM** - Test discovery without VS Code context needs design decision

### 4.4 Phase 4: Launch.json Management ⚠️ Medium Confidence

**MCP Tools:**

```typescript
tools = [
  {
    name: "list_launch_configs",
    description: "List environments in launch.json",
    parameters: {}
  },
  {
    name: "add_launch_config",
    description: "Add environment to launch.json",
    parameters: {
      environmentId: string,
      configurationType: "default|test|attach"
    }
  },
  {
    name: "sync_launch_configs",
    description: "Sync launch.json with running environments",
    parameters: {}
  }
]
```

**Implementation:** Port `tools.ts` functions for launch.json manipulation

**Confidence:** ⚠️ **MEDIUM** - File system operations, JSON manipulation complexity

### 4.5 Phase 5: Advanced Features ✅ High Confidence (Updated)

**Potential Tools:**

```typescript
tools = [
  {
    name: "compile_and_publish",
    description: "Compile AL code and publish to environment",
    parameters: {
      environmentId: string,
      appPath: string,
      withDependencies: boolean
    }
  },
  {
    name: "upload_license",
    description: "Upload license file to environment",
    parameters: {
      environmentId: string,
      licensePath: string
    }
  },
  {
    name: "get_environment_logs",
    description: "Retrieve environment logs",
    parameters: {
      environmentId: string,
      logType: "application|event"
    }
  }
]
```

**Confidence:** ✅ **HIGH** - AL CLI tool (`al compile`) available as .NET global tool, see Decision 1.5

---

## 5. Technical Challenges & Solutions

### 5.1 Authentication & Security 🔴 Critical (RESOLVED - See Decision 1.1)

**Challenge:** Secure storage of API tokens and credentials

**Current State:**
- Environment Explorer uses VS Code secure storage
- API tokens stored in workspace configuration
- BC credentials retrieved per session

**MCP Solution Options:**
1. **Environment variables** (simple but less secure)
2. **Config file with encryption** (medium complexity)
3. **OS keychain integration** (complex but secure)

**Decision:** Environment variables (see Decision 1.1)

### 5.2 Test Discovery Without VS Code 🟡 Important (RESOLVED - See Decision 1.2)

**Challenge:** AL Test Runner relies on VS Code workspace for test discovery

**Current State:**
- Uses file watchers and workspace.findFiles
- Parses AL files with regex patterns
- Maintains test item hierarchy in VS Code

**MCP Solutions:**
1. **Static Configuration:** Define test codeunits in config
2. **File System Scanning:** Direct AL file parsing
3. **API Query:** Get test codeunits from BC environment
4. **Convention-Based:** Assume standard ID ranges

**Decision:** Hybrid approach - LLM provides explicit codeunit IDs (see Decision 1.2)

### 5.3 Asynchronous Test Execution 🟡 Important (RESOLVED - See Decision 1.9)

**Challenge:** Test jobs are asynchronous with polling required

**Current State:**
- Submit job, get job ID
- Poll for results (15-second intervals)
- XML results may take minutes

**MCP Solution:**
```typescript
class TestExecutionService {
  async runTestWithPolling(job: TestJob): Promise<TestResults> {
    const jobId = await this.startTestJob(job);

    // Poll with exponential backoff
    let attempts = 0;
    while (attempts < MAX_ATTEMPTS) {
      const result = await this.getTestResult(jobId);
      if (result.status === 'completed') {
        return result;
      }
      await this.delay(Math.min(2 ** attempts * 1000, 30000));
      attempts++;
    }
    throw new Error('Test execution timeout');
  }
}
```

### 5.4 Workspace Context 🟡 Important (RESOLVED - See Decision 1.3)

**Challenge:** MCP server doesn't have VS Code workspace context

**Impact:**
- No automatic AL file discovery
- No app.json parsing for dependencies
- No workspace folder resolution

**Decision:**
- Use `process.cwd()` to determine workspace (server always runs in workspace)
- Launch.json path = `{workspace}/.vscode/launch.json`
- No configuration needed (see Decision 1.3)

---

## 6. Potential Issues & Uncertainties (Updated Based on Decisions)

### 6.1 🔴 Critical Issues (Updated)

1. **AL Compiler Dependency** ✅ RESOLVED
   - **Resolution:** Use `al compile` from .NET global tools (see Decision 1.5)
   - **Impact:** Full compilation support including all analyzers
   - **Implementation:** Detect version, build analyzer paths, execute with proper parameters
   - **Confidence:** HIGH - Compilation fully supported

2. **Authentication Token Management** ✅ RESOLVED
   - **Resolution:** Environment variables for internal use (see Decision 1.1)
   - **Impact:** Simple implementation, acceptable for internal company use
   - **Implementation:** `DEMO_PORTAL_TOKEN` environment variable
   - **Confidence:** HIGH - Adequate for internal security requirements

3. **Real-time Environment Status**
   - **Issue:** No WebSocket/push notifications
   - **Impact:** Must poll for status changes
   - **Mitigation:** Implement smart polling strategies
   - **Confidence:** Will work but less efficient

### 6.2 🟡 Important Uncertainties (Updated)

1. **Test Discovery Mechanism** ✅ RESOLVED
   - **Resolution:** Hybrid approach - LLM provides explicit codeunit IDs (see Decision 1.2)
   - **Impact:** Flexible, no auto-discovery needed for MVP
   - **Future:** Can add AL file parsing later if needed

2. **Error Recovery** ✅ RESOLVED
   - **Resolution:** Exception-based with actionable messages (see Decision 1.8)
   - **Implementation:** Throw errors with clear guidance for LLM
   - **Strategy:** Include specific next steps in all error messages

3. **Performance at Scale**
   - **Uncertainty:** Handling multiple concurrent test runs
   - **Challenge:** API rate limits unknown
   - **Recommendation:** Implement request queuing

### 6.3 🟢 Minor Concerns

1. **Launch.json Synchronization**
   - Multiple tools modifying same file
   - Solution: File locking mechanism

2. **Result Formatting**
   - LLM-friendly output format needed
   - Solution: Structured JSON with summaries

3. **Backwards Compatibility**
   - Different BC versions may have different APIs
   - Solution: Version detection and adaptation

---

## 7. Implementation Roadmap (Updated for Iterative Development)

### Week 1: Foundation
- [ ] Initialize MCP server project with TypeScript
- [ ] Setup build pipeline and testing framework
- [ ] Implement configuration management
- [ ] Create DemoPortalClient from existing code

### Week 2: Environment Management
- [ ] Implement list_environments tool
- [ ] Implement start/stop/create environment tools
- [ ] Add credential retrieval
- [ ] Test with real Demo Portal API

### Week 3: Test Execution
- [ ] Implement test execution tool
- [ ] Add result polling mechanism
- [ ] Parse XML results to JSON
- [ ] Handle code coverage data

### Week 4: Launch.json Integration
- [ ] Read existing launch.json files
- [ ] Add/update/remove configurations
- [ ] Sync with environment status
- [ ] Handle multiple workspaces

### Week 5: Polish & Testing
- [ ] Comprehensive error handling
- [ ] Performance optimization
- [ ] Documentation
- [ ] Integration tests

---

## 8. Technical Decisions Required (All Resolved - See Section 1)

### 8.1 Architecture Decisions ✅ ALL RESOLVED

1. **Monolithic vs Modular** ✅
   - **Decision:** Modular with clear service boundaries
   - **Reason:** Easier to test and maintain

2. **Sync vs Async Operations** ✅
   - **Decision:** All operations async with promises
   - **Reason:** Network operations are inherently async

3. **Error Handling Strategy** ✅ (See Decision 1.8)
   - **Decision:** Exception-based with actionable messages
   - **Reason:** Cleaner code, standard MCP pattern

### 8.2 Implementation Choices ✅ ALL RESOLVED

1. **HTTP Client** ✅
   - **Decision:** Axios for consistency with existing code
   - **Reason:** Proven in Environment Explorer codebase

2. **Configuration Format** ✅ (See Decision 1.10)
   - **Decision:** Config file (JSON) + environment variables
   - **Reason:** Balance of flexibility and security

3. **Logging Strategy** ✅
   - **Decision:** Structured JSON logging for LLM parsing
   - **Reason:** Best for MCP tool responses

---

## 9. Risk Assessment (Updated)

### High Risk Areas (All Mitigated ✅)
1. **Authentication Security** ✅ RESOLVED - Environment variables acceptable for internal use
2. **AL Compilation** ✅ RESOLVED - Using `al compile` from .NET global tools
3. **Test Discovery** ✅ RESOLVED - Hybrid approach with explicit IDs

### Medium Risk Areas
1. **API Rate Limits** - Unknown throttling behavior
2. **Concurrent Operations** - State management complexity
3. **Error Recovery** - Network reliability issues

### Low Risk Areas
1. **Basic Environment Operations** - Well-defined API
2. **Result Parsing** - Clear XML/CSV formats
3. **Configuration Management** - Standard JSON handling

---

## 10. Success Criteria

### Must Have (MVP)
- ✅ List and manage environments
- ✅ Execute tests by codeunit ID
- ✅ Retrieve test results
- ✅ Parse results to LLM-friendly format

### Should Have (Now in MVP ✅)
- ✅ Launch.json management (Decision 1.4)
- ✅ Code coverage analysis
- ⚠️ Test filtering by pattern (future enhancement)
- ✅ Credential management

### Could Have (Updated)
- ✅ AL code compilation (Decision 1.5 - NOW IN MVP)
- ⚠️ Dependency resolution
- ⚠️ License management
- ⚠️ Log retrieval

### Won't Have (Initial Version)
- ❌ UI/Visual components
- ❌ Direct WebService calls to BC
- ❌ Kubernetes terminal access
- ❌ File system operations on environments

---

## 11. Conclusion (Updated)

### Confidence Assessment (Updated Based on Decisions)

**High Confidence (80-100%):** ✅ All Core Features
- Basic environment management operations
- API client implementation
- Test result retrieval and parsing
- AL code compilation (using `al compile` CLI tool)
- Launch.json management (full read/write)
- Test execution with block-and-poll pattern
- Configuration management (config file + env vars)
- Error handling with actionable messages

**Medium Confidence (50-80%):**
- Concurrent operation handling
- API rate limit management
- Complex dependency resolution

**Low Confidence (Below 50%):**
- Real-time status monitoring (polling-based instead)

### Recommended Approach (Confirmed via Decision 1.7)

1. **Iterative development** - Build and test each phase before moving forward
2. **Start with Phase 1 (Core Server)** - Foundation with config and testing
3. **Progress through phases** - Environment → Tests → Launch.json → Compilation
4. **Real integration testing** - Test against actual Demo Portal API at each phase
5. **Focus on terminal-friendly operations** that LLMs can easily interpret
6. **Prioritize reliability over features** for production readiness

### Critical Success Factors (Updated)

1. **Secure authentication handling** ✅ Environment variables approach
2. **Reliable test execution and result retrieval** ✅ Block-and-poll pattern
3. **Clear, structured output for LLM interpretation** ✅ Exception-based errors with guidance
4. **Graceful error handling and recovery** ✅ Actionable error messages
5. **AL compilation support** ✅ Using `al compile` CLI tool
6. **Comprehensive documentation for LLM training**
7. **Real integration testing** ✅ TDD with actual API calls

---

## Appendix A: API Endpoint Reference

### Environment Management
```
GET    /environments.json
GET    /environments/{id}.json
POST   /environments.json
PATCH  /environments/{id}.json
DELETE /environments/{id}.json
```

### Test Execution
```
POST   /environments/{id}/tests/jobs.json
GET    /environments/{id}/tests/jobs/{jobId}.xml
GET    /environments/{id}/tests/jobs/{jobId}/codecoverage.csv
```

### Authentication
```
GET    /environments/{id}/users.json
POST   /environments/{id}/users.json
```

---

## Appendix B: Key Code References

### From Environment Explorer
- `demoportal.ts:38` - DemoPortal class (main API client)
- `tools.ts:492` - Launch configuration generator
- `extension.ts:234` - Test launch configuration

### From AL Test Runner
- `testController.ts:147` - Test execution handler
- `extension.ts:410` - Result parsing
- `alFileHelper.ts` - AL file parsing patterns

---

## Appendix C: Configuration Schema

### MCP Server Configuration
```typescript
interface MCPServerConfig {
  api: {
    token: string;
    url: string;
    timeout: number;
  };
  workspace: {
    path: string;
    launchJsonPath: string;
  };
  test: {
    defaultTimeout: number;
    pollingInterval: number;
    maxRetries: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}
```

---

## Document History

**Version 1.0** - 2024-11-09 - Initial comprehensive research and planning
**Version 2.0** - 2024-11-09 - Updated with architectural decisions from Q&A session

### Key Changes in Version 2.0:
- Added Section 1: Architectural Decisions (10 critical decisions documented)
- Updated all confidence levels based on decisions
- Resolved authentication approach (environment variables)
- Confirmed AL compilation support (using .NET CLI tools)
- Established iterative development approach
- Updated risk assessment (most risks mitigated)
- Confirmed TypeScript with MCP SDK
- Documented configuration strategy (config file + env vars)
- Established error handling pattern (exception-based)
- Confirmed test execution pattern (block-and-poll)

*Author: MCP Development Team*