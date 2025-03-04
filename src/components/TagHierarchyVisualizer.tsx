import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Tag, ArrowRight, Plus, Minus, ZoomIn, ZoomOut, Link as LinkIcon, Unlink, Search, Filter, Group } from 'lucide-react';
import { BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
}

interface Node {
  id: string;
  label: string;
  level: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  color?: string;
  size?: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'parent' | 'related';
}

export function TagHierarchyVisualizer({ store, onUpdateStore }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [relatedTags, setRelatedTags] = useState<string[]>([]);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showRelatedOnly, setShowRelatedOnly] = useState(false);

  useEffect(() => {
    // Convert tag groups to nodes and edges
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    Object.entries(store.tagGroups || {}).forEach(([groupName, group]) => {
      // Add group node
      newNodes.push({
        id: groupName,
        label: groupName,
        level: 0,
        color: group.color || '#3b82f6',
        size: 20
      });

      // Add tag nodes and connect to group
      group.tags.forEach(tag => {
        newNodes.push({
          id: tag,
          label: tag,
          level: 1,
          color: '#60a5fa',
          size: 15
        });
        newEdges.push({
          source: groupName,
          target: tag,
          type: 'parent'
        });
      });
    });

    // Initialize positions in a circular layout
    const centerX = canvasRef.current?.width ? canvasRef.current.width / 2 : 400;
    const centerY = canvasRef.current?.height ? canvasRef.current.height / 2 : 300;
    const radius = Math.min(centerX, centerY) * 0.8;

    newNodes.forEach((node, i) => {
      const angle = (i / newNodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle) * (node.level === 0 ? 0.5 : 1);
      node.y = centerY + radius * Math.sin(angle) * (node.level === 0 ? 0.5 : 1);
      node.vx = 0;
      node.vy = 0;
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [store.tagGroups]);

  // Force-directed layout simulation
  useEffect(() => {
    let animationFrame: number;
    const strength = 0.05;
    const damping = 0.8;
    const repulsion = 1000;
    const springLength = 100;

    function updatePositions() {
      if (isDragging) return;

      const updatedNodes = nodes.map(node => {
        if (node.id === draggedNode) return node;

        let fx = 0, fy = 0;

        // Repulsion between nodes
        nodes.forEach(other => {
          if (other.id === node.id) return;
          const dx = node.x! - other.x!;
          const dy = node.y! - other.y!;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance === 0) return;
          const force = repulsion / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        });

        // Spring forces for edges
        edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            const other = nodes.find(n => 
              n.id === (edge.source === node.id ? edge.target : edge.source)
            )!;
            const dx = node.x! - other.x!;
            const dy = node.y! - other.y!;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance === 0) return;
            const force = (distance - springLength) * strength;
            fx -= (dx / distance) * force;
            fy -= (dy / distance) * force;
          }
        });

        // Update velocity and position
        const vx = (node.vx! + fx) * damping;
        const vy = (node.vy! + fy) * damping;
        return {
          ...node,
          vx,
          vy,
          x: node.x! + vx,
          y: node.y! + vy
        };
      });

      setNodes(updatedNodes);
      animationFrame = requestAnimationFrame(updatePositions);
    }

    animationFrame = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrame);
  }, [nodes, edges, isDragging, draggedNode]);

  const handleMouseDown = (event: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const clickedNode = nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) <= (node.size || 15);
    });

    if (clickedNode) {
      setIsDragging(true);
      setDraggedNode(clickedNode.id);
      dragStartPos.current = { x, y };
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    if (isDragging && draggedNode) {
      setNodes(nodes.map(node => 
        node.id === draggedNode
          ? { ...node, x, y, vx: 0, vy: 0 }
          : node
      ));
    } else {
      const hoveredNode = nodes.find(node => {
        const dx = node.x! - x;
        const dy = node.y! - y;
        return Math.sqrt(dx * dx + dy * dy) <= (node.size || 15);
      });
      setHoveredNode(hoveredNode?.id || null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
    dragStartPos.current = null;
  };

  const handleAddRelationship = () => {
    if (!selectedNode || !hoveredNode || selectedNode === hoveredNode) return;

    const newEdge: Edge = {
      source: selectedNode,
      target: hoveredNode,
      type: 'related'
    };

    if (!edges.some(e => 
      (e.source === newEdge.source && e.target === newEdge.target) ||
      (e.source === newEdge.target && e.target === newEdge.source)
    )) {
      setEdges([...edges, newEdge]);
      
      // Update store with new relationship
      const sourceNode = nodes.find(n => n.id === selectedNode)!;
      const targetNode = nodes.find(n => n.id === hoveredNode)!;
      
      onUpdateStore({
        ...store,
        tagGroups: {
          ...store.tagGroups,
          [sourceNode.label]: {
            ...store.tagGroups![sourceNode.label],
            relatedTags: [
              ...(store.tagGroups![sourceNode.label]?.relatedTags || []),
              targetNode.label
            ]
          }
        }
      });
    }
  };

  const handleRemoveRelationship = () => {
    if (!selectedNode || !hoveredNode) return;

    setEdges(edges.filter(edge => 
      !(edge.source === selectedNode && edge.target === hoveredNode) &&
      !(edge.source === hoveredNode && edge.target === selectedNode)
    ));
    
    // Remove bidirectional relationship
    setEdges(edges.filter(edge => 
      !(edge.source === hoveredNode && edge.target === selectedNode)
    ));

    // Update store by removing relationship
    const sourceNode = nodes.find(n => n.id === selectedNode)!;
    const targetNode = nodes.find(n => n.id === hoveredNode)!;

    onUpdateStore({
      ...store,
      tagGroups: {
        ...store.tagGroups,
        [sourceNode.label]: {
          ...store.tagGroups![sourceNode.label],
          relatedTags: store.tagGroups![sourceNode.label]?.relatedTags?.filter(
            tag => tag !== targetNode.label
          ) || []
        }
      }
    });
  };

  const filteredNodes = useMemo(() => {
    let filtered = nodes;
    
    if (searchTerm) {
      filtered = filtered.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedGroup) {
      filtered = filtered.filter(node => 
        node.level === 0 ? node.id === selectedGroup :
        edges.some(edge => 
          edge.source === selectedGroup && edge.target === node.id
        )
      );
    }
    
    if (showRelatedOnly && selectedNode) {
      filtered = filtered.filter(node =>
        node.id === selectedNode ||
        edges.some(edge =>
          (edge.source === selectedNode && edge.target === node.id) ||
          (edge.target === selectedNode && edge.source === node.id)
        )
      );
    }
    
    return filtered;
  }, [nodes, searchTerm, selectedGroup, showRelatedOnly, selectedNode, edges]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animationFrame: number;

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(zoom, zoom);

      // Draw edges
      const visibleEdges = edges.filter(edge =>
        filteredNodes.some(n => n.id === edge.source) &&
        filteredNodes.some(n => n.id === edge.target)
      );
      
      visibleEdges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.strokeStyle = edge.type === 'parent' ? '#94a3b8' : '#60a5fa';
        ctx.lineWidth = edge.type === 'parent' ? 2 : 1;
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y! - source.y!, target.x! - source.x!);
        const arrowLength = 10;
        const arrowWidth = 8;
        const arrowX = target.x! - Math.cos(angle) * (target.size || 15);
        const arrowY = target.y! - Math.sin(angle) * (target.size || 15);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = edge.type === 'parent' ? '#94a3b8' : '#60a5fa';
        ctx.fill();
      });

      // Draw nodes
      filteredNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, node.size || 15, 0, Math.PI * 2);
        ctx.fillStyle = node.id === selectedNode
          ? '#2563eb'
          : node.id === hoveredNode
          ? '#3b82f6'
          : node.color || '#60a5fa';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw label
        ctx.font = `${node.level === 0 ? 'bold ' : ''}14px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(node.label, node.x!, node.y!);
      });

      ctx.restore();
      animationFrame = requestAnimationFrame(render);
    }

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [nodes, edges, zoom, selectedNode, hoveredNode, filteredNodes]);

  const handleCanvasClick = (event: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) <= (node.size || 15);
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const hoveredNode = nodes.find(node => {
      const dx = node.x! - x;
      const dy = node.y! - y;
      return Math.sqrt(dx * dx + dy * dy) <= (node.size || 15);
    });

    setHoveredNode(hoveredNode?.id || null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Tag className="w-5 h-5 text-blue-500" />
          Tag Hierarchy Visualization
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tags..."
              className="pl-9 pr-4 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedGroup || ''}
            onChange={(e) => setSelectedGroup(e.target.value || null)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Groups</option>
            {nodes.filter(n => n.level === 0).map(group => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
          
          {selectedNode && (
            <button
              onClick={() => setShowRelatedOnly(!showRelatedOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showRelatedOnly
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Show only related tags"
            >
              <Filter className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-[600px] border rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {selectedNode && (
          <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium">{selectedNode}</h4>
              <span className="text-sm text-gray-500">
                {edges.filter(e => e.source === selectedNode || e.target === selectedNode).length} connections
              </span>
            </div>
            <div className="flex gap-2">
              {hoveredNode && hoveredNode !== selectedNode && (
                <>
                  <button
                    onClick={handleAddRelationship}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {edges.some(e => (e.source === selectedNode && e.target === hoveredNode) || (e.source === hoveredNode && e.target === selectedNode)) ? 'Update' : 'Link to'}
                    Link to {hoveredNode}
                  </button>
                  <button
                    onClick={handleRemoveRelationship}
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm"
                  >
                    <Unlink className="w-4 h-4" />
                    Unlink
                  </button>
                </>
              )}
              <button 
                onClick={() => setSelectedNode(null)}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          Group
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-300" />
          Tag
        </div>
        <div className="flex items-center gap-1">
          <ArrowRight className="w-4 h-4 text-gray-400" />
          Parent Relationship
        </div>
        <div className="flex items-center gap-1">
          <ArrowRight className="w-4 h-4 text-blue-400" />
          Related Tags
        </div>
        <div className="text-sm text-gray-500">
          {filteredNodes.length} tags visible
        </div>
      </div>
    </div>
  );
}