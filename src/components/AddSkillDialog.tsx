import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useSkills } from "@/hooks/useSkills";

const categories = [
  { value: "programming", label: "Programming" },
  { value: "math", label: "Mathematics" },
  { value: "writing", label: "Writing" },
  { value: "research", label: "Research" },
  { value: "engineering", label: "Engineering" },
  { value: "science", label: "Science" },
  { value: "design", label: "Design" },
  { value: "other", label: "Other" },
];

interface AddSkillDialogProps {
  onSkillAdded?: () => void;
}

export function AddSkillDialog({ onSkillAdded }: AddSkillDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  
  const { addSkill } = useSkills();

  const handleSubmit = async () => {
    if (!name || !category) return;

    const skill = await addSkill({ name, category });
    
    if (skill) {
      setOpen(false);
      setName("");
      setCategory("");
      onSkillAdded?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Track New Skill</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              placeholder="e.g., Recursion, Data Analysis, Technical Writing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name || !category}>
              Add Skill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
