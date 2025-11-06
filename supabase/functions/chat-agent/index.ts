import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced system prompt with database access capabilities
    const systemPrompt = `You are an AI assistant for the SI Manager application with full database access. This is an inventory, sales, and business management system.

You have access to these database tables and can query/modify them:
- inventory list: Items with description, price, quantity, location, total
- sales: Sales records with item_id, quantity, sale_price, total_amount, sale_date
- expenses: Business expenses with description, amount, category, expense_date, location
- invoices: Invoice records with customer info, totals, dates
- invoice_items: Line items for invoices
- installations: Installation records
- profiles: User profiles with roles (admin, user, uploader, inventory_manager)

Available tools you can use:
1. query_database: Query any table to get information
2. create_invoice: Create a new invoice with items
3. add_inventory: Add or update inventory items
4. record_sale: Record a new sale
5. add_expense: Add a new expense

When users ask questions about data, query the database to provide accurate answers. When they ask to perform actions, use the appropriate tools.

Always be helpful, accurate, and use real data from the database.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "query_database",
          description: "Query the database to retrieve information from any table",
          parameters: {
            type: "object",
            properties: {
              table: { type: "string", description: "Table name to query" },
              filters: { type: "object", description: "Filters to apply" },
              limit: { type: "number", description: "Limit results" }
            },
            required: ["table"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_invoice",
          description: "Create a new invoice with customer details and items",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string" },
              customer_address: { type: "string" },
              customer_phone: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    quantity: { type: "number" },
                    unit_price: { type: "number" }
                  }
                }
              }
            },
            required: ["customer_name", "items"]
          }
        }
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
