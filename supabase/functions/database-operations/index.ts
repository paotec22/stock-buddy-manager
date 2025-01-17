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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body once and store it
    const requestData = await req.json()
    const { action, data } = requestData

    console.log('Processing database operation:', action)

    if (action === 'export') {
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

      console.log('Export completed successfully')
      return new Response(
        JSON.stringify({ data: exportData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'import') {
      if (!data) {
        throw new Error('No data provided for import')
      }

      console.log('Starting database import')
      
      // Clear existing data
      await Promise.all([
        supabase.from('sales').delete().neq('id', 0),
        supabase.from('expenses').delete().neq('id', 0),
        supabase.from('inventory list').delete().neq('id', 0),
      ])

      // Import new data
      const importPromises = []
      if (data.inventory) {
        importPromises.push(supabase.from('inventory list').insert(data.inventory))
      }
      if (data.sales) {
        importPromises.push(supabase.from('sales').insert(data.sales))
      }
      if (data.expenses) {
        importPromises.push(supabase.from('expenses').insert(data.expenses))
      }

      await Promise.all(importPromises)
      console.log('Import completed successfully')

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
    console.error('Error in database operation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})