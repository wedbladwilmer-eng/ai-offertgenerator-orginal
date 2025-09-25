import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleNumber } = await req.json()
    
    if (!articleNumber) {
      return new Response(
        JSON.stringify({ error: 'Article number is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Make request to New Wave API
    const newWaveUrl = `https://commerce.gateway.nwg.se/assortment/sv/products?products=${articleNumber}&assortmentIds=152611&assortmentIds=153639`
    
    const response = await fetch(newWaveUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; OffertskapareBotBot/1.0)'
      }
    })

    if (!response.ok) {
      throw new Error(`New Wave API responded with status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Product not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform the data to match our expected format
    const product = data[0]
    const transformedProduct = {
      id: product.productNumber || product.id,
      name: product.productName || product.name,
      brand: product.productBrandName || product.brand,
      price_ex_vat: product.price?.retail?.num || product.price?.exVat?.num || null,
      image_url: product.image?.fileName 
        ? `https://media.nwgmedia.com/${product.image.fileName}.jpg`
        : (product.pictures?.[0]?.fileName 
          ? `https://media.nwgmedia.com/${product.pictures[0].fileName}.jpg`
          : null),
      category: product.filters?.category?.[0] || product.category || '',
      slug: product.slug || '',
      variations: product.variations?.map((v: any) => ({ color: v.color || v.name })) || [],
      description: product.productBrandName && product.productName 
        ? `En högkvalitativ ${product.filters?.category?.[0] || 'produkt'} från ${product.productBrandName} perfekt för profilering. Tillverkad för komfort och stil.`
        : 'Högkvalitativ produkt perfekt för profilering.'
    }

    return new Response(
      JSON.stringify(transformedProduct), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in new-wave-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch product data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})