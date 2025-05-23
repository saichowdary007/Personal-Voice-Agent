"use client"

import React, { useRef, useEffect } from "react";

export function VoiceVisualizer({ stream }: { stream: MediaStream | null }) {
  if (!stream || !(stream instanceof MediaStream)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Waiting for microphone access...
      </div>
    );
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);

    let frameId: number;
    const draw = () => {
      const { width, height } = canvasRef.current!;
      ctx.clearRect(0, 0, width, height);
      analyser.getByteFrequencyData(data);

      const radius = Math.min(width, height) / 4;
      const cx = width / 2, cy = height / 2;

      // radial line
      ctx.beginPath();
      data.forEach((v, i) => {
        const angle = (i / data.length) * Math.PI * 2;
        const len = radius + (v / 255) * radius * 0.8;
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      });
      ctx.closePath();
      ctx.strokeStyle = "#4F46E5";
      ctx.lineWidth = 2;
      ctx.stroke();

      // orbiting dots
      data.slice(0, 12).forEach((v, i) => {
        const angle = performance.now() / 500 + (i / 12) * Math.PI * 2;
        const dotR = 4 + (v / 255) * 6;
        const x = cx + Math.cos(angle) * (radius + 20);
        const y = cy + Math.sin(angle) * (radius + 20);
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = "#10B981";
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(frameId);
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={300}
      height={300}
    />
  );
}