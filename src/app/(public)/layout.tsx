import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArchiveMotion } from "@/components/archive-motion";
import "./cinematic.css";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-site" id="top">
      <ArchiveMotion />
      <Header />
      {children}
      <Footer />
    </div>
  );
}
