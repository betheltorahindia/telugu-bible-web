import { NextResponse } from 'next/server'
import { getPushConfig } from '../../../../lib/notifications/push'

export async function GET() {
  const config = getPushConfig()
  if (!config) {
    return NextResponse.json({ error: 'Push notifications are not configured on this server.' }, { status: 503 })
  }
  return NextResponse.json({ publicKey: config.publicKey })
}
