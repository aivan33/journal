'use client'

import { useEffect, useRef } from 'react'

type AutoTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minRows?: number
}

export function AutoTextarea({ minRows = 4, value, onChange, ...props }: AutoTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Set the height to match the content
    const newHeight = Math.max(textarea.scrollHeight, minRows * 24) // Approximate line height
    textarea.style.height = `${newHeight}px`
  }, [value, minRows])

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      {...props}
      style={{
        minHeight: `${minRows * 24}px`,
        resize: 'none',
        overflow: 'hidden',
        ...props.style,
      }}
    />
  )
}
