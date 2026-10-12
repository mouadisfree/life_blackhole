import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-4 pb-8"
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
