import Link from "next/link"

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full bg-orange-500 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-orange-500"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold text-blue-900">Digital Specification</span>
        <span className="text-sm font-bold text-orange-500">Estimation</span>
      </div>
    </Link>
  )
}

