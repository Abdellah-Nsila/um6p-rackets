import Image from 'next/image';
import Link from 'next/link';

export default function Logo( {className}: {className?: string}) {
  return (
    <Link href="/">
      <Image
        src="/two_line_logo.png"
        alt="um6p racket Logo"
        width={500}
        height={500}
        className={`object-contain w-20 h-20 ${className || ''}`}
        priority
      />
    </Link>
  );
}
