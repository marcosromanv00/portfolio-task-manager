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
        const radius = (body as any).circleRadius || 20;
        const taskData = body.plugin.data;
        const urgency = taskData ? calculateUrgency(taskData) : 0;

        // Calculate Heartbeat
        let displayRadius = radius;
        if (urgency > 100) {
          // Strong heartbeat for critical
          const pulse = (Math.sin(Date.now() / 150) + 1) * 0.08;
          displayRadius = radius * (1 + pulse);
        } else if (urgency > 50) {
          // Gentle heartbeat for high
          const pulse = (Math.sin(Date.now() / 300) + 1) * 0.04;
          displayRadius = radius * (1 + pulse);
        }

        // Draw Bubble
        ctx.beginPath();
        ctx.arc(x, y, displayRadius, 0, 2 * Math.PI);
        const color = taskData?.bubble?.color || "rgba(100, 149, 237, 0.5)";
        ctx.fillStyle = color;
        ctx.shadowBlur = urgency > 100 ? 20 : 10;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Draw Text
        if (taskData?.title) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Simple truncation
          const text =
            taskData.title.length > 15
              ? taskData.title.substring(0, 15) + "..."
              : taskData.title;
          ctx.fillText(text, x, y);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [engineRef, tasks]); // Removed .current to fix lint error

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[500px] relative overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-2xl"
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full block"
      />
      <div className="absolute top-4 left-4 text-white/50 text-sm pointer-events-none select-none">
        Bubble View Prototype
      </div>
    </div>
  );
}
