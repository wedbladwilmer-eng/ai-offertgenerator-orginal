import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to build image URL with proper encoding
function buildImageUrl(fileName: string, ext?: number): string {
  const safeFileName = encodeURIComponent(fileName);
  const suffix = '.jpg'; // Default to .jpg based on our data
  const hosts = [
    'https://media.nwgmedia.com/',
    'https://images.nwgmedia.com/',
  ];
  return hosts[0] + safeFileName + suffix;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { articleNumber } = await req.json()
    
    console.log('📨 Received request for article:', articleNumber)
    
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

    // Try multiple URL formats - start with broader searches
    const candidateUrls = [
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${normalizedArticleNumber}`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?products=${normalizedArticleNumber}&assortmentIds=152611&assortmentIds=153639`,
      `https://commerce.gateway.nwg.se/assortment/sv/products?productNumbers=${normalizedArticleNumber}`,
      `https://commerce.gateway.nwg.se/assortment/sv/products/${normalizedArticleNumber}`
    ]

    let response: Response | null = null
    let lastStatus: number | undefined
    let lastStatusText = ''
    let lastBody: string | undefined

    for (const url of candidateUrls) {
      console.log('🌐 Fetching from:', url)
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'contextid': 'fa2225e0-7c06-47f3-9117-1dfb77535f27'
        }
      })
      console.log('🔎 API response status:', r.status)
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
    console.log('✅ Processing product:', product.productNumber || product.id)
    
    // Build image URL with priority: image.fileName -> pictures (front) -> pictures[0]
    let fileName = '';
    let ext = 0;
    
    if (product.image?.fileName) {
      fileName = product.image.fileName;
      ext = product.image.ext || 0;
    } else if (product.pictures && product.pictures.length > 0) {
      // Try to find front productpicture first
      const frontPic = product.pictures.find((p: any) => 
        p.type === 'Productpicture' && p.angle === 'front'
      );
      if (frontPic?.fileName) {
        fileName = frontPic.fileName;
        ext = frontPic.ext || 0;
      } else if (product.pictures[0]?.fileName) {
        fileName = product.pictures[0].fileName;
        ext = product.pictures[0].ext || 0;
      }
    }
    
    const image_url = fileName ? buildImageUrl(fileName, ext) : null;
    console.info('🖼️ Final resolved image URL:', image_url);
    
    // Extract all angle images from product.pictures
    const angle_images: Record<string, string> = {};
    if (product.pictures && Array.isArray(product.pictures)) {
      const angleMap: Record<string, string> = {
        'front': 'Front',
        'back': 'Back',
        'left': 'Left',
        'right': 'Right'
      };
      
      product.pictures
        .filter((p: any) => p.type === 'Productpicture' && p.angle && p.fileName)
        .forEach((p: any) => {
          const angleName = angleMap[p.angle.toLowerCase()];
          if (angleName) {
            angle_images[angleName] = buildImageUrl(p.fileName, p.ext || 0);
          }
        });
      
      console.log('🎨 Extracted angle images:', Object.keys(angle_images));
    }
    
    const transformedProduct = {
      id: product.productNumber || product.id,
      name: product.productName || product.name,
      brand: product.productBrandName || product.brand,
      price_ex_vat: product.price?.retail?.num || product.price?.exVat?.num || null,
      image_url,
      angle_images,
      category: product.filters?.category?.[0] || product.category || '',
      slug: product.slug || '',
      variations: product.variations?.map((v: any) => ({ color: v.color || v.name })) || [],
      description: product.productBrandName && product.productName 
        ? `En högkvalitativ ${product.filters?.category?.[0] || 'produkt'} från ${product.productBrandName}, perfekt för profilering.`
        : 'Högkvalitativ produkt perfekt för profilering.'
    }

    console.log('✅ Product transformed successfully')
    
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