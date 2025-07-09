#!/bin/bash

# Run All Tests Script
# This script executes the complete testing suite for the Children's Fitness App

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_URL=${TEST_DB_URL:-$SUPABASE_DB_URL}
VERBOSE=${VERBOSE:-false}

echo -e "${BLUE}🧪 Starting Children's Fitness App Test Suite${NC}"
echo "=================================================="

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}❌ psql is required but not installed${NC}"
        exit 1
    fi
    
    if [ -z "$TEST_DB_URL" ]; then
        echo -e "${RED}❌ TEST_DB_URL environment variable is required${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Run SQL test file
run_sql_test() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${BLUE}Running $test_name...${NC}"
    
    if [ "$VERBOSE" = true ]; then
        psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f "$test_file"
    else
        psql "$TEST_DB_URL" -v ON_ERROR_STOP=1 -f "$test_file" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name failed${NC}"
        return 1
    fi
}

# Main test execution
main() {
    local failed_tests=0
    local total_tests=0
    
    check_prerequisites
    
    echo ""
    echo -e "${BLUE}📊 Running Database Schema Validation Tests${NC}"
    echo "--------------------------------------------"
    if ! run_sql_test "tests/database/schema-validation.sql" "Schema Validation"; then
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    echo -e "${BLUE}🔒 Running Security and RLS Policy Tests${NC}"
    echo "----------------------------------------"
    if ! run_sql_test "tests/security/rls-policy-tests.sql" "RLS Policy Tests"; then
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    echo -e "${BLUE}👶 Running COPPA Compliance Tests${NC}"
    echo "--------------------------------"
    if ! run_sql_test "tests/coppa/compliance-tests.sql" "COPPA Compliance"; then
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    echo -e "${BLUE}⚡ Running Performance Tests${NC}"
    echo "---------------------------"
    if ! run_sql_test "tests/performance/query-performance.sql" "Query Performance"; then
        ((failed_tests++))
    fi
    ((total_tests++))
    
    echo ""
    echo -e "${BLUE}🔄 Running Integration Workflow Tests${NC}"
    echo "------------------------------------"
    if ! run_sql_test "tests/integration/user-workflows.sql" "User Workflows"; then
        ((failed_tests++))
    fi
    ((total_tests++))
    
    # Test Summary
    echo ""
    echo "=================================================="
    echo -e "${BLUE}📋 Test Summary${NC}"
    echo "=================================================="
    echo "Total tests: $total_tests"
    echo "Passed: $((total_tests - failed_tests))"
    echo "Failed: $failed_tests"
    
    if [ $failed_tests -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}The Children's Fitness App database is ready for production.${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}❌ $failed_tests TEST(S) FAILED${NC}"
        echo -e "${RED}Please review the failures and fix issues before proceeding.${NC}"
        exit 1
    fi
}

# Help function
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -v, --verbose    Show detailed test output"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  TEST_DB_URL      Database connection URL for testing"
    echo "  VERBOSE          Set to 'true' for verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run all tests quietly"
    echo "  $0 --verbose                 # Run all tests with detailed output"
    echo "  VERBOSE=true $0              # Run all tests with detailed output"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
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