"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useBubblePhysics } from "@/hooks/useBubblePhysics";
import Matter from "matter-js";

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
          if (position.x < width / 3) {
            updateTaskStatus(taskId, "todo");
          } else if (position.x < (width * 2) / 3) {
            updateTaskStatus(taskId, "in-progress");
          } else {
            updateTaskStatus(taskId, "done");
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

    const render = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const engine = engineRef.current;

      if (!canvas || !ctx || !engine) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Resize canvas to container
      if (
        canvas.width !== containerRef.current!.clientWidth ||
        canvas.height !== containerRef.current!.clientHeight
      ) {
        canvas.width = containerRef.current!.clientWidth;
        canvas.height = containerRef.current!.clientHeight;
      }

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Bodies
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body) => {
        if (body.label.startsWith("Wall")) {
          return;
        }

        const { x, y } = body.position;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const radius = (body as any).circleRadius || 20;
        const taskData = body.plugin.data;

        // Draw Bubble
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        const color = taskData?.bubble?.color || "rgba(100, 149, 237, 0.5)";
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
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
          ctx.font = "12px sans-serif";
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
  }, [engineRef]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-900 border border-white/10 rounded-xl shadow-2xl"
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
