import MatrixRain from "@/components/matrix-rain";
import Terminal from "@/components/terminal";
import { Suspense } from "react";

function HomePage() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <MatrixRain />
      <div className="absolute inset-0 z-10">
        <Terminal />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  )
}
