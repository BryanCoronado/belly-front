import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-zinc-300 p-0.5 transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-emerald-500",
        "data-disabled:cursor-not-allowed data-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 data-checked:translate-x-4"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
