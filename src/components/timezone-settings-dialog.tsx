// =============================================================================
// Timezone Settings Dialog: View and change IANA timezone
// =============================================================================

"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Wand2, Check } from "lucide-react";
import { isValidIanaTimezone, DEFAULT_TIMEZONE } from "@/lib/date";

const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

interface TimezoneSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimezoneSettingsDialog({
  open,
  onOpenChange,
}: TimezoneSettingsDialogProps) {
  const [currentTimezone, setCurrentTimezone] = useState(DEFAULT_TIMEZONE);
  const [selectedTz, setSelectedTz] = useState(DEFAULT_TIMEZONE);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    let ignore = false;
    fetch("/api/user/timezone")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data?.timezone) {
          setCurrentTimezone(data.timezone);
          setSelectedTz(data.timezone);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open]);

  const handleDetectBrowser = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && isValidIanaTimezone(detected)) {
        setSelectedTz(detected);
      }
    } catch {}
  };

  const handleClose = () => {
    setSavedSuccess(false);
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!isValidIanaTimezone(selectedTz)) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/user/timezone", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timezone: selectedTz }),
        });

        if (res.ok) {
          setCurrentTimezone(selectedTz);
          setSavedSuccess(true);
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 800);
        }
      } catch (err) {
        console.error("Failed to save timezone", err);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setSavedSuccess(false);
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Timezone Settings
          </DialogTitle>
          <DialogDescription>
            Your practice streaks and calendar days are calculated in your configured timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tz-select">Current Timezone</Label>
            <Select
              value={selectedTz}
              onValueChange={(val) => {
                if (val) setSelectedTz(val);
              }}
              disabled={isLoading || isPending}
            >
              <SelectTrigger id="tz-select">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {!COMMON_TIMEZONES.includes(selectedTz) && (
                  <SelectItem value={selectedTz}>{selectedTz} (Custom)</SelectItem>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Detected browser timezone</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDetectBrowser}
              className="h-7 text-xs gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Auto-detect
            </Button>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || selectedTz === currentTimezone}
            className="gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : isPending ? (
              "Saving..."
            ) : (
              "Save Timezone"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
