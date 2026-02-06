import { Navbar } from "@/components/Navbar";
import { Pricing } from "@/components/Pricingdemo";
import { Footer } from "@/components/Footer";

export default function PricingPage() {
  return (
    <div className="overflow-x-hidden bg-black">
      <Navbar />
      <Pricing />
      <Footer />
    </div>
  );
}
