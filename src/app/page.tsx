import HeroSection from "@/components/HeroSection";
import GlobeSection from "@/components/globe/GlobeSection";

export default function Home() {
  return (
    <main className="h-dvh snap-y snap-mandatory overflow-y-auto">
      <HeroSection />
      <GlobeSection />
    </main>
  );
}
