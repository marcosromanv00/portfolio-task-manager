import { useEffect, useRef, useCallback } from "react";
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

  const runnerRef = useRef<Matter.Runner | null>(null);

  // Keep track of task IDs to body IDs for syncing
  const bodiesMap = useRef<Map<string, Matter.Body>>(new Map());

  // Use refs for callbacks to prevent engine recreation when they change
  const onDragEndRef = useRef(options?.onDragEnd);
  const onTaskClickRef = useRef(options?.onTaskClick);

  useEffect(() => {
    onDragEndRef.current = options?.onDragEnd;
    onTaskClickRef.current = options?.onTaskClick;
  }, [options?.onDragEnd, options?.onTaskClick]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Matter.js Engine
    const engine = Matter.Engine.create();
    engine.world.gravity.y = 0; // No gravity, floating bubbles
    engine.world.gravity.x = 0;

    engineRef.current = engine;

    // 2. Setup Render
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

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
    Matter.Events.on(
      mouseConstraint,
      "enddrag",
      (e: Matter.IEvent<Matter.MouseConstraint>) => {
        const event = e as Matter.IEvent<Matter.MouseConstraint> & {
          body: Matter.Body;
        };
        const body = event.body;
        if (body && body.label && body.label.startsWith("task-")) {
          const taskId = body.label.replace("task-", "");
          if (onDragEndRef.current) {
            onDragEndRef.current(taskId, body.position);
          }
        }
      },
    );

    // Click Detection
    let startPoint = { x: 0, y: 0 };

    Matter.Events.on(
      mouseConstraint,
      "mousedown",
      (e: Matter.IEvent<Matter.MouseConstraint>) => {
        const event = e as Matter.IEvent<Matter.MouseConstraint> & {
          mouse: Matter.Mouse;
        };
        startPoint = { ...event.mouse.position };
      },
    );

    Matter.Events.on(
      mouseConstraint,
      "mouseup",
      (e: Matter.IEvent<Matter.MouseConstraint>) => {
        const event = e as Matter.IEvent<Matter.MouseConstraint> & {
          mouse: Matter.Mouse;
        };
        const endPoint = event.mouse.position;
        const dist = Math.hypot(
          endPoint.x - startPoint.x,
          endPoint.y - startPoint.y,
        );

        if (dist < 5) {
          const bodies = Matter.Composite.allBodies(engine.world);
          const clickedBodies = Matter.Query.point(bodies, endPoint);

          for (const body of clickedBodies) {
            if (body.label && body.label.startsWith("task-")) {
              const taskId = body.label.replace("task-", "");
              if (onTaskClickRef.current) {
                onTaskClickRef.current(taskId);
              }
              break;
            }
          }
        }
      },
    );

    // 4. Constant movement and central gravity
    Matter.Events.on(engine, "beforeUpdate", () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      bodies.forEach((body) => {
        if (body.isStatic) return;

        // 4a. Gentle pull toward center
        const centerX = (containerRef.current?.clientWidth || 800) / 2;
        const centerY = (containerRef.current?.clientHeight || 600) / 2;
        const forceX = (centerX - body.position.x) * 0.000001;
        const forceY = (centerY - body.position.y) * 0.000001;

        // 4b. Tiny random drift to keep them "alive"
        const driftX = (Math.random() - 0.5) * 0.00005;
        const driftY = (Math.random() - 0.5) * 0.00005;

        Matter.Body.applyForce(body, body.position, {
          x: forceX + driftX,
          y: forceY + driftY,
        });
      });
    });

    // 5. Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    const bodiesMapRef = bodiesMap.current;

    return () => {
      Matter.Events.off(engine, "beforeUpdate", () => {});
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      engineRef.current = null;
      bodiesMapRef.clear();
    };
  }, [containerRef]);

  // Sync tasks to bodies
  const syncTasks = useCallback(
    (tasks: Task[]) => {
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
          const radius = task.bubble.radius || 40 + Math.random() * 20;
          const x =
            task.bubble.x ||
            Math.random() * (containerRef.current?.clientWidth || 500);
          const y =
            task.bubble.y ||
            Math.random() * (containerRef.current?.clientHeight || 500);

          const body = Matter.Bodies.circle(x, y, radius, {
            frictionAir: 0.005, // Much lower friction for inertia
            restitution: 0.9, // More "bouncy"
            friction: 0.1,
            label: `task-${task.id}`,
            plugin: { data: task },
          });

          // Give it a tiny initial kick
          Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
          });

          Matter.Composite.add(world, body);
          bodiesMap.current.set(task.id, body);
        } else {
          const body = bodiesMap.current.get(task.id);
          if (body) body.plugin.data = task;
        }
      });
    },
    [containerRef],
  );

  return { engineRef, runnerRef, syncTasks, bodiesMap };
};
