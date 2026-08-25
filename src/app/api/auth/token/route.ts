import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials in environment variables.')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code',
    })

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error exchanging code:', data)
      return NextResponse.json(
        { error: data.error_description || data.error || 'Failed to exchange token' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token, // Only returned on first auth or if prompt=consent is used
      expires_in: data.expires_in,
    })
  } catch (error: any) {
    console.error('Unexpected error in token route:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
