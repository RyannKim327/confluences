export default function ConfluenceMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="confluence-flow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a3e635" />
        </linearGradient>
      </defs>
      <path
        d="M3 8 C10 8 12 13 17 16 C22 19 25 20 29 20"
        fill="none"
        stroke="url(#confluence-flow)"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M3 24 C10 24 12 19 17 16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10 3 C12 8 14 13 17 16"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="17" cy="16" r="3.4" fill="#a3e635" opacity="0.2" className="animate-pulse" />
      <circle cx="17" cy="16" r="1.9" fill="#a3e635" />
    </svg>
  )
}
