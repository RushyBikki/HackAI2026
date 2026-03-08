import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getDeptColor } from '../utils/graphBuilder.js';

const STATUS_STYLES = {
  completed: {
    bg: 'bg-green-950/80 border-green-600',
    label: '✓',
    labelColor: 'text-green-400',
    glow: '',
  },
  available: {
    bg: 'bg-blue-950/80 border-blue-500',
    label: '●',
    labelColor: 'text-blue-400',
    glow: 'node-available',
  },
  planned: {
    bg: 'bg-yellow-950/80 border-yellow-500',
    label: '◷',
    labelColor: 'text-yellow-400',
    glow: '',
  },
  locked: {
    bg: 'bg-gray-900/80 border-gray-700',
    label: '🔒',
    labelColor: 'text-gray-500',
    glow: '',
  },
};

function CourseNode({ data, selected }) {
  const style = STATUS_STYLES[data.status] || STATUS_STYLES.locked;
  const deptColor = getDeptColor(data.courseId);

  return (
    <div
      className={`
        relative w-[220px] rounded-xl border-2 overflow-hidden cursor-pointer transition-all
        ${style.bg} ${style.glow}
        ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-105' : 'hover:scale-102'}
      `}
      style={{ boxShadow: selected ? `0 0 20px ${deptColor}55` : undefined }}
    >
      {/* Department color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: deptColor }} />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-white">{data.courseId}</span>
              <span className={`text-xs ${style.labelColor}`}>{style.label}</span>
            </div>
            <p className="text-gray-300 text-xs mt-0.5 leading-tight line-clamp-2">
              {data.name}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
              {data.creditHours}cr
            </span>
          </div>
        </div>

        {data.avgGPA !== null && (
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, (data.avgGPA / 4) * 100)}%`,
                backgroundColor: data.avgGPA >= 3.0 ? '#22c55e' : data.avgGPA >= 2.0 ? '#f59e0b' : '#ef4444',
                maxWidth: '100%',
              }}
            />
            <span className="text-xs text-gray-400">GPA {data.avgGPA.toFixed(1)}</span>
          </div>
        )}

        {data.topProfessor && (
          <p className="text-xs text-gray-500 mt-1 truncate">
            Top: {data.topProfessor}
          </p>
        )}
      </div>

      {/* React Flow handles */}
      <Handle type="target" position={Position.Top} className="!bg-gray-600 !border-gray-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-600 !border-gray-500" />
    </div>
  );
}

export default memo(CourseNode);
