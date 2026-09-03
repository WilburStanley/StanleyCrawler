"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const Header = () => {
  const pathname = usePathname();
  const isRootPage = pathname === "/";

  return (
    <header className="border-b border-border">
      <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
        {isRootPage ? (
          <span className="text-sm font-medium">StanleyCrawler</span>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted hover:text-text"
          >
            <ChevronLeft size={16} />
            Back to dashboard
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;