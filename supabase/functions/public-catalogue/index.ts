import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BUCKET = 'inventory-images'
const SIGN_TTL = 60 * 60 // 1 hour

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const location = url.searchParams.get('location')

    let q = supabase
      .from('inventory list')
      .select('id, "Item Description", Price, Quantity, location, image_url')
      .order('Item Description', { ascending: true })

    if (location && location !== 'All') q = q.eq('location', location)

    const { data, error } = await q
    if (error) throw error

    const paths = (data ?? [])
      .map((i: any) => i.image_url)
      .filter((p: any): p is string => typeof p === 'string' && p.length > 0 && !/^https?:\/\//.test(p))

    const urlMap: Record<string, string> = {}
    if (paths.length > 0) {
      const unique = Array.from(new Set(paths))
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(unique, SIGN_TTL)
      signed?.forEach((entry, idx) => {
        if (entry.signedUrl) urlMap[unique[idx]] = entry.signedUrl
      })
    }

    const items = (data ?? []).map((i: any) => ({
      id: i.id,
      description: i['Item Description'],
      price: i.Price,
      location: i.location,
      image: i.image_url
        ? (/^https?:\/\//.test(i.image_url) ? i.image_url : urlMap[i.image_url] ?? null)
        : null,
    }))

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=120' },
      status: 200,
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
