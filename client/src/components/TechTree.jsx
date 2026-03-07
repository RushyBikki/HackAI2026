import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
import { buildGraph } from '../utils/graphBuilder.js';
import { layoutGraph } from '../utils/layoutEngine.js';
import { CourseNode } from './CourseNode.jsx';

const nodeTypes = {
  courseNode: CourseNode,
};

export function TechTree({
  courses,
  user,
  plannedSemesters,
  onSelectCourse,
  selectedCourseId,
}) {
  const baseUser = useMemo(
    () => ({ ...(user || {}), plannedSemesters: plannedSemesters || [] }),
    [user, plannedSemesters],
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = buildGraph(courses || [], baseUser);
    return {
      initialNodes: layoutGraph(nodes, edges),
      initialEdges: edges,
    };
  }, [courses, baseUser]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeClick = (_, node) => {
    onSelectCourse?.(node.id);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
      className="bg-slate-950"
    >
      <MiniMap
        className="!bg-slate-900/90"
        nodeColor={(n) => {
          const status = n.data?.status;
          if (status === 'completed') return '#22c55e';
          if (status === 'available') return '#38bdf8';
          if (status === 'planned') return '#eab308';
          return '#64748b';
        }}
      />
      <Controls />
      <Background gap={24} color="#1e293b" />
    </ReactFlow>
  );
}

