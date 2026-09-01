// FICHIER: NeighborhoodCombobox.tsx (À CRÉER)

import React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ANTANANARIVO_NEIGHBORHOODS } from "./neighborhoods"; // Assurez-vous que le chemin est correct

interface NeighborhoodComboboxProps {
  value: string | undefined;
  onSelect: (value: string) => void;
}

const neighborhoods = Object.keys(ANTANANARIVO_NEIGHBORHOODS).map(quartier => ({
    value: quartier.toLowerCase(),
    label: quartier,
}));

export function NeighborhoodCombobox({ value, onSelect }: NeighborhoodComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? neighborhoods.find((neighborhood) => neighborhood.label.toLowerCase() === value.toLowerCase())?.label
            : "Sélectionner un quartier..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un quartier..." />
          <CommandEmpty>Aucun quartier trouvé.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {neighborhoods.map((neighborhood) => (
              <CommandItem
                key={neighborhood.value}
                value={neighborhood.label}
                onSelect={(currentValue) => {
                  const selected = neighborhoods.find(q => q.label.toLowerCase() === currentValue.toLowerCase());
                  if (selected) {
                    onSelect(selected.label);
                  }
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === neighborhood.label ? "opacity-100" : "opacity-0"
                  )}
                />
                {neighborhood.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}