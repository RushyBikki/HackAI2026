import dagre from 'dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;

export function layoutGraph(nodes, edges) {
  // Run all nodes through dagre (TB = top-to-bottom).
  // Completed courses with no prerequisites naturally sit in the top ranks.
  // Available courses cluster in the "frontier" band just below their completed prereqs.
  // Locked courses fall below. Truly isolated nodes (no edges) land in rank 0 at the top.
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 35, marginx: 60, marginy: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map(n => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos ? pos.x - NODE_WIDTH / 2 : 0,
        y: pos ? pos.y - NODE_HEIGHT / 2 : 0,
      },
    };
  });
}
