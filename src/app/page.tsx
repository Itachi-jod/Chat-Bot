import MatrixRain from "@/components/matrix-rain";
import Terminal from "@/components/terminal";

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <MatrixRain />
      <div className="absolute inset-0 z-10">
        <Terminal />
      </div>
    </main>
  );
}
