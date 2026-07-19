import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "w-full h-14 px-4 text-sm rounded-xl outline-none transition-all",

        // Soft background (like screenshot)
        "bg-gray-100 border border-transparent",

        // Placeholder
        "placeholder:text-gray-400",

        // Focus state (clean green glow)
        "focus:bg-white focus:border-green-700 focus:ring-2 focus:ring-green-100",

        // Disabled
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // Error state
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-100",

        className
      )}
      {...props}
    />
  );
}

export { Input }
