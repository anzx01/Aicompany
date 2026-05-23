// Heartbeat Cron API - Called by pg_cron every 6 hours
// This endpoint should be protected by a secret token

import { NextRequest, NextResponse } from 'next/server'
import { executeAllHeartbeats } from '@/lib/heartbeat'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/cron/heartbeat
 * Execute heartbeat for all active companies
 *
 * This endpoint should be called by pg_cron or external cron service
 * Protected by CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('[Heartbeat Cron] CRON_SECRET not configured')
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Heartbeat Cron] Invalid authorization')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[Heartbeat Cron] Starting heartbeat execution...')
    const startTime = Date.now()

    // Execute heartbeat for all active companies
    const results = await executeAllHeartbeats()

    const duration = Date.now() - startTime
    const successCount = results.filter(r => r.errors.length === 0).length
    const errorCount = results.length - successCount

    console.log(`[Heartbeat Cron] Completed in ${duration}ms`)
    console.log(`[Heartbeat Cron] Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      results: {
        total: results.length,
        success: successCount,
        errors: errorCount,
      },
      details: results,
    })
  } catch (error) {
    console.error('[Heartbeat Cron] Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cron/heartbeat
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'heartbeat-cron',
    timestamp: new Date().toISOString(),
  })
}
