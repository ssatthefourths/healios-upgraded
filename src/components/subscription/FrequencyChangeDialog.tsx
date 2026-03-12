import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FrequencyChangeDialogProps {
  subscriptionId: string;
  currentFrequency: 'monthly' | 'bimonthly' | 'quarterly';
  onSuccess: () => void;
}

const frequencyOptions = [
  { value: 'monthly', label: 'Every month', description: 'Best for daily supplements' },
  { value: 'bimonthly', label: 'Every 2 months', description: 'Great for moderate use' },
  { value: 'quarterly', label: 'Every 3 months', description: 'Perfect for occasional use' },
];

const FrequencyChangeDialog = ({ subscriptionId, currentFrequency, onSuccess }: FrequencyChangeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(currentFrequency);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = async () => {
    if (selectedFrequency === currentFrequency) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { 
          subscription_id: subscriptionId, 
          action: 'change_frequency',
          new_frequency: selectedFrequency 
        }
      });

      if (error) throw error;

      toast.success('Delivery frequency updated successfully');
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error changing frequency:', error);
      toast.error('Failed to update delivery frequency');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3" />
          Change Frequency
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Delivery Frequency</DialogTitle>
          <DialogDescription>
            Choose how often you'd like to receive your subscription delivery.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedFrequency} onValueChange={(value) => setSelectedFrequency(value as any)}>
            {frequencyOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {option.value === currentFrequency && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Current</span>
                )}
              </div>
            ))}
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating || selectedFrequency === currentFrequency}>
            {isUpdating ? 'Updating...' : 'Update Frequency'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FrequencyChangeDialog;
