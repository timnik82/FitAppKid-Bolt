# Testing Plan for Children's Fitness App

This directory contains comprehensive tests to validate database integrity, COPPA compliance, security policies, and application functionality.

## Test Structure

```
tests/
├── database/           # Database schema and integrity tests
├── security/          # RLS policies and security tests
├── coppa/            # COPPA compliance validation
├── performance/      # Performance and scalability tests
├── integration/      # End-to-end functionality tests
├── scripts/          # Test automation scripts
└── fixtures/         # Test data and utilities
```

## Running Tests

### Prerequisites
- Supabase CLI installed
- Test database configured
- Node.js 18+ with npm

### Quick Start
```bash
# Install test dependencies
npm install --save-dev

# Run all tests
npm run test

# Run specific test suites
npm run test:database
npm run test:security
npm run test:coppa
npm run test:performance
npm run test:integration
```

### Test Environment Setup
```bash
# Create test environment
cp .env.example .env.test
# Edit .env.test with test database credentials

# Initialize test database
npm run test:setup
```

## Test Categories

### 1. Database Tests (`tests/database/`)
- Schema validation
- Migration integrity
- Constraint verification
- Data type validation
- Index performance

### 2. Security Tests (`tests/security/`)
- RLS policy verification
- Authentication testing
- Authorization boundaries
- Data isolation validation
- Parent-child access control

### 3. COPPA Compliance Tests (`tests/coppa/`)
- Data collection validation
- Parental consent verification
- Privacy settings enforcement
- Data retention compliance
- Child safety measures

### 4. Performance Tests (`tests/performance/`)
- Query performance analysis
- Load testing scenarios
- Scalability assessment
- Index optimization
- Connection pooling

### 5. Integration Tests (`tests/integration/`)
- User registration flows
- Exercise tracking workflows
- Adventure progression
- Reward system functionality
- Parent dashboard features

## Test Data Management

### Test Users
- Parent accounts with verified consent
- Child accounts with proper linking
- Unlinked adult accounts
- Test data isolation

### Test Scenarios
- Happy path workflows
- Edge cases and error conditions
- Security boundary testing
- Performance stress testing

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Main branch commits
- Scheduled daily runs
- Release preparations

## Reporting

Test results include:
- Coverage reports
- Performance metrics
- Security audit results
- COPPA compliance status
- Detailed error logs

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Include both positive and negative test cases
3. Document test purpose and expected outcomes
4. Ensure tests are deterministic and isolated
5. Update this README with new test categories