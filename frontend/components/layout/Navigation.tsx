'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation Component
 * 
 * This is a Client Component ('use client') because it uses:
 * - usePathname hook to highlight the active page
 * - Interactive hover effects
 */
export default function Navigation() {
  const pathname = usePathname();
  
  const links = [
    { href: '/', label: 'Home' },
    { href: '/chat', label: 'Chat' },
    { href: '/search', label: 'Search' },
    { href: '/notes', label: 'Notes' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className="bg-white/70 backdrop-blur-md border-b border-purple-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🧘‍♂️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Spiritual AI Guide
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

