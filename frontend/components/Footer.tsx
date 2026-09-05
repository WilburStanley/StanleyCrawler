import Link from "next/link";

const Footer = () => {
  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-4xl mx-auto space-y-6 py-4 flex gap-4 text-xs text-muted">
        <Link href="/privacy" className="hover:text-text">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-text">
          Terms
        </Link>
      </div>
    </footer>
  );
};

export default Footer;