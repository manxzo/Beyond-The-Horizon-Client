import { Link } from "@heroui/react";

import { Navbar } from "@/components/navbar";
import { siteConfig } from "@/config/site";

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
      <footer className="w-full py-6 bg-background border-t">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Footer links */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2">{siteConfig.name}</h3>
              <p className="text-sm text-default-500 mb-4">{siteConfig.description}</p>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Links</h3>
              <div className="flex flex-col gap-2">
                {siteConfig.footerLinks?.slice(0, 2).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-default-500 hover:text-primary"
                    title={link.description}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Support</h3>
              <div className="flex flex-col gap-2">
                {siteConfig.footerLinks?.slice(2).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-default-500 hover:text-primary"
                    title={link.description}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2">Connect</h3>
              <div className="flex gap-4 mt-2">
                <Link href="https://twitter.com/beyondthehorizon" aria-label="Twitter" className="text-default-500 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </Link>
                <Link href="https://facebook.com/beyondthehorizon" aria-label="Facebook" className="text-default-500 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Link>
                <Link href="https://instagram.com/beyondthehorizon" aria-label="Instagram" className="text-default-500 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-default-200 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-default-500">
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-1 mt-4 md:mt-0">
              <span className="text-sm text-default-500">Powered by</span>
              <Link
                isExternal
                className="text-primary text-sm"
                href="https://heroui.com"
                title="heroui.com homepage"
              >
                HeroUI
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
