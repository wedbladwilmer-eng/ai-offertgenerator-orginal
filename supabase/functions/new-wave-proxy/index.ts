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
    
    console.log('Received request for article:', articleNumber)
    
    if (!articleNumber) {
      console.error('No article number provided')
      return new Response(
        JSON.stringify({ error: 'Article number is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Try multiple URL formats in case the API expects different parameter styles
    const candidateUrls = [
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${articleNumber}&assortmentIds=152611&assortmentIds=153639`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${articleNumber}&assortmentIds=152611,153639`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${articleNumber}`
    ]

    let response: Response | null = null
    let lastStatus: number | undefined
    let lastStatusText = ''

    for (const url of candidateUrls) {
      console.log('Fetching from New Wave API:', url)
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
      console.log('New Wave API response status:', r.status)
      if (r.ok) {
        response = r
        break
      } else {
        lastStatus = r.status
        lastStatusText = r.statusText
        console.error('New Wave API error for URL:', url, r.status, r.statusText)
      }
    }

    if (!response) {
      throw new Error(`New Wave API responded with status: ${lastStatus} ${lastStatusText}`)
    }

    const data = await response.json()
    console.log('Received data from New Wave API, products count:', data?.length || 0)
    
    if (!data || data.length === 0) {
      console.error('No products found for article:', articleNumber)
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
    console.log('Processing product:', product.productNumber || product.id)
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

    console.log('Successfully transformed product data')
    
    return new Response(
      JSON.stringify(transformedProduct), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in new-wave-proxy:', error)
    console.error('Error details:', error instanceof Error ? error.stack : 'Unknown error')
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