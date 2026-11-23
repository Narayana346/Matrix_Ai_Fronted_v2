import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { OpenRouterModel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel?: string;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function PriceBadge({ free, className }: { free: boolean; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium shrink-0",
        free
          ? "bg-green-500/10 text-green-600 border-green-500/30"
          : "bg-amber-500/10 text-amber-600 border-amber-500/30",
        className
      )}
    >
      {free ? "Free" : "Paid"}
    </Badge>
  );
}

export function ModelSelector({ models, selectedModel, onSelectModel, isLoading, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  const current = useMemo(
    () => models.find((m) => m.id === selectedModel),
    [models, selectedModel]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isLoading}
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="max-w-[140px] truncate">
            {isLoading ? "Loading models..." : current ? current.name : "Default model"}
          </span>
          {current && <PriceBadge free={current.free} className="h-4 px-1.5 text-[10px]" />}
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.id} ${model.name}`}
                  onSelect={() => {
                    onSelectModel(model.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        model.id === selectedModel ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate text-sm">{model.name}</span>
                  </div>
                  <PriceBadge free={model.free} className="h-5 px-1.5 text-[10px]" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
