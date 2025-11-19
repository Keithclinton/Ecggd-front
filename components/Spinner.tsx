import React from 'react'

type Props = {
  size?: number
  className?: string
  ariaLabel?: string
}

export default function Spinner({ size = 18, className = '', ariaLabel = 'Loading' }: Props) {
  const px = size
  return (
    <svg
      role="status"
      aria-label={ariaLabel}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeOpacity="0.25"
        fill="none"
      />
      <path
        d="M22 12a10 10 0 00-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
