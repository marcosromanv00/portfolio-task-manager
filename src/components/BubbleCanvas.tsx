"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useUIStore } from "@/store/useUIStore";
import { useBubblePhysics, PressurePoint } from "@/hooks/useBubblePhysics";
import Matter from "matter-js";
import { calculateUrgency } from "@/lib/urgency";
import { TaskStatus } from "@/lib/types";

interface BubbleCanvasProps {
  onTaskClick?: (taskId: string) => void;
}

// Status items for the sidebar drawn on canvas
const STATUS_ITEMS: {
  status: TaskStatus;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    status: "todo",
    label: "To Do",
    color: "#60a5fa",
    bgColor: "rgba(59, 130, 246, 0.2)",
  },
  {
    status: "in-progress",
    label: "In Progress",
    color: "#fbbf24",
    bgColor: "rgba(245, 158, 11, 0.2)",
  },
  {
    status: "done",
    label: "Done",
    color: "#34d399",
    bgColor: "rgba(16, 185, 129, 0.2)",
  },
  {
    status: "backlog",
    label: "Backlog",
    color: "#94a3b8",
    bgColor: "rgba(100, 116, 139, 0.2)",
  },
  {
    status: "discarded",
    label: "Discarded",
    color: "#f87171",
    bgColor: "rgba(239, 68, 68, 0.2)",
  },
  {
    status: "archived",
    label: "Archived",
    color: "#fb7185",
    bgColor: "rgba(244, 63, 94, 0.2)",
  },
];

const SIDEBAR_WIDTH = 80;
const SIDEBAR_PADDING = 16;

// Type for pop animation
interface PopAnimation {
  x: number;
  y: number;
  color: string;
  label: string;
  startTime: number;
  duration: number;
}

export default function BubbleCanvas({ onTaskClick }: BubbleCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tasks = useTaskStore((state) => state.tasks);
  const moveTask = useTaskStore((state) => state.moveTask);
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);

  // Animation state for pop effects
  const [popAnimations, setPopAnimations] = useState<PopAnimation[]>([]);

  // UI Store for drag state
  const { isDragging, draggedTaskId, setDragging, setMousePosition } =
    useUIStore();

  // Track mouse position during drag (within canvas coordinates)
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Refs for physics functions (to avoid circular dependency)
  const setSidebarBarrierEnabledRef = useRef<(enabled: boolean) => void>(
    () => {},
  );
  const moveBubbleToStatusAreaRef = useRef<(taskId: string) => void>(() => {});

  // Calculate which status zone the position is in
  const getStatusAtPosition = useCallback(
    (
      x: number,
      y: number,
      canvasWidth: number,
      canvasHeight: number,
    ): TaskStatus | null => {
      const isMobile = window.innerWidth < 768;
      const sidebarSize = 100; // Total area occupied by sidebar/topbar

      if (isMobile) {
        // Check if in top bar area
        if (y > sidebarSize) return null;

        // Calculate item width based on canvas width
        const itemCount = STATUS_ITEMS.length;
        const totalWidth = canvasWidth - SIDEBAR_PADDING * 2;
        const itemWidth = totalWidth / itemCount;

        // Find which status
        const relativeX = x - SIDEBAR_PADDING;
        const index = Math.floor(relativeX / itemWidth);

        if (index >= 0 && index < itemCount) {
          return STATUS_ITEMS[index].status;
        }
      } else {
        // Desktop - Check if in sidebar area (right side of canvas)
        const sidebarX = canvasWidth - SIDEBAR_WIDTH - SIDEBAR_PADDING;
        if (x < sidebarX) return null;

        // Calculate item height based on canvas height
        const itemCount = STATUS_ITEMS.length;
        const totalHeight = canvasHeight - SIDEBAR_PADDING * 2;
        const itemHeight = totalHeight / itemCount;

        // Find which status
        const relativeY = y - SIDEBAR_PADDING;
        const index = Math.floor(relativeY / itemHeight);

        if (index >= 0 && index < itemCount) {
          return STATUS_ITEMS[index].status;
        }
      }
      return null;
    },
    [],
  );

  // Handle drag start - notify UI store and disable sidebar barrier
  const handleDragStart = useCallback(
    (taskId: string) => {
      setDragging(true, taskId);
      setSidebarBarrierEnabledRef.current(false);
    },
    [setDragging],
  );

  const handleDragEnd = useCallback(
    (taskId: string, position: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      const isMobile = window.innerWidth < 768;

      // Re-enable sidebar barrier
      setSidebarBarrierEnabledRef.current(true);

      if (!canvas) {
        setDragging(false, null);
        setMousePosition(null);
        moveTask(taskId, position);
        return;
      }

      // Get current mouse position in canvas coordinates
      const currentMousePos = mousePosRef.current;
      if (currentMousePos) {
        const status = getStatusAtPosition(
          currentMousePos.x,
          currentMousePos.y,
          canvas.width,
          canvas.height,
        );

        if (status) {
          // Found a status to change to!
          updateTaskStatus(taskId, status);

          // Move bubble to sidebar area with pop effect
          moveBubbleToStatusAreaRef.current(taskId);

          // Get status item for color
          const statusItem = STATUS_ITEMS.find((s) => s.status === status);

          // Add pop animation
          let popX, popY;
          if (isMobile) {
            popX = canvas.width / 2;
            popY = 150;
          } else {
            popX = canvas.width - SIDEBAR_WIDTH - SIDEBAR_PADDING - 100;
            popY = canvas.height / 2;
          }

          setPopAnimations((prev) => [
            ...prev,
            {
              x: popX,
              y: popY,
              color: statusItem?.color || "#fff",
              label: statusItem?.label || status,
              startTime: Date.now(),
              duration: 1000,
            },
          ]);

          setDragging(false, null);
          setMousePosition(null);
          return;
        }
      }

      // Also check body position as fallback
      const statusFromBody = getStatusAtPosition(
        position.x,
        position.y,
        canvas.width,
        canvas.height,
      );

      if (statusFromBody) {
        updateTaskStatus(taskId, statusFromBody);
        moveBubbleToStatusAreaRef.current(taskId);

        const statusItem = STATUS_ITEMS.find(
          (s) => s.status === statusFromBody,
        );

        let popX, popY;
        if (isMobile) {
          popX = canvas.width / 2;
          popY = 150;
        } else {
          popX = canvas.width - SIDEBAR_WIDTH - SIDEBAR_PADDING - 100;
          popY = canvas.height / 2;
        }

        setPopAnimations((prev) => [
          ...prev,
          {
            x: popX,
            y: popY,
            color: statusItem?.color || "#fff",
            label: statusItem?.label || statusFromBody,
            startTime: Date.now(),
            duration: 1000,
          },
        ]);

        setDragging(false, null);
        setMousePosition(null);
        return;
      }

      // Clear drag state and update position
      setDragging(false, null);
      setMousePosition(null);
      moveTask(taskId, position);
    },
    [
      moveTask,
      updateTaskStatus,
      setDragging,
      setMousePosition,
      getStatusAtPosition,
    ],
  );

  const {
    engineRef,
    syncTasks,
    setSidebarBarrierEnabled,
    moveBubbleToStatusArea,
  } = useBubblePhysics(containerRef, {
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onTaskClick,
  });

  useEffect(() => {
    setSidebarBarrierEnabledRef.current = setSidebarBarrierEnabled;
    moveBubbleToStatusAreaRef.current = moveBubbleToStatusArea;
  }, [setSidebarBarrierEnabled, moveBubbleToStatusArea]);

  // Track mouse position during drag
  useEffect(() => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mousePosRef.current = { x, y };
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      mousePosRef.current = null;
    };
  }, [isDragging, setMousePosition]);

  // Sync tasks when they change
  useEffect(() => {
    syncTasks(tasks);
  }, [tasks, syncTasks]);

  // Clean up old pop animations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPopAnimations((prev) =>
        prev.filter((anim) => now - anim.startTime < anim.duration),
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

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

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Clear
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      // ========== DRAW POP ANIMATIONS ==========
      const now = Date.now();
      popAnimations.forEach((anim) => {
        const elapsed = now - anim.startTime;
        const progress = elapsed / anim.duration;

        if (progress < 1) {
          // Ring expanding outward
          const ringRadius = 30 + progress * 80;
          const ringAlpha = 1 - progress;

          ctx.beginPath();
          ctx.arc(anim.x, anim.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = anim.color;
          ctx.lineWidth = 4 * (1 - progress);
          ctx.globalAlpha = ringAlpha;
          ctx.stroke();

          // Second ring
          const ring2Radius = 20 + progress * 60;
          ctx.beginPath();
          ctx.arc(anim.x, anim.y, ring2Radius, 0, Math.PI * 2);
          ctx.lineWidth = 2 * (1 - progress);
          ctx.stroke();

          // Text floating up
          if (progress < 0.7) {
            const textAlpha = 1 - progress / 0.7;
            const textY = anim.y - 20 - progress * 50;

            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = anim.color;
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`→ ${anim.label}`, anim.x, textY);
          }

          ctx.globalAlpha = 1;
        }
      });

      // ========== DRAW BUBBLES ==========
      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body) => {
        if (!body.label || body.label.startsWith("Wall")) {
          return;
        }

        const { x, y } = body.position;
        let radius =
          (body as Matter.Body & { circleRadius?: number }).circleRadius || 60;

        // Dynamic scaling when dragging toward sidebar
        if (isDragging && body.label === `task-${draggedTaskId}`) {
          const sidebarX = canvasWidth - SIDEBAR_WIDTH - SIDEBAR_PADDING;
          // Scale based on distance to sidebar.
          // Start scaling from 300px away from the sidebar edge.
          const scaleZone = 300;
          const distToSidebar = sidebarX - x;

          if (distToSidebar < scaleZone) {
            // progress: 0 (at scaleZone distance) to 1 (at sidebar edge)
            const progress = Math.max(
              0,
              Math.min(1, 1 - distToSidebar / scaleZone),
            );
            // scale from 1.0 down to 0.35 (significantly smaller)
            const scale = 1 - progress * 0.65;
            radius *= scale;
          }
        }

        const taskData = body.plugin.data;
        const urgency = taskData ? calculateUrgency(taskData) : 0;
        const urgencyFactor = Math.min(urgency / 150, 1);

        // 1. Calculate Heartbeat
        const pulseFrequency = 200 - urgencyFactor * 100;
        // Reduced heartbeat on mobile
        const pulseAmplitudeBase = isMobile ? 0.003 : 0.005;
        const pulseAmplitudeGrowth = isMobile ? 0.04 : 0.06;
        const pulseAmplitude =
          pulseAmplitudeBase + urgencyFactor * pulseAmplitudeGrowth;
        const pulse =
          (Math.sin(Date.now() / pulseFrequency) + 1) * pulseAmplitude;
        const displayRadius = radius * (1 + pulse);

        // 2. Urgency Color
        const hue = 240 + urgencyFactor * 120;
        const bubbleColor = `hsl(${hue % 360}, 65%, 45%)`;

        // 3. Category Distinction
        let strokeStyle = "rgba(255, 255, 255, 0.4)";
        const lineWidth = 2;

        if (taskData?.category) {
          switch (taskData.category) {
            case "Activos (Portafolio Plantillas)":
              strokeStyle = "#10b981";
              break;
            case "Trabajo Estable":
              strokeStyle = "#f59e0b";
              break;
            case "MCPs/Automatización":
              strokeStyle = "#06b6d4";
              break;
            case "Tesis":
              strokeStyle = "#d946ef";
              break;
            case "Admin/Personal":
              strokeStyle = "#f97316";
              break;
          }
        }

        // 4. Squishy Organic Deformation
        const pressures = body.plugin.pressures || [];
        const segments = 32;
        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < segments; i++) {
          const pointAngle = (i / segments) * Math.PI * 2;
          let offset = 0;

          pressures.forEach((p: PressurePoint) => {
            let diff = Math.abs(pointAngle - p.angle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            const strength = Math.exp(-Math.pow(diff / 0.35, 2));
            offset -= p.intensity * radius * 0.25 * strength;
          });

          offset = Math.max(offset, -radius * 0.15);
          const r = displayRadius + offset;
          points.push({
            x: x + Math.cos(pointAngle) * r,
            y: y + Math.sin(pointAngle) * r,
          });
        }

        // Draw Organic Bubble Shape
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length; i++) {
          const nextIdx = (i + 1) % points.length;
          const xc = (points[i].x + points[nextIdx].x) / 2;
          const yc = (points[i].y + points[nextIdx].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        ctx.closePath();
        ctx.fillStyle = bubbleColor;
        ctx.fill();

        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();

        // Draw Text
        if (taskData?.title && radius > 20) {
          const textAlpha = Math.min(1, (radius - 20) / 30);
          ctx.globalAlpha = textAlpha;
          ctx.fillStyle = "#fff";
          const fontSize = Math.max(10, Math.floor(radius / 4));
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
          ctx.globalAlpha = 1;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    engineRef,
    tasks,
    isDragging,
    draggedTaskId,
    getStatusAtPosition,
    popAnimations,
  ]);

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
