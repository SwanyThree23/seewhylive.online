'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Btn } from '@/components/ui/Btn'

interface Props {
  streamId: string
  auraEnabled: boolean
}

export function CreatorControls({ streamId, auraEnabled }: Props) {
  const router = useRouter()
  const [endingStream, setEndingStream] = useState(false)
  const [triggeringAura, setTriggeringAura] = useState(false)
  const [auraMsg, setAuraMsg] = useState('')

  async function endStream() {
    setEndingStream(true)
    try {
      await fetch(`/api/streams/${streamId}/end`, { method: 'POST' })
      router.push('/analytics')
    } finally {
      setEndingStream(false)
    }
  }

  async function triggerAura() {
    setTriggeringAura(true)
    setAuraMsg('')
    try {
      const res = await fetch(`/api/streams/${streamId}/aura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'manual', context: 'Stream chat is active' }),
      })
      const d = await res.json()
      if (d.success) setAuraMsg('AURA triggered!')
      else setAuraMsg(d.error?.message ?? 'AURA unavailable')
      setTimeout(() => setAuraMsg(''), 3000)
    } finally {
      setTriggeringAura(false)
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-border bg-bg/95 px-4 py-2">
      <span className="font-bebas text-caption tracking-widest text-muted">CREATOR</span>
      <div className="flex-1" />
      {auraEnabled && (
        <Btn size="sm" variant="secondary" onClick={triggerAura} loading={triggeringAura}>
          ✦ AURA
        </Btn>
      )}
      <Btn size="sm" variant="danger" onClick={endStream} loading={endingStream}>
        END STREAM
      </Btn>
      {auraMsg && (
        <span className="font-barlow text-caption text-purple">{auraMsg}</span>
      )}
    </div>
  )
}
