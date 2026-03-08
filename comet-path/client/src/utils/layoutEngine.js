import dagre from 'dagre';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 90;
const GRID_COLS = 5;        // isolated nodes per row
const GRID_GAP_X = 240;
const GRID_GAP_Y = 110;

export function layoutGraph(nodes, edges) {
  // Split nodes into connected (have at least one edge) vs isolated (no edges at all)
  const connectedIds = new Set();
  edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });

  const connectedNodes = nodes.filter(n => connectedIds.has(n.id));
  const isolatedNodes  = nodes.filter(n => !connectedIds.has(n.id));

  // --- Layout connected nodes via dagre ---
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 120, nodesep: 60, marginx: 50, marginy: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  connectedNodes.forEach(n => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach(e => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  });
  dagre.layout(g);

  const laid = connectedNodes.map(n => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos ? pos.x - NODE_WIDTH / 2 : 0, y: pos ? pos.y - NODE_HEIGHT / 2 : 0 } };
  });

  // Find the bottom of the dagre layout so isolated grid starts below it
  const maxY = laid.length
    ? Math.max(...laid.map(n => n.position.y)) + NODE_HEIGHT
    : 0;
  const GRID_OFFSET_Y = maxY + 120; // gap between main tree and the completed-only section

  // --- Place isolated nodes in a compact grid, grouped by dept prefix ---
  // Sort: completed first, then by prefix, then by ID
  const sorted = [...isolatedNodes].sort((a, b) => {
    const statusOrder = { completed: 0, planned: 1, available: 2, locked: 3 };
    const sa = statusOrder[a.data?.status] ?? 9;
    const sb = statusOrder[b.data?.status] ?? 9;
    if (sa !== sb) return sa - sb;
    const pa = a.data?.prefix || '';
    const pb = b.data?.prefix || '';
    if (pa !== pb) return pa.localeCompare(pb);
    return a.id.localeCompare(b.id);
  });

  // Center the grid horizontally relative to the main dagre layout
  const dagreWidth = laid.length
    ? Math.max(...laid.map(n => n.position.x)) - Math.min(...laid.map(n => n.position.x)) + NODE_WIDTH
    : GRID_COLS * GRID_GAP_X;
  const gridTotalWidth = Math.min(sorted.length, GRID_COLS) * GRID_GAP_X;
  const gridOffsetX = Math.max(0, (dagreWidth - gridTotalWidth) / 2);

  const gridNodes = sorted.map((n, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    return { ...n, position: { x: gridOffsetX + col * GRID_GAP_X, y: GRID_OFFSET_Y + row * GRID_GAP_Y } };
  });

  return [...laid, ...gridNodes];
}
