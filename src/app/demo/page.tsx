import { Navbar } from "@/components/Navbar";
import { MultimodalDemo } from "@/components/MultimodalDemo";

export default function DemoPage() {
  return (
    <div className="overflow-x-hidden bg-black">
      <Navbar />
      <MultimodalDemo />
    </div>
  );
}
