# Issues Development Guide - compile_and_publish MCP Tool

## Overview
This document analyzes three issues reported with the `compile_and_publish` MCP tool and provides solutions based on the authoritative knowledge sources.

---

## Issue 1: Parameter Validation Error (environmentId shows as undefined)

### Symptoms
```json
{
  "type": "error",
  "kind": "internal_error",
  "message": "[{\"code\":\"invalid_type\",\"expected\":\"string\",\"received\":\"undefined\",\"path\":[\"environmentId\"],\"message\":\"Required\"}]"
}
```
This error occurs even when `environmentId` is explicitly provided in the request.

### Root Cause Analysis
**Location:** `src/index.ts` (lines 336-341)

The tool handler passes arguments with:
```typescript
case 'compile_and_publish':
  result = await executeCompileAndPublish(
    compilationService,
    (args || {}) as never
  );
  break;
```

**Potential Issues:**
1. The MCP SDK may pass tool arguments differently than expected (possibly nested under a different property)
2. The `args` object might have the parameters nested under `arguments` or similar
3. JSON parsing of the incoming request may not be handling the parameters correctly

### Solution
1. Add debug logging to inspect the actual structure of `args` before validation
2. Check if parameters are nested (e.g., `args.arguments` vs `args` directly)
3. Ensure the MCP request handler correctly extracts tool parameters from the protocol message

### Files to Modify
- `src/index.ts` - Tool handler dispatch logic
- Potentially `src/tools/compileAndPublish.ts` - Schema validation

---

## Issue 2: Dev Endpoint URL Discovery Failure

### Symptoms
All attempted URLs return 404:
- `{baseUrl}/bc/dev/apps`
- `{baseUrl}/BC/dev/apps`
- `{baseUrl}/BC250/dev/apps`
- `{baseUrl}/BC270/dev/apps`
- `{baseUrl}/BusinessCentral/dev/apps`

### Root Cause Analysis
**Current Implementation:** `src/api/developerEndpointClient.ts` (lines 209-227)
```typescript
private buildDeveloperEndpointUrl(environmentUrl: string, ...): string {
  const baseUrl = new URL(environmentUrl);
  const basePath = `${baseUrl.origin}${baseUrl.pathname.replace(/\/$/, '')}`;
  let url = `${basePath}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;
  return url;
}
```

**Knowledge Base Pattern:** `AL Developer Tools - Continia Environment Explorer/src/developerEndpoint.ts` (lines 37-39)
```typescript
const baseUrl = new URL(environment.url);
let url = `${baseUrl.origin}/${environment.id}/dev/apps?tenant=default&SchemaUpdateMode=${schemaUpdateMode}`;
```

**Key Difference:** The knowledge base uses `environment.id` (the GUID) as the service instance name, NOT the URL pathname.

### Correct URL Pattern
```
https://demoportaldev.continiaonline.com/{environmentId}/dev/apps?tenant=default&SchemaUpdateMode=synchronize
```

Where:
- **Origin:** `https://demoportaldev.continiaonline.com`
- **Service Instance:** The environment GUID (e.g., `42fd29a1-dd00-4dcd-b3cc-307d274d0d8d`)
- **Endpoint:** `/dev/apps`
- **Query Params:** `tenant=default`, `SchemaUpdateMode`, optionally `DependencyPublishingOption`

### Solution
Modify `buildDeveloperEndpointUrl()` to use the environment ID as the service instance:

```typescript
private buildDeveloperEndpointUrl(
  environmentId: string,  // Add this parameter
  environmentUrl: string,
  schemaUpdateMode: string,
  dependencyPublishingOption?: string
): string {
  const baseUrl = new URL(environmentUrl);
  const tenant = this.credentialsService.getDevTenant();

  // Use environment ID as the service instance (matches knowledge base pattern)
  let url = `${baseUrl.origin}/${environmentId}/dev/apps?tenant=${tenant}&SchemaUpdateMode=${schemaUpdateMode}`;

  if (dependencyPublishingOption) {
    url += `&DependencyPublishingOption=${dependencyPublishingOption}`;
  }

  return url;
}
```

### Files to Modify
- `src/api/developerEndpointClient.ts` - URL construction logic
- `src/services/compilationService.ts` - Pass environmentId to the URL builder

---

## Issue 3: Package Cache Path Not Using Provided Value / Monorepo Support

### Symptoms
Compilation fails with:
```
error AL1022: A package with publisher 'Continia Software', name 'Continia Banking',
and a version compatible with '27.2.0.0' could not be found in the package cache folders:
C:\...\base-application-test\.alpackages
```

Even when `packageCachePath` points to a monorepo root `.alpackages` folder.

### Root Cause Analysis
**Current Implementation:** `src/services/compilationService.ts` (lines 138-142)
```typescript
const compileResult = await this.compile({
  projectPath: params.workspacePath,
  packageCachePath: params.packageCachePath ?? path.join(params.workspacePath, '.alpackages'),
  rulesetPath: params.rulesetPath
});
```

**Knowledge Base Pattern:** `AL Developer Tools - Continia Environment Explorer/src/alc.ts` (lines 231-333)
The knowledge base implements:
1. Dependency resolution across workspace folders
2. Copying compiled `.app` files to dependent projects' `.alpackages`
3. Support for shared package caches in monorepo structures

### Solution Options

#### Option A: Simple Fix - Ensure Provided Path is Used
Verify `packageCachePath` is being correctly passed through the entire chain:
1. Zod validation preserves the value
2. Value passed to `compile()` method
3. Value used in AL compile command arguments

#### Option B: Enhanced Monorepo Support
Add logic to search parent directories for `.alpackages`:
```typescript
function resolvePackageCachePath(workspacePath: string, providedPath?: string): string {
  // 1. If explicitly provided, use it
  if (providedPath) {
    return providedPath;
  }

  // 2. Check workspace-local path
  const localPath = path.join(workspacePath, '.alpackages');
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // 3. Search parent directories for monorepo root
  let currentDir = path.dirname(workspacePath);
  while (currentDir !== path.dirname(currentDir)) {
    const parentPackages = path.join(currentDir, '.alpackages');
    if (fs.existsSync(parentPackages)) {
      return parentPackages;
    }
    currentDir = path.dirname(currentDir);
  }

  // 4. Fallback to workspace-local (will be created if needed)
  return localPath;
}
```

### Files to Modify
- `src/services/compilationService.ts` - Package cache resolution
- `src/tools/compileAndPublish.ts` - Possibly enhance schema description

---

## Summary of Changes Required

| Issue | Priority | Complexity | Files Affected |
|-------|----------|------------|----------------|
| 1. Parameter Validation | High | Medium | `index.ts`, `compileAndPublish.ts` |
| 2. Dev Endpoint URL | High | Low | `developerEndpointClient.ts`, `compilationService.ts` |
| 3. Package Cache Path | Medium | Low-Medium | `compilationService.ts` |

## Testing Recommendations

1. **Parameter Validation:** Add debug logging, test with various MCP clients
2. **Dev Endpoint URL:** Test with known working environment, verify URL format matches BC expectations
3. **Package Cache:** Test with monorepo structure, verify both explicit path and auto-discovery work
