
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Add event handlers to prevent wheel events from changing number input values
    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent mouse wheel from changing the value when input is of type number
      // This works regardless of focus state
      if (type === "number") {
        // The key is to prevent default AND stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Return false to ensure the event is completely blocked
        return false;
      }
    }, [type]);
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        ref={ref}
        // Apply the wheel handler to all number inputs - this is the key fix
        // We need this regardless of focus state
        onWheel={type === "number" ? handleWheel : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
