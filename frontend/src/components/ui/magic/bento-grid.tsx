// Adapted from Magic UI Bento Grid (MIT). See public/licenses.
import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

export const BentoGrid = ({
  children,
  className,
  ...props
}: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
