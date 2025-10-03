import { cn } from "@/lib/utils";
import { useState } from "react";

interface BackgroundGlowProps {
  className?: string;
}

export const BackgroundGlow = ({ className }: BackgroundGlowProps) => {
  const [count, setCount] = useState(0);

  return (
    <div
      className={cn("absolute inset-0 z-0", className)}
      style={{
        background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #253C73 100%)",
      }}
    />
  );
};
