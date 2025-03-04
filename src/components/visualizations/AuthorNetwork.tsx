import React, { useEffect, useRef } from 'react';
import { TwitterBookmark } from '../../types';

interface Props {
  bookmarks: TwitterBookmark[];
}

interface Node {
  id: string;
  name: string;
  value: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export function AuthorNetwork({ bookmarks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const authors = new Map<string, number>();
    const connections = new Map<string, Map<string, number>>();

    // Count authors and their connections
    bookmarks.forEach(bookmark => {
      authors.set(bookmark.postedBy, (authors.get(bookmark.postedBy) || 0) + 1);

      // Connect authors through mentions and replies
      const mentions = bookmark.content.match(/@(\w+)/g) || [];
      mentions.forEach(mention => {
        const mentionedAuthor = mention.slice(1);
        if (!connections.has(bookmark.postedBy)) {
          connections.set(bookmark.postedBy, new Map());
        }
        const authorConnections = connections.get(bookmark.postedBy)!;
        authorConnections.set(
          mentionedAuthor,
          (authorConnections.get(mentionedAuthor) || 0) + 1
        );
      });
    });

    // Create nodes and links
    const nodes: Node[] = Array.from(authors.entries()).map(([author, count]) => ({
      id: author,
      name: author,
      value: Math.sqrt(count) * 5
    }));

    const links: Link[] = [];
    connections.forEach((authorConnections, source) => {
      authorConnections.forEach((value, target) => {
        if (authors.has(target)) {
          links.push({ source, target, value });
        }
      });
    });

    // Simple force-directed layout
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = containerRef.current.clientWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Initialize node positions
    nodes.forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
    });

    function tick() {
      ctx.clearRect(0, 0, width, height);

      // Draw links
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source)!;
        const target = nodes.find(n => n.id === link.target)!;
        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, node.value, 0, Math.PI * 2);
        ctx.fill();

        // Draw labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x!, node.y! + node.value + 12);
      });
    }

    let animationFrame: number;
    function animate() {
      tick();
      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [bookmarks]);

  return (
    <div ref={containerRef} className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}