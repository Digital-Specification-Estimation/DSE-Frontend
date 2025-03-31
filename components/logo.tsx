import Link from "next/link";

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <img src="/logo.svg" alt="Logo" className="h-full w-full " />
    </Link>
  );
}
