interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  loading: boolean;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({
  title,
  value,
  description,
  loading,
  icon,
  color,
}: KpiCardProps) {
  return (
    <div
      className="h-full rounded-xl border border-border border-t-[3px] bg-card text-card-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.3)]"
      style={{ borderTopColor: color }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>

          <div
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg"
            style={{
              backgroundColor: `${color}18`,
              color,
            }}
          >
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="mt-3 h-[45px] w-[65%] animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="mt-3 break-words text-3xl font-extrabold tracking-[-1px] text-foreground">
            {value}
          </p>
        )}

        {description && (
          <p className="mt-2 block text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
