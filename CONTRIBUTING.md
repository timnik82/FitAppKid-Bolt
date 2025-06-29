# Contributing to Children's Fitness App Database Schema

Thank you for your interest in contributing to this project! This guide will help you get started with contributing to our COPPA-compliant database schema for children's fitness applications.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Database Schema Changes](#database-schema-changes)
- [COPPA Compliance Requirements](#coppa-compliance-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project is dedicated to providing a safe, inclusive environment for everyone. We are committed to creating technology that protects children's privacy and promotes their wellbeing.

### Our Standards

- **Child Safety First**: All contributions must prioritize children's privacy and safety
- **COPPA Compliance**: Maintain strict adherence to children's privacy laws
- **Inclusive Design**: Consider accessibility and diverse user needs
- **Respectful Communication**: Be kind, constructive, and professional
- **Educational Focus**: Promote healthy relationships with physical activity

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL knowledge
- Understanding of COPPA requirements
- Familiarity with Supabase/PostgreSQL

### Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/childrens-fitness-db-schema.git
   cd childrens-fitness-db-schema
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Local Database**
   ```bash
   # Set up your .env file
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run Migrations**
   ```bash
   # Apply all migrations to your development database
   supabase db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

1. **Database Schema Improvements**
   - Performance optimizations
   - New table relationships
   - Index improvements
   - Query optimizations

2. **COPPA Compliance Enhancements**
   - Privacy feature improvements
   - Data minimization strategies
   - Security enhancements
   - Audit trail improvements

3. **Documentation**
   - API documentation
   - Migration guides
   - Best practices
   - Example implementations

4. **Testing and Quality Assurance**
   - Test case development
   - Performance testing
   - Security testing
   - Compliance verification

5. **Bug Fixes**
   - Schema inconsistencies
   - Migration issues
   - Documentation errors
   - Security vulnerabilities

### What We Don't Accept

- Features that collect unnecessary child data
- Health tracking or biometric data collection
- Social features without proper safeguards
- Performance metrics that could promote unhealthy competition
- Any changes that compromise COPPA compliance

## Database Schema Changes

### Before Making Schema Changes

1. **Review COPPA Requirements**: Ensure changes maintain compliance
2. **Check Existing Issues**: Look for related discussions
3. **Consider Impact**: Think about existing data and users
4. **Plan Migration**: Design backward-compatible changes when possible

### Schema Change Process

1. **Create Migration File**
   ```bash
   # Create new migration file with descriptive name
   touch supabase/migrations/$(date +%Y%m%d%H%M%S)_your_feature_name.sql
   ```

2. **Write Migration SQL**
   ```sql
   /*
   # Brief Description of Changes
   
   ## Overview
   Explain what this migration does and why
   
   ## Changes
   1. New tables created
   2. Columns added/modified
   3. Indexes created
   4. Security policies updated
   */
   
   -- Your SQL changes here
   ```

3. **Test Migration**
   ```bash
   # Test on clean database
   supabase db reset
   supabase db push
   ```

4. **Update Documentation**
   - Update schema overview
   - Add API examples
   - Update migration guide

### Migration Best Practices

- **Always use IF EXISTS/IF NOT EXISTS** for safety
- **Include rollback instructions** in comments
- **Test with existing data** when possible
- **Maintain backward compatibility** when feasible
- **Document breaking changes** clearly

Example migration structure:
```sql
-- Add new feature safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'new_field'
  ) THEN
    ALTER TABLE exercises ADD COLUMN new_field text;
  END IF;
END $$;

-- Update existing data safely
UPDATE exercises 
SET new_field = 'default_value' 
WHERE new_field IS NULL;

-- Add constraints after data update
ALTER TABLE exercises 
ADD CONSTRAINT check_new_field 
CHECK (new_field IS NOT NULL);
```

## COPPA Compliance Requirements

### Mandatory Checks for All Contributions

1. **Data Minimization**
   - Only collect data necessary for functionality
   - No sensitive personal information
   - No health or biometric data
   - No location tracking

2. **Parental Control**
   - Parents can view all child data
   - Parents can modify child settings
   - Parents can delete child data
   - Parents can export child data

3. **Security Requirements**
   - Row Level Security on all tables
   - Proper access controls
   - Audit logging
   - Encryption support

4. **Age Verification**
   - Proper child identification
   - Parental consent tracking
   - Age-appropriate features

### COPPA Compliance Checklist

Before submitting any changes, verify:

- [ ] No new sensitive data collection
- [ ] Parental access maintained
- [ ] RLS policies updated appropriately
- [ ] Privacy settings respected
- [ ] Data retention policies followed
- [ ] Security measures maintained
- [ ] Documentation updated

## Pull Request Process

### Before Submitting

1. **Test Thoroughly**
   ```bash
   # Run all tests
   npm test
   
   # Test migrations
   supabase db reset
   supabase db push
   
   # Verify RLS policies
   # Test with different user roles
   ```

2. **Update Documentation**
   - Update README if needed
   - Add API examples for new features
   - Update migration guide
   - Document any breaking changes

3. **Check Code Quality**
   ```bash
   # Run linting
   npm run lint
   
   # Check formatting
   npm run format
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## COPPA Compliance
- [ ] No new sensitive data collection
- [ ] Parental controls maintained
- [ ] Privacy settings respected
- [ ] Security measures maintained

## Testing
- [ ] Migrations tested on clean database
- [ ] RLS policies verified
- [ ] Documentation updated
- [ ] Examples provided

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **COPPA Review**: Maintainers verify compliance requirements
3. **Technical Review**: Code quality and architecture review
4. **Documentation Review**: Ensure docs are complete and accurate
5. **Final Approval**: Maintainer approval required for merge

## Issue Reporting

### Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:
- Email security concerns to [security@example.com]
- Include detailed description and reproduction steps
- Allow time for investigation before public disclosure

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Database Environment:**
- Supabase version: [e.g. latest]
- PostgreSQL version: [e.g. 14.1]
- Migration version: [e.g. 20250628211740]

**Additional context**
Add any other context about the problem here.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**COPPA Compliance Considerations**
How does this feature maintain or improve COPPA compliance?

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## Development Guidelines

### Database Design Principles

1. **Privacy by Design**
   - Minimize data collection
   - Default to private settings
   - Provide user control
   - Ensure transparency

2. **Security First**
   - Use RLS on all tables
   - Implement proper access controls
   - Log all data access
   - Encrypt sensitive data

3. **Child-Friendly Focus**
   - Age-appropriate content
   - Educational value
   - Positive reinforcement
   - No performance pressure

4. **Scalable Architecture**
   - Efficient queries
   - Proper indexing
   - Normalized data structure
   - Performance monitoring

### Code Style

- Use clear, descriptive names for tables and columns
- Include comprehensive comments in migrations
- Follow PostgreSQL naming conventions
- Use consistent formatting

### Testing Requirements

- Test all migrations on clean databases
- Verify RLS policies with different user roles
- Test parent-child access patterns
- Validate COPPA compliance features

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Project documentation

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review similar issues or PRs
- Contact maintainers for guidance

Thank you for contributing to child-safe technology! 🌟