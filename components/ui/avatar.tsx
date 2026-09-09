import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

function Avatar({
  name,
  color,
  className,
}: {
  name: string;
  color?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
        className
      )}
      style={{ backgroundColor: color || "#5c6874" }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar };
