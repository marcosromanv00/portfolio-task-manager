"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useBubblePhysics } from "@/hooks/useBubblePhysics";
import Matter from "matter-js";
import { calculateUrgency } from "@/lib/urgency";

interface BubbleCanvasProps {
  onTaskClick?: (taskId: string) => void;
}

export default function BubbleCanvas({ onTaskClick }: BubbleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tasks = useTaskStore((state) => state.tasks);
  const moveTask = useTaskStore((state) => state.moveTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);

  const handleDragEnd = useCallback(
    (taskId: string, position: { x: number; y: number }) => {
      moveTask(taskId, position);

      if (containerRef.current) {
        // Simple Drop Zone Logic: Top Header (h-24 = 96px)
        const headerHeight = 100; // tolerance
        const width = containerRef.current.clientWidth;

        if (position.y < headerHeight) {
          if (position.x < width / 4) {
            updateTaskStatus(taskId, "todo");
          } else if (position.x < width / 2) {
            updateTaskStatus(taskId, "in-progress");
          } else if (position.x < (width * 3) / 4) {
            updateTaskStatus(taskId, "done");
          } else {
            updateTaskStatus(taskId, "archived");
          }
        }
      }
    },
    [moveTask, updateTaskStatus],
  );

  const { engineRef, syncTasks } = useBubblePhysics(containerRef, {
    onDragEnd: handleDragEnd,
    onTaskClick,
  });

  // Sync tasks when they change
  useEffect(() => {
    syncTasks(tasks);
  }, [tasks, syncTasks]);

  // Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastLogTime = 0;

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const engine = engineRef.current;

      if (!canvas || !ctx || !engine) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Resize canvas to container
      const container = containerRef.current;
      if (container) {
        if (
          canvas.width !== container.clientWidth ||
          canvas.height !== container.clientHeight
        ) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Bodies
      const bodies = Matter.Composite.allBodies(engine.world);

      // Debug log every 2 seconds
      const now = Date.now();
      if (now - lastLogTime > 2000) {
        console.log("Rendering frame. Bodies count:", bodies.length);
        lastLogTime = now;
      }

      bodies.forEach((body) => {
        // Safety check for body label
        if (!body.label || body.label.startsWith("Wall")) {
          return;
        }

        const { x, y } = body.position;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const radius = (body as any).circleRadius || 60;
        const taskData = body.plugin.data;
        const urgency = taskData ? calculateUrgency(taskData) : 0;
        const urgencyFactor = Math.min(urgency / 150, 1);

        // 1. Calculate Heartbeat - proportional to urgency
        // Faster and stronger as urgency increases
        const pulseFrequency = 200 - urgencyFactor * 100; // 200ms to 100ms
        const pulseAmplitude = 0.005 + urgencyFactor * 0.06; // 0.5% to 6.5%
        const pulse =
          (Math.sin(Date.now() / pulseFrequency) + 1) * pulseAmplitude;
        const displayRadius = radius * (1 + pulse);

        // 2. Urgency Color (Blue 240 -> Purple -> Red 360/0) - SOLID COLORS
        // Saturation 65% (not too neon) and Lightness 45% (not too pastel)
        const hue = 240 + urgencyFactor * 120;
        const bubbleColor = `hsl(${hue % 360}, 65%, 45%)`;

        // 3. Category Distinction (Border color/width)
        let strokeStyle = "rgba(255, 255, 255, 0.4)";
        let lineWidth = 2;

        if (taskData?.category) {
          switch (taskData.category) {
            case "Activos (Portafolio Plantillas)":
              strokeStyle = "#10b981"; // Emerald
              lineWidth = 2;
              break;
            case "Trabajo Estable":
              strokeStyle = "#f59e0b"; // Amber
              lineWidth = 2;
              break;
            case "MCPs/Automatización":
              strokeStyle = "#06b6d4"; // Cyan
              lineWidth = 2;
              break;
            case "Tesis":
              strokeStyle = "#d946ef"; // Fuchsia
              lineWidth = 2;
              break;
            case "Admin/Personal":
              strokeStyle = "#f97316"; // Orange
              lineWidth = 2;
              break;
          }
        }

        // Draw Bubble
        ctx.beginPath();
        ctx.arc(x, y, displayRadius, 0, 2 * Math.PI);
        ctx.fillStyle = bubbleColor;
        // Shadow/Glow removed as requested
        ctx.fill();

        // Draw Inset Border (4px inside the circumference)
        ctx.beginPath();
        // Drawing the stroke at radius - 4px to pull it inside
        ctx.arc(x, y, Math.max(0, displayRadius - 4), 0, 2 * Math.PI);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();

        // Draw Text (Multi-line)
        if (taskData?.title) {
          ctx.fillStyle = "#fff";
          const fontSize = Math.max(12, Math.floor(radius / 4));
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const words = taskData.title.split(" ");
          const lines: string[] = [];
          let currentLine = words[0];
          const maxWidth = radius * 1.5;

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
              currentLine += " " + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);

          // Truncate if too many lines
          const maxLines = Math.floor(radius / (fontSize * 0.6));
          const finalLines = lines.slice(0, maxLines);
          if (lines.length > maxLines) {
            finalLines[finalLines.length - 1] += "...";
          }

          const lineHeight = fontSize * 1.2;
          const totalHeight = finalLines.length * lineHeight;
          const startY = y - totalHeight / 2 + lineHeight / 2;

          finalLines.forEach((line, index) => {
            ctx.fillText(line, x, startY + index * lineHeight);
          });
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engineRef, tasks]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] relative overflow-hidden bg-slate-950 border border-white/5 rounded-2xl shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block"
      />
      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none select-none">
        <h2 className="text-white/80 font-bold tracking-wider text-lg uppercase">
          Bubble Workspace
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-white/40 text-xs font-medium">
            Live Physics Engine
          </span>
        </div>
      </div>
    </div>
  );
}
