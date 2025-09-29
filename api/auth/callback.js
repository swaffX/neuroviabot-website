export const config = {
  runtime: 'edge',
}

// CORS headers for preflight requests
export const headers = {
  'Access-Control-Allow-Origin': 'https://swaffx.github.io',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  console.log('=== VERCEL EDGE FUNCTION - DISCORD OAUTH CALLBACK ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Code received:', !!code)
  console.log('Error received:', error)

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://swaffx.github.io',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (error) {
    console.log('OAuth error received:', error)
    return new Response(JSON.stringify({ error: 'OAuth error', details: error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (!code) {
    console.log('No authorization code received')
    return new Response(JSON.stringify({ error: 'No authorization code' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Environment variables
    const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1294392725863514122'
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
    const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI

    console.log('Environment check:', {
      hasClientId: !!CLIENT_ID,
      hasClientSecret: !!CLIENT_SECRET,
      hasRedirectUri: !!REDIRECT_URI
    })

    if (!CLIENT_SECRET) {
      console.log('Missing CLIENT_SECRET')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Exchange code for token
    console.log('Starting token exchange...')
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })

    console.log('Token response status:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.log('Token exchange failed:', errorText)
      return new Response(JSON.stringify({ 
        error: 'Token exchange failed', 
        details: errorText 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tokenData = await tokenResponse.json()
    console.log('Token received successfully')

    // Get user data
    console.log('Fetching user data...')
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    console.log('User response status:', userResponse.status)

    if (!userResponse.ok) {
      console.log('Failed to fetch user data')
      return new Response(JSON.stringify({ error: 'Failed to fetch user data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userData = await userResponse.json()
    console.log('User data received:', userData.username)

    // Get user guilds
    console.log('Fetching guilds...')
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    let guildsData = []
    if (guildsResponse.ok) {
      guildsData = await guildsResponse.json()
      console.log('Guilds received:', guildsData.length)
    }

    // Create success response
    const userInfo = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      avatar: userData.avatar,
      guildCount: guildsData.length
    }

    console.log('OAuth success, redirecting to success page')

    // Redirect to GitHub Pages success page with user data
    const successUrl = `https://swaffx.github.io/neuroviabot-website/auth/success.html?user=${encodeURIComponent(JSON.stringify(userInfo))}`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': successUrl
      }
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
