import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import CourseNode from './CourseNode.jsx';
import { layoutGraph } from '../utils/layoutEngine.js';

const DEPT_LEGEND = [
  { label: 'CS', color: '#3b82f6' },
  { label: 'MATH', color: '#ef4444' },
  { label: 'SE', color: '#22c55e' },
  { label: 'CGS', color: '#a855f7' },
  { label: 'PHYS', color: '#06b6d4' },
  { label: 'ECS', color: '#f59e0b' },
  { label: 'Other', color: '#6b7280' },
];

function Legend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-24 left-4 z-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-space-800/90 border border-blue-900/60 text-xs text-gray-300 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:bg-space-700 transition-colors flex items-center gap-1.5"
      >
        <span>📖</span> Legend {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="mt-1.5 bg-space-800/95 border border-blue-900/60 rounded-xl p-3 backdrop-blur-sm w-56 space-y-3">
          {/* Node status */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Node Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-green-600 bg-green-950/80 flex items-center justify-center">
                  <span className="text-green-400 text-[9px]">✓</span>
                </div>
                <span className="text-xs text-gray-300">Completed — course finished</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-950/80 flex items-center justify-center">
                  <span className="text-blue-400 text-[9px]">●</span>
                </div>
                <span className="text-xs text-gray-300">Available — prereqs met, take now</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-950/80 flex items-center justify-center">
                  <span className="text-yellow-400 text-[9px]">◷</span>
                </div>
                <span className="text-xs text-gray-300">Planned — added to semester plan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-700 bg-gray-900/80 flex items-center justify-center">
                  <span className="text-gray-500 text-[8px]">🔒</span>
                </div>
                <span className="text-xs text-gray-300">Locked — prereqs not yet met</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-700 bg-gray-900/80 flex items-center justify-center">
                  <span className="text-yellow-400 text-[9px]">★</span>
                </div>
                <span className="text-xs text-gray-300">★ = Concentration / track course</span>
              </div>
            </div>
          </div>

          {/* Edge colors */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Prerequisite Arrows</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-green-600 rounded" />
                <span className="text-xs text-gray-300">Between completed courses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-blue-500 rounded" />
                <span className="text-xs text-gray-300">Leads to an available course</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-yellow-500 rounded" />
                <span className="text-xs text-gray-300">Leads to a planned course</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-600 rounded opacity-60" />
                <span className="text-xs text-gray-300">Leads to a locked course</span>
              </div>
            </div>
          </div>

          {/* Dept color bar */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Top Color Bar = Department</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {DEPT_LEGEND.map(d => (
                <div key={d.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-300">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { courseNode: CourseNode };

// FlowController renders INSIDE <ReactFlow> so useReactFlow() gets the correct context.
function FlowController({ rawNodes, rawEdges, searchTarget, setNodes, setEdges, nodes }) {
  const { fitView, setCenter } = useReactFlow();
  const prevTargetRef = useRef(null);

  useEffect(() => {
    if (!rawNodes?.length) return;
    const laidOut = layoutGraph(rawNodes, rawEdges);
    setNodes(laidOut);
    setEdges(rawEdges);
    setTimeout(() => fitView({ padding: 0.1, duration: 400 }), 100);
  }, [rawNodes, rawEdges]);

  useEffect(() => {
    if (!searchTarget || searchTarget === prevTargetRef.current) return;
    prevTargetRef.current = searchTarget;
    const node = nodes.find(n => n.id === searchTarget);
    if (node) {
      setCenter(node.position.x + 110, node.position.y + 45, { zoom: 1.2, duration: 600 });
    }
  }, [searchTarget, nodes]);

  return null;
}

export default function TechTree({ nodes: rawNodes, edges: rawEdges, onNodeClick, searchTarget }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleNodeClick = useCallback((_, node) => {
    onNodeClick?.(node.data);
  }, [onNodeClick]);

  const miniMapColor = (node) => {
    const s = node.data?.status;
    return s === 'completed' ? '#22c55e'
      : s === 'available' ? '#3b82f6'
      : s === 'planned' ? '#f59e0b'
      : '#374151';
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <FlowController
        rawNodes={rawNodes}
        rawEdges={rawEdges}
        searchTarget={searchTarget}
        setNodes={setNodes}
        setEdges={setEdges}
        nodes={nodes}
      />
      <Background color="#1e2d55" gap={24} size={1} />
      <Controls className="!bg-space-800 !border-blue-900 !rounded-xl" />
      <Legend />
      <MiniMap
        nodeColor={miniMapColor}
        maskColor="rgba(10,14,26,0.8)"
        className="!bg-space-800 !border !border-blue-900 !rounded-xl"
      />
    </ReactFlow>
  );
}
