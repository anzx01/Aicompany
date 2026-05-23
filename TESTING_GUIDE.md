# Testing Guide

This document describes the testing setup and best practices for AI Company Builder.

## Testing Stack

- **Test Runner**: Vitest
- **React Testing**: @testing-library/react
- **User Interactions**: @testing-library/user-event
- **Assertions**: @testing-library/jest-dom
- **Environment**: jsdom

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test lib/llm/cost.test.ts

# Run tests matching pattern
pnpm test -- --grep "Cost Calculation"
```

## Test Structure

### Unit Tests

Unit tests focus on testing individual functions and components in isolation.

**Location**: Next to the file being tested with `.test.ts` or `.test.tsx` extension

**Example**:
```
lib/llm/cost.ts
lib/llm/cost.test.ts
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Location**: `__tests__/integration/` directory

### Test Organization

```typescript
describe('Feature Name', () => {
  describe('SubFeature', () => {
    it('should do something specific', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });
  });
});
```

## Writing Tests

### Testing Utilities

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Functions

```typescript
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

it('should wait for element', async () => {
  render(<AsyncComponent />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Mocking

```typescript
import { vi } from 'vitest';

// Mock function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Mock module
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      companies: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

it('should update value', async () => {
  const { result } = renderHook(() => useMyHook());

  expect(result.current.value).toBe(0);

  act(() => {
    result.current.increment();
  });

  await waitFor(() => {
    expect(result.current.value).toBe(1);
  });
});
```

## Test Coverage

### Current Coverage

Run `pnpm test:coverage` to see current coverage report.

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Priority Areas

1. **Critical Business Logic**
   - Cost calculations
   - Agent role assignments
   - Task scheduling
   - Memory management

2. **Platform Integrations**
   - Error handling
   - Rate limiting
   - Retry logic
   - Authentication

3. **UI Components**
   - Loading states
   - Error states
   - User interactions
   - Form validation

4. **API Endpoints**
   - Input validation
   - Authorization
   - Error responses
   - Data transformations

## Existing Tests

### Unit Tests

1. **lib/llm/cost.test.ts**
   - Cost calculation for different models
   - Prompt caching cost calculation
   - Monthly cost estimation

2. **lib/platform/error-handling.test.ts**
   - PlatformError creation
   - RetryStrategy with exponential backoff
   - RateLimiter functionality

3. **lib/agents/roles.test.ts**
   - Agent configuration retrieval
   - Agent assignment by company type
   - Role completeness validation

4. **components/ui/loading.test.tsx**
   - Loading component rendering
   - Skeleton components
   - Different loading states

5. **components/ui/error.test.tsx**
   - Error message display
   - Error page rendering
   - Empty state handling
   - User interaction callbacks

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**:
```typescript
it('should call setState', () => {
  const component = render(<MyComponent />);
  expect(component.setState).toHaveBeenCalled();
});
```

✅ **Good**:
```typescript
it('should display updated value', async () => {
  render(<MyComponent />);
  const button = screen.getByRole('button');
  await userEvent.click(button);
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 2. Use Descriptive Test Names

❌ **Bad**:
```typescript
it('works', () => { ... });
it('test 1', () => { ... });
```

✅ **Good**:
```typescript
it('should calculate cost correctly for Claude Sonnet', () => { ... });
it('should retry 3 times before throwing error', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update counter', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<Counter />);

  // Act
  const button = screen.getByRole('button');
  await user.click(button);

  // Assert
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 4. Test Edge Cases

```typescript
describe('calculateCost', () => {
  it('should handle zero tokens', () => {
    expect(calculateCost('model', 0, 0)).toBe(0);
  });

  it('should handle unknown model', () => {
    expect(calculateCost('unknown', 100, 50)).toBe(0);
  });

  it('should handle very large numbers', () => {
    const cost = calculateCost('model', 1000000, 1000000);
    expect(cost).toBeGreaterThan(0);
  });
});
```

### 5. Keep Tests Independent

Each test should be able to run independently without relying on other tests.

```typescript
describe('UserService', () => {
  beforeEach(() => {
    // Reset state before each test
    vi.clearAllMocks();
  });

  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

### 6. Mock External Dependencies

```typescript
// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      },
    },
  },
}));

// Mock API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
```

## Debugging Tests

### Run Single Test

```bash
pnpm test -- --run lib/llm/cost.test.ts
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run"],
  "console": "integratedTerminal"
}
```

### View Test Output

```bash
# Verbose output
pnpm test -- --reporter=verbose

# Show console.log
pnpm test -- --reporter=verbose --silent=false
```

## Common Issues

### 1. Module Not Found

**Problem**: `Cannot find module '@/lib/...'`

**Solution**: Check `vitest.config.ts` has correct path alias:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}
```

### 2. React Hooks Error

**Problem**: `Invalid hook call`

**Solution**: Ensure React Testing Library is properly configured and components are rendered within test environment.

### 3. Async Timeout

**Problem**: `Test timeout exceeded`

**Solution**: Increase timeout or use `waitFor`:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
}, { timeout: 5000 });
```

## Next Steps

### Areas Needing Tests

1. **Agent System**
   - Task execution
   - Memory integration
   - LLM communication

2. **Platform Integrations**
   - Twitter API
   - GitHub API
   - Product Hunt API

3. **OpenClaw Runtime**
   - Container management
   - Command execution
   - File operations

4. **Database Operations**
   - CRUD operations
   - Migrations
   - RLS policies

5. **API Routes**
   - tRPC procedures
   - Authentication
   - Authorization

### Testing Roadmap

- [ ] Add integration tests for agent workflows
- [ ] Add E2E tests with Playwright
- [ ] Set up visual regression testing
- [ ] Add performance benchmarks
- [ ] Implement mutation testing

---

**Last Updated**: 2026-02-13
**Test Coverage**: ~30% (Initial setup)
**Target Coverage**: 80%
