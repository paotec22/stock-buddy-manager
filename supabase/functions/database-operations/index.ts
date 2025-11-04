import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing auth header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Create authenticated client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Check admin role using new user_roles table
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Use service role for actual operations (now that auth is verified)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body once and store it
    const requestData = await req.json()
    const { action, data } = requestData

    console.log('Processing database operation:', action)

    if (action === 'export') {
      // Log access attempt
      await supabase.from('access_logs').insert({
        table_name: 'database_export',
        action_type: 'EXPORT',
        user_id: user.id
      })

      // Fetch data from all tables
      const [inventoryData, salesData, expensesData] = await Promise.all([
        supabase.from('inventory list').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
      ])

      const exportData = {
        inventory: inventoryData.data,
        sales: salesData.data,
        expenses: expensesData.data,
        exportDate: new Date().toISOString(),
      }

      return new Response(
        JSON.stringify({ data: exportData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'import') {
      if (!data) {
        throw new Error('No data provided for import')
      }

      // Validate import data structure
      if (!data.inventory && !data.sales && !data.expenses) {
        throw new Error('Import data must contain at least one of: inventory, sales, or expenses')
      }

      // Log access attempt
      await supabase.from('access_logs').insert({
        table_name: 'database_import',
        action_type: 'IMPORT',
        user_id: user.id
      })
      
      // Clear existing data
      await Promise.all([
        supabase.from('sales').delete().neq('id', 0),
        supabase.from('expenses').delete().neq('id', 0),
        supabase.from('inventory list').delete().neq('id', 0),
      ])

      // Import new data with validation
      const importPromises = []
      if (data.inventory && Array.isArray(data.inventory)) {
        importPromises.push(supabase.from('inventory list').insert(data.inventory))
      }
      if (data.sales && Array.isArray(data.sales)) {
        importPromises.push(supabase.from('sales').insert(data.sales))
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        importPromises.push(supabase.from('expenses').insert(data.expenses))
      }

      await Promise.all(importPromises)

      return new Response(
        JSON.stringify({ message: 'Data imported successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})