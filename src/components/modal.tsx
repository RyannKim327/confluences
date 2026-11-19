import type { Dispatch, ReactNode, SetStateAction } from "react"

interface Props {
  show: boolean
  showModal: Dispatch<SetStateAction<boolean>>
  children: ReactNode
}

export default function Modal({ show, showModal, children }: Props) {
  if (!show) return null
  return (
    <div
      onClick={() => showModal(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-[min(90vw,420px)] rounded-xl border-2 border-white/20 bg-[#121212] p-4 shadow-2xl"
      >
        {children}
      </div>
    </div>
  )
}
