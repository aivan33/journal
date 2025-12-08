'use client'

import { formatDistanceToNow, format } from 'date-fns'
import { useEffect, useState } from 'react'

type RelativeTimeProps = {
  date: string
  className?: string
}

export function RelativeTime({ date, className = '' }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering relative time on client
  useEffect(() => {
    setMounted(true)
  }, [])

  const dateObj = new Date(date)
  const relativeTime = formatDistanceToNow(dateObj, { addSuffix: true })
  const fullDate = format(dateObj, 'MMMM d, yyyy \'at\' h:mm a')

  if (!mounted) {
    // Return static date on server to avoid hydration mismatch
    return (
      <time className={className} dateTime={date}>
        {fullDate}
      </time>
    )
  }

  return (
    <time className={className} dateTime={date} title={fullDate}>
      {relativeTime}
    </time>
  )
}
