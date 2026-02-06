import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Task } from "@/lib/types";

export const useBubblePhysics = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: {
    onDragEnd?: (taskId: string, position: { x: number; y: number }) => void;
    onTaskClick?: (taskId: string) => void;
  },
) => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Keep track of task IDs to body IDs for syncing
  const bodiesMap = useRef<Map<string, Matter.Body>>(new Map());

  const { onDragEnd, onTaskClick } = options || {};

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Matter.js Engine
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0; // No gravity, floating bubbles
    engine.world.gravity.x = 0;

    engineRef.current = engine;

    // 2. Setup Render (debug renderer for now, or use standard)
    // We will use standard Matter.Render for MVP Phase 1 to ensure it works, then switch to custom if needed.
    // Actually, user wants "Bubbles with text", standard renderer doesn't support text well.
    // So we'll use a custom render loop, but let's setup the engine first.

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Walls
    const wallThickness = 60;
    const walls = [
      Matter.Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width,
        wallThickness,
        { isStatic: true, label: "WallTop" },
      ),
      Matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width,
        wallThickness,
        { isStatic: true, label: "WallBottom" },
      ),
      Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        { isStatic: true, label: "WallRight" },
      ),
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height,
        { isStatic: true, label: "WallLeft" },
      ),
    ];
    Matter.Composite.add(engine.world, walls);

    // 3. Mouse Interaction
    const mouse = Matter.Mouse.create(containerRef.current);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.Composite.add(engine.world, mouseConstraint);

    // Drag events
    if (onDragEnd) {
      Matter.Events.on(mouseConstraint, "enddrag", (event: any) => {
        const body = event.body;
        if (body && body.label && body.label.startsWith("task-")) {
          const taskId = body.label.replace("task-", "");
          onDragEnd(taskId, body.position);
        }
      });
    }

    // Click Detection
    if (onTaskClick) {
      let startPoint = { x: 0, y: 0 };

      Matter.Events.on(mouseConstraint, "mousedown", (event: any) => {
        startPoint = { ...event.mouse.position };
      });

      Matter.Events.on(mouseConstraint, "mouseup", (event: any) => {
        const endPoint = event.mouse.position;
        const dist = Math.hypot(
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y,
        );

        if (dist < 5) {
          // Threshold for click
          // We need to find if a body was clicked.
          // MouseConstraint doesn't always have body on mouseup if we didn't drag it?
          // Actually Query.point is safer.
          const bodies = Matter.Composite.allBodies(engine.world);
          const clickedBodies = Matter.Query.point(bodies, endPoint);

          for (const body of clickedBodies) {
            if (body.label && body.label.startsWith("task-")) {
              const taskId = body.label.replace("task-", "");
              onTaskClick(taskId);
              break; // Handle only top one
            }
          }
        }
      });
    }

    // 4. Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // Mouse scroll fix
    // mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
    // mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);

    return () => {
      Matter.Render.stop(renderRef.current!);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    };
  }, [containerRef, onDragEnd, onTaskClick]);

  // Sync tasks to bodies
  const syncTasks = (tasks: Task[]) => {
    if (!engineRef.current) return;

    const world = engineRef.current.world;
    const currentIds = new Set(tasks.map((t) => t.id));

    // Remove deleted tasks
    bodiesMap.current.forEach((body, id) => {
      if (!currentIds.has(id)) {
        Matter.Composite.remove(world, body);
        bodiesMap.current.delete(id);
      }
    });

    // Add/Update tasks
    tasks.forEach((task) => {
      if (!bodiesMap.current.has(task.id)) {
        // Create new body
        const radius = task.bubble.radius || 40 + Math.random() * 20; // Fallback
        const x =
          task.bubble.x ||
          Math.random() * (containerRef.current?.clientWidth || 500);
        const y =
          task.bubble.y ||
          Math.random() * (containerRef.current?.clientHeight || 500);

        const body = Matter.Bodies.circle(x, y, radius, {
          frictionAir: 0.02,
          restitution: 0.8,
          label: `task-${task.id}`,
          plugin: { data: task }, // Store task data in body
        });

        Matter.Composite.add(world, body);
        bodiesMap.current.set(task.id, body);
      } else {
        // Update existing body if needed (e.g. radius change)
        // Complex syncing can happen here
      }
    });
  };

  return { engineRef, runnerRef, syncTasks, bodiesMap };
};
