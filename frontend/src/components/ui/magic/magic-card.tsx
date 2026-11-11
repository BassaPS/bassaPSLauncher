// Adapted from Magic UI Magic Card (MIT), gradient mode only.
// Motion values update the spotlight without React renders or global listeners.
import { type ComponentPropsWithoutRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

export function MagicCard({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const reduced = useReducedMotion();
  return (
    <div
      {...props}
      className={cn("bassaps-magic-card", className)}
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - bounds.left);
        y.set(event.clientY - bounds.top);
      }}
      onPointerLeave={() => {
        x.set(-300);
        y.set(-300);
      }}
    >
      <motion.div
        aria-hidden="true"
        className="bassaps-magic-highlight"
        style={{
          background: useMotionTemplate`radial-gradient(220px circle at ${x}px ${y}px, var(--card-highlight), transparent 100%)`,
        }}
      />
      {children}
    </div>
  );
}
