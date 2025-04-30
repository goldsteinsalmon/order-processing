
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Create a ref to the input element to use with imperative event handlers
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    
    // Combine the forwarded ref with our local ref
    React.useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);
    
    // More aggressive approach to prevent all scroll events on number inputs
    React.useEffect(() => {
      if (type !== "number" || !inputRef.current) return;
      
      const input = inputRef.current;
      
      // Handle all scroll events
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Add multiple event listeners to catch all possible scroll events
      input.addEventListener('wheel', preventScroll, { passive: false });
      input.addEventListener('touchmove', preventScroll, { passive: false });
      input.addEventListener('scroll', preventScroll, { passive: false });
      
      // Clean up event listeners on unmount
      return () => {
        input.removeEventListener('wheel', preventScroll);
        input.removeEventListener('touchmove', preventScroll);
        input.removeEventListener('scroll', preventScroll);
      };
    }, [type]);
    
    // Wheel handler for React's synthetic events
    const handleWheel = React.useCallback((e: React.WheelEvent<HTMLInputElement>) => {
      if (type === "number") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, [type]);
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          type === "number" && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:!m-0 [&::-webkit-inner-spin-button]:!m-0 [&::-webkit-outer-spin-button]:!opacity-0 [&::-webkit-inner-spin-button]:!opacity-0",
          className
        )}
        // Use our local ref to access the DOM element directly
        ref={inputRef}
        // Still use React's synthetic wheel event handler as a fallback
        onWheel={type === "number" ? handleWheel : undefined}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
