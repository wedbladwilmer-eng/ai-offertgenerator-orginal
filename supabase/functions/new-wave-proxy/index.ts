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
    
    const raw = String(articleNumber ?? '').trim()
    if (!raw) {
      console.error('No article number provided')
      return new Response(
        JSON.stringify({ error: 'Article number is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!/^\d{6,}$/.test(raw)) {
      console.error('Invalid article number format:', raw)
      return new Response(
        JSON.stringify({ error: 'Invalid article number. Use digits only, minimum 6 characters.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const normalizedArticleNumber = raw

    // Try multiple URL formats in case the API expects different parameter styles
    const candidateUrls = [
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${normalizedArticleNumber}&assortmentIds=152611,153639`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${normalizedArticleNumber}`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?productNumbers=${normalizedArticleNumber}`,
      `https://commerce.gateway.nwg.se/assortment/sv/products/${normalizedArticleNumber}`
    ]

    let response: Response | null = null
    let lastStatus: number | undefined
    let lastStatusText = ''
    let lastBody: string | undefined

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
        try {
          lastBody = await r.text()
          console.error('New Wave API error for URL:', url, r.status, r.statusText, 'Body:', lastBody?.slice(0, 500))
        } catch (_) {
          console.error('New Wave API error for URL (no body):', url, r.status, r.statusText)
        }
      }
    }

    if (!response) {
      return new Response(
        JSON.stringify({
          error: 'Product fetch failed',
          details: { lastStatus, lastStatusText, lastBody }
        }),
        {
          status: lastStatus && lastStatus >= 400 && lastStatus < 600 ? lastStatus : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!response) {
      throw new Error(`New Wave API responded with status: ${lastStatus} ${lastStatusText}`)
    }

    const data = await response.json()
    const products = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : [])
    console.log('Received data from New Wave API, products count:', products.length || 0)
    
    if (!products || products.length === 0) {
      console.error('No products found for article:', normalizedArticleNumber)
      return new Response(
        JSON.stringify({ error: 'Product not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform the data to match our expected format
    const product = products[0]
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