import { useEffect, useRef, useCallback } from "react";
import Matter from "matter-js";
import { Task } from "@/lib/types";
import { calculateUrgency } from "@/lib/urgency";

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
  const wallsRef = useRef<Matter.Body[]>([]);

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

    // Walls - Using much thicker walls to prevent fast objects from tunneling through
    const wallThickness = 500;
    const walls = [
      Matter.Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        { isStatic: true, label: "WallTop" },
      ),
      Matter.Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        { isStatic: true, label: "WallBottom" },
      ),
      Matter.Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        { isStatic: true, label: "WallRight" },
      ),
      Matter.Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        { isStatic: true, label: "WallLeft" },
      ),
    ];
    Matter.Composite.add(engine.world, walls);
    wallsRef.current = walls;

    // 2.5 Dynamic Resize Handler
    const updateWalls = () => {
      if (!containerRef.current || !engineRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      const wallThickness = 500;

      const currentWalls = wallsRef.current;
      if (currentWalls.length === 4) {
        // Top
        Matter.Body.setPosition(currentWalls[0], {
          x: newWidth / 2,
          y: -wallThickness / 2,
        });
        // Bottom
        Matter.Body.setPosition(currentWalls[1], {
          x: newWidth / 2,
          y: newHeight + wallThickness / 2,
        });
        // Right
        Matter.Body.setPosition(currentWalls[2], {
          x: newWidth + wallThickness / 2,
          y: newHeight / 2,
        });
        // Left
        Matter.Body.setPosition(currentWalls[3], {
          x: -wallThickness / 2,
          y: newHeight / 2,
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateWalls();
    });

    resizeObserver.observe(containerRef.current);

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

    // 4. Constant movement, central gravity and safety checks
    Matter.Events.on(engine, "beforeUpdate", () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      const curWidth = containerRef.current?.clientWidth || 800;
      const curHeight = containerRef.current?.clientHeight || 600;

      bodies.forEach((body) => {
        if (body.isStatic) return;

        // 4a. Limit velocity to prevent tunneling (speed capping)
        const maxSpeed = 15;
        if (body.speed > maxSpeed) {
          const ratio = maxSpeed / body.speed;
          Matter.Body.setVelocity(body, {
            x: body.velocity.x * ratio,
            y: body.velocity.y * ratio,
          });
        }

        // 4b. Out-of-bounds safety check (if it escapes, bring it back)
        const buffer = 100;
        if (
          body.position.x < -buffer ||
          body.position.x > curWidth + buffer ||
          body.position.y < -buffer ||
          body.position.y > curHeight + buffer
        ) {
          Matter.Body.setPosition(body, {
            x: curWidth / 2,
            y: curHeight / 2,
          });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
        }

        // 4c. Gentle pull toward center
        const centerX = curWidth / 2;
        const centerY = curHeight / 2;
        const forceX = (centerX - body.position.x) * 0.000001;
        const forceY = (centerY - body.position.y) * 0.000001;

        // 4d. Tiny random drift to keep them "alive"
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
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  // Sync tasks to bodies
  const syncTasks = useCallback(
    (tasks: Task[]) => {
      if (!engineRef.current) return;

      const world = engineRef.current.world;
      const activeTasks = tasks.filter((t) => t.status !== "archived");
      const currentIds = new Set(activeTasks.map((t) => t.id));

      // Remove deleted tasks
      bodiesMap.current.forEach((body, id) => {
        if (!currentIds.has(id)) {
          Matter.Composite.remove(world, body);
          bodiesMap.current.delete(id);
        }
      });

      // Add/Update tasks
      activeTasks.forEach((task) => {
        const urgency = calculateUrgency(task);
        // Base radius 35, grows with urgency (up to ~85 for max urgency)
        const radius = 35 + (urgency / 150) * 50;

        if (!bodiesMap.current.has(task.id)) {
          // Create new body
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
