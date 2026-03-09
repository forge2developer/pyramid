import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type Option = {
    label: string
    value: string
    // Allow extra data to be passed through
    [key: string]: any
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select items...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item))
    }

    const handleSelect = (item: string) => {
        if (selected.includes(item)) {
            handleUnselect(item)
        } else {
            onChange([...selected, item])
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-auto min-h-10 px-3 py-2 hover:bg-background", className)}
                >
                    <div className="flex gap-1 flex-wrap item-center">
                        {selected.length === 0 && <span className="text-muted-foreground font-normal">{placeholder}</span>}
                        {selected.length > 0 && (
                            <span className="text-sm font-medium mr-2">
                                {selected.length} selected
                            </span>
                        )}
                        <div className="flex gap-1 flex-wrap">
                            {/* Show first few items or just count? 
                  Let's show first 2 and then +N
              */}
                            {selected.slice(0, 3).map((itemValue) => {
                                const option = options.find((o) => o.value === itemValue)
                                const label = option ? option.label : itemValue
                                return (
                                    <div
                                        key={itemValue}
                                        className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleUnselect(itemValue)
                                        }}
                                    >
                                        <span className="truncate max-w-[100px]">{label}</span>
                                        <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                                    </div>
                                )
                            })}
                            {selected.length > 3 && (
                                <div className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                    +{selected.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Search...`} />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Search by label
                                    onSelect={() => {
                                        handleSelect(option.value)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
