import { Handle, Position } from '@xyflow/react';

const STATUS_STYLES = {
  completed: {
    border: 'border-emerald-500/80',
    bg: 'from-emerald-500/15 to-emerald-500/5',
    pill: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/60',
    label: 'Completed',
  },
  available: {
    border: 'border-sky-500/80',
    bg: 'from-sky-500/15 to-sky-500/5',
    pill: 'text-sky-300 bg-sky-500/10 border-sky-400/60',
    label: 'Available',
  },
  planned: {
    border: 'border-amber-400/80',
    bg: 'from-amber-400/15 to-amber-400/5',
    pill: 'text-amber-200 bg-amber-400/10 border-amber-300/60',
    label: 'Planned',
  },
  locked: {
    border: 'border-slate-600/70',
    bg: 'from-slate-600/10 to-slate-800/60',
    pill: 'text-slate-300 bg-slate-700/40 border-slate-500/70',
    label: 'Locked',
  },
};

const PREFIX_COLORS = {
  CS: 'bg-sky-500',
  SE: 'bg-indigo-500',
  MATH: 'bg-rose-500',
  CGS: 'bg-fuchsia-500',
  IT: 'bg-emerald-500',
};

export function CourseNode({ data }) {
  const status = data?.status || 'locked';
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.locked;
  const prefix = data?.prefix || 'CS';

  return (
    <div
      className={[
        'group relative rounded-xl border bg-gradient-to-br px-3.5 py-2 text-xs shadow-sm transition-shadow',
        styles.border,
        styles.bg,
        status === 'available' ? 'shadow-[0_0_0_1px_rgba(56,189,248,.45),0_16px_40px_rgba(15,23,42,.9)]' : 'shadow-[0_0_0_1px_rgba(15,23,42,.9)]',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 6, height: 6, background: '#0f172a', borderRadius: 9999 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 6, height: 6, background: '#0f172a', borderRadius: 9999 }}
      />

      <div className="flex items-start gap-2">
        <div
          className={[
            'mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-[0.65rem] font-semibold text-slate-950',
            PREFIX_COLORS[prefix] || 'bg-slate-500',
          ].join(' ')}
        >
          {prefix}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[0.75rem] font-semibold text-slate-50">
              {data.courseId}
            </p>
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.65rem] font-medium',
                styles.pill,
              ].join(' ')}
            >
              {styles.label}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-slate-200">
            {data.name}
          </p>
          <div className="mt-1 flex items-center justify-between text-[0.65rem] text-slate-400">
            <span>{data.creditHours} hours</span>
            {data.avgGPA != null && (
              <span>Avg GPA {data.avgGPA.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

