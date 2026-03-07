import React, { useCallback, useEffect, useRef } from 'react';
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
      <MiniMap
        nodeColor={miniMapColor}
        maskColor="rgba(10,14,26,0.8)"
        className="!bg-space-800 !border !border-blue-900 !rounded-xl"
      />
    </ReactFlow>
  );
}
