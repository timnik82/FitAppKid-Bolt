# Testing Guide for Children's Fitness App

This guide provides comprehensive instructions for testing the database schema, security policies, COPPA compliance, and application functionality.

## Overview

Our testing strategy ensures:
- **Database Integrity**: Schema validation and constraint verification
- **Security**: Row Level Security (RLS) policy testing
- **COPPA Compliance**: Child privacy protection validation
- **Performance**: Query optimization and scalability testing
- **Integration**: End-to-end workflow verification

## Quick Start

### Prerequisites
- Node.js 18+ with npm
- PostgreSQL client (psql)
- Supabase CLI (optional but recommended)
- Test database access

### Setup Test Environment
```bash
# Install dependencies
npm install

# Setup test environment
npm run test:setup

# Run all tests
npm run test
```

## Test Categories

### 1. Database Schema Validation (`tests/database/`)

**Purpose**: Verify database structure, constraints, and relationships

**Tests Include**:
- Table existence verification
- Foreign key constraint validation
- Check constraint verification
- Index performance validation
- RLS enablement verification
- COPPA data field prohibition

**Run Tests**:
```bash
npm run test:database
```

**Manual Verification**:
```sql
-- Check table structure
\dt public.*

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check constraints
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public';
```

### 2. Security and RLS Policy Tests (`tests/security/`)

**Purpose**: Validate data isolation and access control

**Tests Include**:
- Parent-child data access verification
- Cross-family data isolation
- Profile access control
- Exercise session privacy
- User progress protection
- Data modification restrictions

**Run Tests**:
```bash
npm run test:security
```

**Test Scenarios**:
- Parent can access child's data
- Parent cannot access other children's data
- Child can access own data only
- Unrelated users cannot access family data

### 3. COPPA Compliance Tests (`tests/coppa/`)

**Purpose**: Ensure strict adherence to children's privacy laws

**Tests Include**:
- Prohibited data field detection
- Parental consent tracking verification
- Privacy settings validation
- Data minimization compliance
- Gamification system verification
- Age verification implementation

**Run Tests**:
```bash
npm run test:coppa
```

**Compliance Checks**:
- No health data collection (weight, BMI, calories)
- No sensitive personal data (real names, addresses)
- No location tracking
- Restrictive default privacy settings
- Proper parental consent workflow

### 4. Performance Tests (`tests/performance/`)

**Purpose**: Identify bottlenecks and optimize queries

**Tests Include**:
- User dashboard query performance
- Exercise search and filtering
- Adventure progress calculation
- Parent dashboard with multiple children
- Index usage verification
- Table size monitoring

**Run Tests**:
```bash
npm run test:performance
```

**Performance Benchmarks**:
- Dashboard queries: < 100ms
- Exercise search: < 50ms
- Adventure progress: < 75ms
- Parent dashboard: < 100ms

### 5. Integration Workflow Tests (`tests/integration/`)

**Purpose**: Validate complete user workflows end-to-end

**Tests Include**:
- User onboarding workflow
- Exercise session recording
- Adventure progression
- Reward earning system
- Parent dashboard access
- Data privacy isolation
- Complete cleanup verification

**Run Tests**:
```bash
npm run test:integration
```

**Workflow Coverage**:
- Parent creates account
- Child account creation with consent
- Exercise tracking and progress updates
- Adventure completion and rewards
- Parent monitoring capabilities
- Account deletion and data cleanup

## Test Environment Management

### Setup Clean Environment
```bash
# Reset and setup fresh test environment
npm run test:reset

# Setup without reset
npm run test:setup
```

### Environment Variables
```bash
# Required for testing
export TEST_DB_URL="postgresql://user:pass@host:port/database"

# Optional settings
export VERBOSE=true          # Detailed test output
export RESET_DB=true         # Reset database before setup
```

### Test Data Management

**Automatic Test Data**:
- Minimal test profiles (parent and child)
- Sample exercises and adventures
- Basic progress records
- Test relationships

**Test Data Isolation**:
- Each test creates its own data
- Automatic cleanup after tests
- No interference between test runs

## Running Specific Tests

### Individual Test Files
```bash
# Database schema validation
psql $TEST_DB_URL -f tests/database/schema-validation.sql

# RLS policy verification
psql $TEST_DB_URL -f tests/security/rls-policy-tests.sql

# COPPA compliance check
psql $TEST_DB_URL -f tests/coppa/compliance-tests.sql

# Performance analysis
psql $TEST_DB_URL -f tests/performance/query-performance.sql

# Integration workflows
psql $TEST_DB_URL -f tests/integration/user-workflows.sql
```

### Verbose Output
```bash
# See detailed test output
npm run test:verbose

# Or set environment variable
VERBOSE=true npm run test
```

## Continuous Integration

### GitHub Actions Integration

Tests run automatically on:
- Pull requests to main branch
- Pushes to main branch
- Scheduled daily runs

### CI Configuration
```yaml
# .github/workflows/test.yml
name: Database Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm run test
        env:
          TEST_DB_URL: ${{ secrets.TEST_DB_URL }}
```

## Test Results and Reporting

### Success Indicators
- ✅ All tables and constraints verified
- ✅ RLS policies properly isolate data
- ✅ No COPPA violations detected
- ✅ Performance within acceptable limits
- ✅ Complete workflows function correctly

### Failure Investigation

**Common Issues**:
1. **Missing Tables**: Check migration order and completion
2. **RLS Failures**: Verify policy syntax and user context
3. **COPPA Violations**: Remove prohibited data fields
4. **Performance Issues**: Add indexes or optimize queries
5. **Workflow Failures**: Check data relationships and constraints

**Debugging Steps**:
```bash
# Check migration status
supabase db diff

# Verify database connection
psql $TEST_DB_URL -c "SELECT version();"

# Check table structure
psql $TEST_DB_URL -c "\dt public.*"

# Verify RLS policies
psql $TEST_DB_URL -c "\dp public.*"
```

## Best Practices

### Test Development
1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Deterministic**: Tests should produce consistent results
4. **Comprehensive**: Cover both positive and negative cases
5. **Documentation**: Clearly document test purpose and expectations

### Security Testing
1. **Multiple Roles**: Test with different user types
2. **Boundary Conditions**: Test edge cases and limits
3. **Data Isolation**: Verify cross-family data protection
4. **Access Patterns**: Test all CRUD operations
5. **Policy Coverage**: Ensure all RLS policies are tested

### COPPA Testing
1. **Data Audit**: Regularly scan for prohibited fields
2. **Consent Workflow**: Test complete parental consent process
3. **Privacy Settings**: Verify restrictive defaults
4. **Age Verification**: Test child identification logic
5. **Data Retention**: Verify deletion and cleanup processes

## Troubleshooting

### Common Test Failures

**Database Connection Issues**:
```bash
# Check connection
psql $TEST_DB_URL -c "SELECT 1;"

# Verify credentials
echo $TEST_DB_URL
```

**Migration Issues**:
```bash
# Check migration status
supabase db diff

# Reset and reapply
supabase db reset
supabase db push
```

**Permission Issues**:
```bash
# Check database permissions
psql $TEST_DB_URL -c "SELECT current_user, session_user;"

# Verify RLS context
psql $TEST_DB_URL -c "SELECT auth.uid();"
```

### Getting Help

1. **Check Logs**: Review test output for specific error messages
2. **Verify Setup**: Ensure test environment is properly configured
3. **Database State**: Check if database is in expected state
4. **Documentation**: Review relevant documentation sections
5. **Issues**: Create GitHub issue with test failure details

## Contributing to Tests

### Adding New Tests
1. Follow existing test file structure
2. Include both positive and negative test cases
3. Add proper cleanup procedures
4. Update this documentation
5. Test your tests in isolation

### Test File Structure
```sql
/*
# Test File Description
Brief description of what this test file validates
*/

-- Test 1: Descriptive test name
DO $$
BEGIN
    -- Test logic here
    RAISE NOTICE 'SUCCESS: Test description';
END $$;

-- Final success message
RAISE NOTICE '🎉 ALL [CATEGORY] TESTS PASSED';
```

Remember: **Child safety and privacy are our top priorities**. All tests must validate that children's data is properly protected and COPPA requirements are met.