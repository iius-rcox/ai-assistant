/**
 * Supabase Client Singleton
 * Feature: 003-correction-ui
 * Task: T008
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY. ' +
    'See .env.template for reference.'
  )
}

// Create type-safe Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Export for use in services
export default supabase
