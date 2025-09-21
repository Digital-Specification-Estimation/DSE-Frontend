import Link from "next/link";

interface LogoProps {
  asLink?: boolean;
  className?: string;
}

export function Logo({ asLink = true, className = "" }: LogoProps) {
  const logo = (
    <img 
      src="/logo.svg" 
      alt="Digital Specification Logo" 
      className={`h-full w-full ${className}`} 
    />
  );

  return asLink ? (
    <Link href="/" className="flex items-center gap-2">
      {logo}
    </Link>
  ) : (
    <div className="flex items-center gap-2">
      {logo}
    </div>
  );
}
