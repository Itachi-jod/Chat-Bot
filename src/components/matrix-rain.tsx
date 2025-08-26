"use client";

import { useRef, useEffect, useCallback } from 'react';

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number, columns: number, drops: number[]) => {
    ctx.fillStyle = 'rgba(20, 20, 20, 0.05)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = '#39FF14'; // Neon Green
    ctx.font = '15px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = String.fromCharCode(0x30A0 + Math.random() * 96);
      ctx.fillText(text, i * 15, drops[i] * 15);

      if (drops[i] * 15 > ctx.canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    let animationFrameId: number;
    let drops: number[] = [];
    let columns = 0;

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / 15);
      drops = [];
      for (let x = 0; x < columns; x++) {
        drops[x] = 1;
      }
    };

    setup();
    window.addEventListener('resize', setup);
    
    let frameCount = 0;
    const render = () => {
      frameCount++;
      draw(context, frameCount, columns, drops);
      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', setup);
    };
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
};

export default MatrixRain;
