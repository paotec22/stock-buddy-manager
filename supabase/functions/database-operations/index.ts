import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

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

      return new Response(
        JSON.stringify({ data: exportData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (action === 'import') {
      const { data } = await req.json()
      
      // Clear existing data
      await Promise.all([
        supabase.from('sales').delete().neq('id', 0),
        supabase.from('expenses').delete().neq('id', 0),
        supabase.from('inventory list').delete().neq('id', 0),
      ])

      // Import new data
      if (data.inventory) {
        await supabase.from('inventory list').insert(data.inventory)
      }
      if (data.sales) {
        await supabase.from('sales').insert(data.sales)
      }
      if (data.expenses) {
        await supabase.from('expenses').insert(data.expenses)
      }

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
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})