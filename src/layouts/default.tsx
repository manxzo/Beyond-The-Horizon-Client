import { Link } from "@heroui/react";

import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";
import { Facebook, Instagram } from "lucide-react";
export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        {children}
      </main>
      <footer className="w-full py-3 bg-background border-t">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-default-500">
              © {new Date().getFullYear()} {siteConfig.name}
            </p>

            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                {siteConfig.footerLinks?.slice(0, 3).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs text-default-500 hover:text-primary"
                    title={link.description}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href="https://beyondthehorizon.my/" aria-label="Twitter" className="text-default-500 hover:text-primary">
                  <Instagram />
                </Link>
                <Link href="https://beyondthehorizon.my/" aria-label="Facebook" className="text-default-500 hover:text-primary">
                  <Facebook />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
