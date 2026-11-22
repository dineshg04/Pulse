import type { TimeRange } from "../../types/dashboard";

interface TimeRangePickerProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customFrom: string;
  customTo: string;
  setCustomFrom: (date: string) => void;
  setCustomTo: (date: string) => void;
  onApply: () => void;
  isCustomRangeInvalid: boolean;
}

function TimeRangePicker({
  timeRange,
  setTimeRange,
  customFrom,
  customTo,
  setCustomFrom,
  setCustomTo,
  onApply,
  isCustomRangeInvalid,
}: TimeRangePickerProps) {
  const inputClass =
    "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="contents">
      <select
        aria-label="Time Range"
        value={timeRange}
        onChange={(event) => setTimeRange(event.target.value as TimeRange)}
        className={`${inputClass} min-w-[150px]`}
      >
        <option value="1h">Last 1 hour</option>
        <option value="24h">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="custom">Custom range</option>
      </select>

      {timeRange === "custom" && (
        <div className="mt-4 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-end">
          <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground sm:w-auto">
            From
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(event) => setCustomFrom(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex w-full flex-col gap-1.5 text-sm text-muted-foreground sm:w-auto">
            To
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(event) => setCustomTo(event.target.value)}
              className={inputClass}
            />
          </label>

          <button
            onClick={onApply}
            disabled={isCustomRangeInvalid}
            className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export default TimeRangePicker;
