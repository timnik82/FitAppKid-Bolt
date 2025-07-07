// Simple authentication test script
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orljnyyxspdgdunqfofi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybGpueXl4c3BkZ2R1bnFmb2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NzEzMTIsImV4cCI6MjA2NjE0NzMxMn0.9dz91GqP7zicrpxYBa8EEJPyL5ltZGsTlkxDoVuSPgQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    console.log('✅ Database connection successful')
    
    // Test authentication
    const { data: authData, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('❌ Auth system error:', authError.message)
      return false
    }
    console.log('✅ Authentication system accessible')
    
    return true
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Authentication system is ready for testing!')
    console.log('You can proceed with manual testing or continue with exercise display.')
  } else {
    console.log('\n❌ Authentication system needs to be fixed before proceeding.')
  }
  process.exit(0)
})