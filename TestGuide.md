# Continia Environment MCP - Test Guide

## Overview
This guide provides step-by-step instructions to verify that the Continia Environment MCP is working correctly with Claude Desktop.

## Prerequisites
- Completed installation from [InstallGuide.md](InstallGuide.md)
- Claude Desktop running with MCP configured
- Valid Continia credentials

## Test Phases

### Phase 1: Connection Verification

#### Test 1.1: Verify MCP Tools Available
**Steps:**
1. Open Claude Desktop
2. Start a new conversation
3. Type: "What Continia tools do you have access to?"

**Expected Result:**
Claude should list the available Continia environment tools.

**Pass Criteria:** ✅ Tools are listed and accessible

---

#### Test 1.2: Authentication Check
**Steps:**
1. Ask Claude: "Can you list my Continia environments?"

**Expected Result:**
- Success: List of environments appears
- Failure: Clear authentication error message

**Pass Criteria:** ✅ Authentication successful or clear error provided

---

### Phase 2: Environment Management Tests

#### Test 2.1: List Environments
**Steps:**
1. Request: "List all my Continia environments"

**Expected Result:**
```
Environment List:
- ENV-001: Production Environment (Running)
- ENV-002: Test Environment (Stopped)
- ENV-003: Development Environment (Running)
```

**Pass Criteria:** ✅ Environments listed with status

---

#### Test 2.2: Get Environment Details
**Steps:**
1. Note an environment ID from previous test
2. Request: "Get details for environment [ENV-ID]"

**Expected Result:**
- Environment name, status, configuration details
- Resources allocated
- Last activity information

**Pass Criteria:** ✅ Detailed information retrieved

---

#### Test 2.3: Create New Environment
**Steps:**
1. Request: "Create a new Continia environment named MCP-Test-[today's date]"

**Expected Result:**
- Confirmation of environment creation
- New environment ID provided
- Status shows as "Created" or "Stopped"

**Pass Criteria:** ✅ Environment created successfully

**Note:** Record the new environment ID for cleanup

---

#### Test 2.4: Start Environment
**Steps:**
1. Request: "Start the environment [NEW-ENV-ID]"

**Expected Result:**
- Confirmation that environment is starting
- Status changes to "Starting" then "Running"
- May take 1-3 minutes

**Pass Criteria:** ✅ Environment starts successfully

---

#### Test 2.5: Stop Environment
**Steps:**
1. Request: "Stop the environment [NEW-ENV-ID]"

**Expected Result:**
- Confirmation that environment is stopping
- Status changes to "Stopping" then "Stopped"

**Pass Criteria:** ✅ Environment stops successfully

---

### Phase 3: Test Execution

#### Test 3.1: List Available Tests
**Steps:**
1. Ensure an environment is running
2. Request: "List available test suites on environment [ENV-ID]"

**Expected Result:**
- List of test suites/codeunits available
- Test names and identifiers shown

**Pass Criteria:** ✅ Test suites listed

---

#### Test 3.2: Execute Tests
**Steps:**
1. Request: "Run the test suite [TEST-NAME] on environment [ENV-ID]"

**Expected Result:**
```
Test Results:
- Test Suite: [TEST-NAME]
- Total Tests: 10
- Passed: 9
- Failed: 1
- Duration: 45 seconds

Failed Test:
- TestCustomerValidation: Expected 'Active' but got 'Inactive'
```

**Pass Criteria:** ✅ Tests execute and results returned

---

### Phase 4: Terminal Commands

#### Test 4.1: Basic Command
**Steps:**
1. Request: "Run 'dir' command on environment [ENV-ID]" (Windows)
   OR "Run 'ls' command on environment [ENV-ID]" (Linux/Mac)

**Expected Result:**
- Directory listing returned
- Output formatted clearly

**Pass Criteria:** ✅ Command executes and returns output

---

#### Test 4.2: Multi-line Command
**Steps:**
1. Request: "Run these commands on environment [ENV-ID]:
   - echo 'Test Line 1'
   - echo 'Test Line 2'"

**Expected Result:**
```
Output:
Test Line 1
Test Line 2
```

**Pass Criteria:** ✅ Multiple commands execute in sequence

---

### Phase 5: Error Handling

#### Test 5.1: Invalid Environment ID
**Steps:**
1. Request: "Get details for environment INVALID-999"

**Expected Result:**
- Clear error message: "Environment not found"
- No crash or undefined behavior

**Pass Criteria:** ✅ Graceful error handling

---

#### Test 5.2: Invalid Command
**Steps:**
1. Request: "Run 'invalidcommand123' on environment [ENV-ID]"

**Expected Result:**
- Error message indicating command not found
- No system crash

**Pass Criteria:** ✅ Error handled appropriately

---

### Phase 6: Cleanup

#### Test 6.1: Delete Test Environment
**Steps:**
1. Request: "Delete the environment [NEW-ENV-ID] that we created for testing"

**Expected Result:**
- Confirmation prompt (if implemented)
- Environment deleted successfully
- Environment no longer appears in list

**Pass Criteria:** ✅ Test environment cleaned up

---

## Complete Test Workflow Script

For a comprehensive test, ask Claude to execute this sequence:

```
"Please run through these tests for the Continia MCP:

1. List all my Continia environments
2. Create a new environment called 'MCP-Test-Validation'
3. Start the new environment
4. List available tests on the environment
5. Run a simple dir/ls command on it
6. Stop the environment
7. Delete the test environment

Please report any issues encountered during these steps."
```

## Test Results Recording

### Test Summary Template

```markdown
## Continia MCP Test Results
Date: [DATE]
Tester: [NAME]
Version: [MCP VERSION]

### Connection Tests
- [ ] MCP Tools Available
- [ ] Authentication Working

### Environment Management
- [ ] List Environments
- [ ] Get Environment Details
- [ ] Create Environment
- [ ] Start Environment
- [ ] Stop Environment

### Test Execution
- [ ] List Test Suites
- [ ] Execute Tests

### Terminal Commands
- [ ] Basic Command
- [ ] Multi-line Command

### Error Handling
- [ ] Invalid Environment ID
- [ ] Invalid Command

### Cleanup
- [ ] Delete Test Environment

### Overall Result: [PASS/FAIL]

### Notes:
[Any issues or observations]
```

## Common Issues During Testing

### Issue: Slow Response Times
**Diagnosis:** First run with npx takes time to download
**Solution:** Wait for initial download, subsequent runs are faster

### Issue: Authentication Failures
**Diagnosis:** Credentials not properly configured
**Solution:** Verify credentials in config file, check for special characters

### Issue: Environment Operations Timeout
**Diagnosis:** Continia API may be slow
**Solution:** Allow up to 5 minutes for environment operations

### Issue: Test Results Not Formatted
**Diagnosis:** Output parsing issue
**Solution:** Check raw output, report formatting issue

## Performance Benchmarks

Expected response times:
- List environments: < 5 seconds
- Get environment details: < 3 seconds
- Create environment: < 30 seconds
- Start/Stop environment: 1-3 minutes
- Execute tests: Depends on test suite size
- Terminal commands: < 10 seconds

## Reporting Issues

If tests fail, gather:
1. Screenshot of error message
2. Claude Desktop console logs (Ctrl+Shift+I / Cmd+Option+I)
3. Test step that failed
4. Expected vs actual result

Report issues at: [GitHub Issues](https://github.com/rf9000/test-env-mcp/issues)

## Advanced Testing

### Load Testing
Try multiple operations in sequence:
```
"Create 3 environments named Test-1, Test-2, Test-3, then list all environments, then delete all three test environments"
```

### Concurrent Operations
Test parallel operations:
```
"Start environment ENV-001 while also getting details for ENV-002"
```

### Long-Running Operations
Test timeouts and cancellation:
```
"Run a long-running test suite and check if results are properly streamed"
```

## Certification Checklist

Before considering the MCP production-ready:

**Core Functionality:**
- ✅ All environment operations work
- ✅ Test execution completes successfully
- ✅ Terminal commands execute properly

**Reliability:**
- ✅ Error handling is robust
- ✅ No crashes during testing
- ✅ Timeouts handled gracefully

**Performance:**
- ✅ Response times acceptable
- ✅ No memory leaks observed
- ✅ Handles multiple operations

**Security:**
- ✅ Credentials not exposed in logs
- ✅ Secure communication with API
- ✅ Proper access control

## Next Steps

After successful testing:
1. Document any custom configurations needed
2. Set up monitoring for production use
3. Create automation scripts using the MCP
4. Train team members on usage