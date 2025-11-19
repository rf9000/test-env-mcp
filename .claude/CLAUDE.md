# Continia Environment MCP Project

## Project Goal
Create an MCP (Model Context Protocol) server that enables LLMs to:
- Execute automated tests on these environments
- Provide terminal-based interaction (no UI required)

## Knowledge Sources
**IMPORTANT**: Reference ONLY these authoritative sources for implementation details:

### Environment Management
- **Path**: `C:\GeneralDev\MCPDevelopment\AL Developer Tools - Continia Environment Explorer`
- **Purpose**: Environment setup, configuration, and lifecycle management

### Test Execution
- **Path**: `C:\GeneralDev\MCPDevelopment\AL Developer Tools - Continia AL Test Runner`
- **Purpose**: Test runner implementation, test discovery, and execution patterns

## Technical Requirements

### Architecture Principles
- **DRY** (Don't Repeat Yourself): Eliminate code duplication through abstraction
- **SOLID**: Apply all five principles for maintainable, extensible code
- **Minimal Code**: Write only what's necessary to achieve functionality

### Test-Driven Development (TDD)
- **Write tests first**: Create failing tests before implementing functionality
- **Red-Green-Refactor**: Follow the TDD cycle strictly
- **Integration Testing Focus**: Test actual code behavior, NOT mocked implementations
- **No Fakes/Stubs/Mocks**: Avoid test doubles - test against real implementations
- **Real Environment Testing**: Tests should interact with actual environments and services
- **Behavioral Verification**: Ensure tests verify real system behavior end-to-end

### TypeScript Standards
- Enable and configure TypeScript linting (ESLint with TypeScript parser)
- Use strict TypeScript compiler options
- Follow TypeScript best practices and conventions
- **ALWAYS** compile changes before committing (`tsc --noEmit` for validation)

### MCP Implementation Focus
- Design for programmatic access via LLMs
- Prioritize CLI/terminal interactions over GUI
- Ensure clear, structured command responses
- Implement robust error handling with descriptive messages

## Development Workflow
1. Review relevant source code in knowledge directories before implementing
2. Write type-safe, well-documented TypeScript code
3. Validate with linter and compiler
4. Test functionality through MCP protocol
5. Document any new tools or capabilities added 