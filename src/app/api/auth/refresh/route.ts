import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json({ error: 'Missing refresh_token' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials in environment variables.')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const body = new URLSearchParams({
      refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error refreshing token:', data)
      return NextResponse.json(
        { error: data.error_description || data.error || 'Failed to refresh token' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    })
  } catch (error: any) {
    console.error('Unexpected error in refresh route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
