import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/hero/Hero";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { Mission } from "@/components/sections/Mission";
import { Artistry } from "@/components/sections/Artistry";
import { Growth } from "@/components/sections/growth/Growth";
import { Integration } from "@/components/sections/integration/Integration";
import { Empower } from "@/components/sections/empower/Empower";
import { Pricing } from "@/components/sections/Pricing";
import { FeatureDetails } from "@/components/sections/FeatureDetails";
import { FinalCta } from "@/components/sections/FinalCta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AppShowcase />
        <Mission />
        <Artistry />
        <FeatureDetails />
        <Growth />
        <Integration />
        <Empower />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
