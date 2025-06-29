#!/bin/bash

# Test Environment Setup Script
# This script sets up a clean test environment for the Children's Fitness App

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_URL=${TEST_DB_URL:-$SUPABASE_DB_URL}
RESET_DB=${RESET_DB:-false}

echo -e "${BLUE}🔧 Setting up Test Environment for Children's Fitness App${NC}"
echo "========================================================"

# Check if Supabase CLI is available
check_supabase_cli() {
    if command -v supabase &> /dev/null; then
        echo -e "${GREEN}✅ Supabase CLI found${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Supabase CLI not found, using direct psql connection${NC}"
        return 1
    fi
}

# Setup using Supabase CLI
setup_with_supabase() {
    echo -e "${BLUE}Setting up with Supabase CLI...${NC}"
    
    if [ "$RESET_DB" = true ]; then
        echo -e "${YELLOW}Resetting database...${NC}"
        supabase db reset --linked
    fi
    
    echo -e "${BLUE}Applying migrations...${NC}"
    supabase db push --linked
    
    echo -e "${GREEN}✅ Database setup completed with Supabase CLI${NC}"
}

# Setup using direct SQL
setup_with_sql() {
    echo -e "${BLUE}Setting up with direct SQL connection...${NC}"
    
    if [ -z "$TEST_DB_URL" ]; then
        echo -e "${RED}❌ TEST_DB_URL is required for direct SQL setup${NC}"
        exit 1
    fi
    
    if [ "$RESET_DB" = true ]; then
        echo -e "${YELLOW}⚠️  Database reset requested but not implemented for direct SQL${NC}"
        echo -e "${YELLOW}Please manually reset your database if needed${NC}"
    fi
    
    echo -e "${BLUE}Applying migrations in order...${NC}"
    
    # Apply migrations in order
    local migration_files=(
        "supabase/migrations/20250621211523_spring_frog.sql"
        "supabase/migrations/20250621211632_winter_sky.sql"
        "supabase/migrations/20250622063608_damp_surf.sql"
        "supabase/migrations/20250622064655_pale_art.sql"
        "supabase/migrations/20250622064849_quiet_haze.sql"
        "supabase/migrations/20250628211740_sparkling_beacon.sql"
    )
    
    for migration in "${migration_files[@]}"; do
        if [ -f "$migration" ]; then
            echo -e "${BLUE}Applying $(basename "$migration")...${NC}"
            psql "$TEST_DB_URL" -f "$migration" > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✅ $(basename "$migration") applied${NC}"
            else
                echo -e "${RED}❌ Failed to apply $(basename "$migration")${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Migration file not found: $migration${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ All migrations applied successfully${NC}"
}

# Verify database setup
verify_setup() {
    echo -e "${BLUE}Verifying database setup...${NC}"
    
    # Check if key tables exist
    local tables=(
        "profiles"
        "exercises"
        "adventures"
        "user_progress"
        "parent_child_relationships"
    )
    
    for table in "${tables[@]}"; do
        if psql "$TEST_DB_URL" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Table '$table' exists and accessible${NC}"
        else
            echo -e "${RED}❌ Table '$table' not found or not accessible${NC}"
            exit 1
        fi
    done
    
    # Check if RLS is enabled
    local rls_count=$(psql "$TEST_DB_URL" -t -c "
        SELECT COUNT(*) 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relrowsecurity = true;
    " | tr -d ' ')
    
    if [ "$rls_count" -gt 0 ]; then
        echo -e "${GREEN}✅ RLS enabled on $rls_count tables${NC}"
    else
        echo -e "${RED}❌ RLS not properly enabled${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Database verification completed${NC}"
}

# Create test data
create_test_data() {
    echo -e "${BLUE}Creating minimal test data...${NC}"
    
    # Only create test data if tables are empty
    local profile_count=$(psql "$TEST_DB_URL" -t -c "SELECT COUNT(*) FROM profiles;" | tr -d ' ')
    
    if [ "$profile_count" -eq 0 ]; then
        echo -e "${BLUE}Creating test profiles...${NC}"
        
        psql "$TEST_DB_URL" << EOF > /dev/null 2>&1
-- Create test parent
INSERT INTO profiles (id, display_name, is_child, email, privacy_settings)
VALUES (
    gen_random_uuid(),
    'Test Parent',
    false,
    'testparent@example.com',
    '{"data_sharing": false, "analytics": false}'::jsonb
);

-- Create test child
DO \$\$
DECLARE
    parent_id uuid;
    child_id uuid := gen_random_uuid();
BEGIN
    SELECT id INTO parent_id FROM profiles WHERE email = 'testparent@example.com';
    
    INSERT INTO profiles (id, display_name, is_child, date_of_birth, 
                         parent_consent_given, parent_consent_date, privacy_settings)
    VALUES (
        child_id,
        'Test Child',
        true,
        '2015-01-01',
        true,
        now(),
        '{"data_sharing": false, "analytics": false}'::jsonb
    );
    
    -- Link parent and child
    INSERT INTO parent_child_relationships (parent_id, child_id, consent_given, consent_date)
    VALUES (parent_id, child_id, true, now());
    
    -- Initialize user progress
    INSERT INTO user_progress (user_id, weekly_points_goal, monthly_goal_exercises)
    VALUES (child_id, 100, 20);
END \$\$;
EOF
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Test data created${NC}"
        else
            echo -e "${RED}❌ Failed to create test data${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Test data already exists (${profile_count} profiles)${NC}"
    fi
}

# Main setup function
main() {
    echo -e "${BLUE}Starting test environment setup...${NC}"
    
    # Check database connection
    if [ -n "$TEST_DB_URL" ]; then
        if psql "$TEST_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database connection successful${NC}"
        else
            echo -e "${RED}❌ Cannot connect to database${NC}"
            exit 1
        fi
    fi
    
    # Setup database
    if check_supabase_cli; then
        setup_with_supabase
    else
        setup_with_sql
    fi
    
    # Verify setup
    verify_setup
    
    # Create test data
    create_test_data
    
    echo ""
    echo -e "${GREEN}🎉 Test environment setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run tests with: ./tests/scripts/run-all-tests.sh"
    echo "2. Or run specific test categories:"
    echo "   - Database: psql \$TEST_DB_URL -f tests/database/schema-validation.sql"
    echo "   - Security: psql \$TEST_DB_URL -f tests/security/rls-policy-tests.sql"
    echo "   - COPPA: psql \$TEST_DB_URL -f tests/coppa/compliance-tests.sql"
    echo ""
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --reset-db       Reset the database before setup (Supabase CLI only)"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  TEST_DB_URL      Database connection URL for testing"
    echo "  RESET_DB         Set to 'true' to reset database"
    echo ""
    echo "Examples:"
    echo "  $0                           # Setup test environment"
    echo "  $0 --reset-db                # Reset and setup test environment"
    echo "  RESET_DB=true $0             # Reset and setup test environment"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset-db)
            RESET_DB=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main