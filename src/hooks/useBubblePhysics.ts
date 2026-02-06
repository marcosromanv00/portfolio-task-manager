import { useEffect, useRef, useCallback } from "react";
import Matter from "matter-js";
import { Task } from "@/lib/types";
import { calculateUrgency } from "@/lib/urgency";

export interface PressurePoint {
  angle: number;
  intensity: number;
  targetIntensity: number;
  active: boolean;
}

export const useBubblePhysics = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: {
    onDragStart?: (taskId: string) => void;
    onDragEnd?: (
      taskId: string,
      position: { x: number; y: number },
      mousePosition: { x: number; y: number },
    ) => void;
    onTaskClick?: (taskId: string) => void;
  },
) => {
  const engineRef = useRef<Matter.Engine | null>(null);

  const runnerRef = useRef<Matter.Runner | null>(null);

  // Keep track of task IDs to body IDs for syncing
  const bodiesMap = useRef<Map<string, Matter.Body>>(new Map());
  const wallsRef = useRef<Matter.Body[]>([]);

  // Use refs for callbacks to prevent engine recreation when they change
  const onDragStartRef = useRef(options?.onDragStart);
  const onDragEndRef = useRef(options?.onDragEnd);
  const onTaskClickRef = useRef(options?.onTaskClick);

  useEffect(() => {
    onDragStartRef.current = options?.onDragStart;
    onDragEndRef.current = options?.onDragEnd;
    onTaskClickRef.current = options?.onTaskClick;
  }, [options?.onDragStart, options?.onDragEnd, options?.onTaskClick]);

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
    const sidebarWidth = 100; // Space reserved for sidebar

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
      // Sidebar barrier wall - blocks entry to sidebar area when not dragging
      Matter.Bodies.rectangle(
        width - sidebarWidth - 10,
        height / 2,
        20,
        height,
        {
          isStatic: true,
          label: "WallSidebar",
          collisionFilter: { category: 0x0002 },
        },
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
      const sidebarWidth = 100;

      const currentWalls = wallsRef.current;
      if (currentWalls.length >= 4) {
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
        // Sidebar barrier
        if (currentWalls.length >= 5) {
          Matter.Body.setPosition(currentWalls[4], {
            x: newWidth - sidebarWidth - 10,
            y: newHeight / 2,
          });
        }
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

    // Drag events - startdrag
    Matter.Events.on(
      mouseConstraint,
      "startdrag",
      (e: Matter.IEvent<Matter.MouseConstraint>) => {
        const event = e as Matter.IEvent<Matter.MouseConstraint> & {
          body: Matter.Body;
        };
        const body = event.body;
        if (body && body.label && body.label.startsWith("task-")) {
          const taskId = body.label.replace("task-", "");
          if (onDragStartRef.current) {
            onDragStartRef.current(taskId);
          }
        }
      },
    );

    // Drag events - enddrag
    Matter.Events.on(
      mouseConstraint,
      "enddrag",
      (e: Matter.IEvent<Matter.MouseConstraint>) => {
        const event = e as Matter.IEvent<Matter.MouseConstraint> & {
          body: Matter.Body;
          mouse: Matter.Mouse;
        };
        const body = event.body;
        if (body && body.label && body.label.startsWith("task-")) {
          const taskId = body.label.replace("task-", "");
          if (onDragEndRef.current) {
            // Get the mouse position relative to the page
            const containerRect = containerRef.current?.getBoundingClientRect();
            const mouseAbsX =
              (containerRect?.left || 0) + event.mouse.position.x;
            const mouseAbsY =
              (containerRect?.top || 0) + event.mouse.position.y;

            onDragEndRef.current(taskId, body.position, {
              x: mouseAbsX,
              y: mouseAbsY,
            });
          }
        }
      },
    );

    // Click Detection (Double Click for Modal)
    let startPoint = { x: 0, y: 0 };
    let lastClickTime = 0;
    let lastClickedTaskId: string | null = null;

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
              const currentTime = Date.now();

              // Double click detection (350ms threshold)
              if (
                taskId === lastClickedTaskId &&
                currentTime - lastClickTime < 350
              ) {
                if (onTaskClickRef.current) {
                  onTaskClickRef.current(taskId);
                }
                // Reset to prevent triple click triggering it again
                lastClickTime = 0;
                lastClickedTaskId = null;
              } else {
                lastClickTime = currentTime;
                lastClickedTaskId = taskId;
              }
              break;
            }
          }
        }
      },
    );

    // 4. Collision Detection for Deformation
    Matter.Events.on(engine, "afterUpdate", () => {
      const pairs: Matter.Pair[] = (
        engine as unknown as { pairs: { list: Matter.Pair[] } }
      ).pairs.list;
      const bodies = Matter.Composite.allBodies(engine.world);

      // Initialize/Reset temporary pressure for this frame
      bodies.forEach((body) => {
        if (!body.plugin.pressures) {
          body.plugin.pressures = [];
        }
        // We don't clear them completely, we'll let them decay in beforeUpdate
      });

      pairs.forEach((pair: Matter.Pair) => {
        if (!pair.isActive) return;

        const { bodyA, bodyB, collision } = pair;

        // Apply pressure to both bodies
        const applyPressure = (
          body: Matter.Body,
          other: Matter.Body,
          normal: Matter.Vector,
        ) => {
          if (body.isStatic) return;

          // Impact or steady pressure - reduced intensity for subtle effect
          const overlap = collision.depth;
          const angle = Math.atan2(normal.y, normal.x);
          // Clamp intensity to prevent extreme values
          const intensity = Math.min(overlap * 0.02, 0.15);

          // Find if we already have a pressure point near this angle
          let found = false;
          for (const p of body.plugin.pressures) {
            const angleDiff = Math.abs(normalizeAngle(p.angle - angle));
            if (angleDiff < 0.5) {
              p.intensity = Math.max(p.intensity, intensity);
              p.targetIntensity = intensity;
              found = true;
              break;
            }
          }

          if (!found) {
            body.plugin.pressures.push({
              angle: angle,
              intensity: intensity,
              targetIntensity: intensity,
              active: true,
            });
          }
        };

        applyPressure(bodyA, bodyB, collision.normal);
        // Note: normal usually points from A to B, so for B we negate it
        applyPressure(bodyB, bodyA, {
          x: -collision.normal.x,
          y: -collision.normal.y,
        });
      });
    });

    const normalizeAngle = (angle: number) => {
      while (angle > Math.PI) angle -= 2 * Math.PI;
      while (angle < -Math.PI) angle += 2 * Math.PI;
      return angle;
    };

    // 5. Constant movement, central gravity and safety checks
    Matter.Events.on(engine, "beforeUpdate", () => {
      const bodies = Matter.Composite.allBodies(engine.world);
      const curWidth = containerRef.current?.clientWidth || 800;
      const curHeight = containerRef.current?.clientHeight || 600;

      bodies.forEach((body) => {
        if (body.isStatic) return;

        // Manage pressures (the "doughy" effect)
        if (body.plugin.pressures) {
          body.plugin.pressures.forEach((p: PressurePoint) => {
            // "Viscous" movement: slowly reach target intensity, then slowly decay
            if (p.intensity < p.targetIntensity) {
              p.intensity += (p.targetIntensity - p.intensity) * 0.2;
            } else {
              p.intensity *= 0.92; // Damping/Viscosity
            }
            // Reset target for next frame so it decays if not colliding
            p.targetIntensity = 0;
          });

          // Remove tiny pressures
          body.plugin.pressures = body.plugin.pressures.filter(
            (p: PressurePoint) => p.intensity > 0.005,
          );
        } else {
          body.plugin.pressures = [];
        }

        // Limit number of pressure points to keep rendering fast
        if (body.plugin.pressures.length > 5) {
          body.plugin.pressures.sort(
            (a: PressurePoint, b: PressurePoint) => b.intensity - a.intensity,
          );
          body.plugin.pressures = body.plugin.pressures.slice(0, 5);
        }

        // 5a. Limit velocity to prevent tunneling (speed capping)
        const maxSpeed = 15;
        if (body.speed > maxSpeed) {
          const ratio = maxSpeed / body.speed;
          Matter.Body.setVelocity(body, {
            x: body.velocity.x * ratio,
            y: body.velocity.y * ratio,
          });
        }

        // 5b. Out-of-bounds safety check (if it escapes, bring it back)
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

        // 5c. Gentle pull toward center
        const centerX = curWidth / 2;
        const centerY = curHeight / 2;
        const forceX = (centerX - body.position.x) * 0.000001;
        const forceY = (centerY - body.position.y) * 0.000001;

        // 5d. Tiny random drift to keep them "alive"
        const driftX = (Math.random() - 0.5) * 0.00005;
        const driftY = (Math.random() - 0.5) * 0.00005;

        Matter.Body.applyForce(body, body.position, {
          x: forceX + driftX,
          y: forceY + driftY,
        });
      });
    });

    // 6. Runner
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    const bodiesMapRef = bodiesMap.current;

    return () => {
      Matter.Events.off(engine, "collisionStart");
      Matter.Events.off(engine, "beforeUpdate");
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
        // Base radius 61.25 (35 * 1.75), grows with urgency (up to ~216 total for max urgency)
        const radius = 61.25 + (urgency / 150) * 87.5; // (35 * 1.75) + (urgency / 150) * (50 * 1.75)

        if (!bodiesMap.current.has(task.id)) {
          // Create new body
          const x =
            task.bubble.x ||
            Math.random() * (containerRef.current?.clientWidth || 500);
          const y =
            task.bubble.y ||
            Math.random() * (containerRef.current?.clientHeight || 500);

          const body = Matter.Bodies.circle(x, y, radius, {
            frictionAir: 0.04, // Higher friction for a "heavy" feel
            restitution: 0.3, // Low bounciness for "plastilina"
            friction: 0.5, // More surface friction
            label: `task-${task.id}`,
            plugin: {
              data: task,
              pressures: [] as PressurePoint[],
            },
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

  // Toggle sidebar barrier - disable during drag to allow dropping on sidebar
  const setSidebarBarrierEnabled = useCallback(
    (enabled: boolean) => {
      const walls = wallsRef.current;
      if (walls.length >= 5) {
        const sidebarWall = walls[4];
        // Move wall far away when disabled, back in place when enabled
        if (enabled) {
          const container = containerRef.current;
          if (container) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            Matter.Body.setPosition(sidebarWall, {
              x: width - 100 - 10,
              y: height / 2,
            });
          }
        } else {
          // Move wall far off-screen
          Matter.Body.setPosition(sidebarWall, { x: -10000, y: -10000 });
        }
      }
    },
    [containerRef],
  );

  // Move a bubble to the center with a velocity kick
  const moveBubbleToCenter = useCallback(
    (taskId: string) => {
      const body = bodiesMap.current.get(taskId);
      const container = containerRef.current;

      if (body && container) {
        const centerX = (container.clientWidth - 100) / 2; // Account for sidebar
        const centerY = container.clientHeight / 2;

        // Teleport to center
        Matter.Body.setPosition(body, { x: centerX, y: centerY });

        // Give it a small random velocity for a "pop" effect
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 8,
        });
      }
    },
    [containerRef],
  );

  return {
    engineRef,
    runnerRef,
    syncTasks,
    bodiesMap,
    setSidebarBarrierEnabled,
    moveBubbleToCenter,
  };
};
