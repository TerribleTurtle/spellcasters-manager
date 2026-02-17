import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TAGS = [
  { value: "fix", label: "Fix" },
  { value: "balance", label: "Balance" },
  { value: "content", label: "Content" },
  { value: "rework", label: "Rework" },
];

interface TagSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function TagSelect({ value, onChange }: TagSelectProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Check if initial value is a preset
  useEffect(() => {
     const isPreset = TAGS.some(t => t.value === value);
     if (value && !isPreset) {
         setIsCustom(true);
         setCustomValue(value);
     }
     // eslint-disable-next-line
  }, [value]);

  const handleSelectChange = (val: string) => {
      if (val === "custom_input_option") {
          setIsCustom(true);
          onChange(""); // Clear until typed
      } else {
          onChange(val);
      }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCustomValue(val);
      onChange(val);
  };

  const clearCustom = () => {
      setIsCustom(false);
      setCustomValue("");
      onChange(TAGS[0].value); // Default back to first
  };

  if (isCustom) {
      return (
          <div className="flex items-center gap-1 w-[120px]">
              <Input 
                className="h-8 text-xs px-2" 
                placeholder="Tag..." 
                value={customValue}
                onChange={handleCustomChange}
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={clearCustom} title="Use Preset">
                  <X className="w-3 h-3" />
              </Button>
          </div>
      );
  }

  return (
    <Select value={TAGS.some(t => t.value === value) ? value : "custom_input_option"} onValueChange={handleSelectChange}>
      <SelectTrigger className="w-[120px] h-9 text-xs">
        <SelectValue placeholder="Select Tag" />
      </SelectTrigger>
      <SelectContent>
        {TAGS.map((tag) => (
          <SelectItem key={tag.value} value={tag.value} className="text-xs">
            {tag.label}
          </SelectItem>
        ))}
        <SelectItem value="custom_input_option" className="text-xs font-medium text-muted-foreground">
            Custom...
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
