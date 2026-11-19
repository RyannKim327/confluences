interface titleProps {
  title: string
  description?: string
}

export default function Title({ title, description }: titleProps) {
  return (
    <div className="flex flex-col px-6 pt-8 pb-6 md:px-10 md:pt-10">
      <span className="mb-3 h-0.5 w-8 rounded-full bg-lime-400" />
      <span className="text-3xl font-extrabold tracking-tight">{title}</span>
      {description && <span className="mt-1.5 text-sm text-white/45">{description}</span>}
    </div>
  )
}
