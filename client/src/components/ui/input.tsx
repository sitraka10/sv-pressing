import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    // Extract possible event handlers to compose them
    const {
      onPaste,
      onCopy,
      onCut,
      onDrop,
      onContextMenu,
      onBeforeInput,
      onKeyDown,
      inputMode,
      name,
      ...rest
    } = props as React.ComponentProps<"input"> & {
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
    }

    // Auto-guard clipboard interactions for telephone inputs or phone-like fields
    const isPhoneName = typeof name === "string" && /phone/i.test(name)
    const guardClipboard = inputMode === "tel" || isPhoneName

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onPaste={(e) => { if (guardClipboard) e.preventDefault(); onPaste?.(e); }}
        onCopy={(e) => { if (guardClipboard) e.preventDefault(); onCopy?.(e); }}
        onCut={(e) => { if (guardClipboard) e.preventDefault(); onCut?.(e); }}
        onDrop={(e) => { if (guardClipboard) e.preventDefault(); onDrop?.(e); }}
        onContextMenu={(e) => { if (guardClipboard) e.preventDefault(); onContextMenu?.(e); }}
        onBeforeInput={(e) => {
          // Some mobile browsers use beforeinput with insertFromPaste
          const nativeType = (e as any)?.nativeEvent?.inputType as string | undefined
          if (guardClipboard && nativeType && nativeType.includes("insertFromPaste")) {
            e.preventDefault()
            return
          }
          onBeforeInput?.(e)
        }}
        onKeyDown={(e) => {
          // Block keyboard paste (Ctrl/Cmd+V) as an extra guard
          if (guardClipboard && ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v')) {
            e.preventDefault()
            return
          }
          onKeyDown?.(e)
        }}
        inputMode={inputMode}
        name={name}
        {...rest}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
