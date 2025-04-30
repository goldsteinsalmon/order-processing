
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Add event handlers to prevent wheel events from changing number input values
    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
      // Prevent mouse wheel from changing the value when input has focus
      if (type === "number") {
        // The key is to prevent default AND stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Return false to ensure the event is completely blocked
        return false;
      }
    }, [type]);
    
    // Use the onWheel prop directly without conditional check
    // This ensures the wheel event is always handled for number inputs
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        ref={ref}
        // Always apply the wheel handler to number inputs, no conditional needed
        onWheel={handleWheel}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
