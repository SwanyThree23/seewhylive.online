import React, { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Pencil, Square, Type, Image as ImageIcon, Eraser, Trash2, Undo } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborativeWhiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [elements, setElements] = useState([]);

  useEffect(() => {
    // Subscribe to whiteboard updates
    const unsubscribe = base44.entities.WhiteboardData.subscribe((event) => {
      if (event.data.room_id === roomId) {
        if (event.type === 'create') {
          setElements(prev => [...prev, event.data]);
          drawElement(event.data);
        } else if (event.type === 'delete') {
          setElements(prev => prev.filter(e => e.id !== event.id));
          redrawCanvas();
        }
      }
    });

    // Load existing elements
    loadElements();

    return () => unsubscribe();
  }, [roomId]);

  const loadElements = async () => {
    const data = await base44.entities.WhiteboardData.filter({ room_id: roomId }, 'order');
    setElements(data);
    data.forEach(drawElement);
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen') {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    if (tool === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = async (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Save to database
    try {
      const user = await base44.auth.me();
      await base44.entities.WhiteboardData.create({
        room_id: roomId,
        user_id: user.id,
        element_type: 'path',
        data: { color, points: [[x, y]] },
        order: elements.length
      });
    } catch (error) {
      console.error('Failed to save drawing', error);
    }
  };

  const drawElement = (element) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (element.element_type === 'path') {
      ctx.strokeStyle = element.data.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      element.data.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach(drawElement);
  };

  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Delete all elements
    await Promise.all(elements.map(e => base44.entities.WhiteboardData.delete(e.id)));
    setElements([]);
    toast.success('Whiteboard cleared');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
        <Button
          size="sm"
          variant={tool === 'pen' ? 'default' : 'ghost'}
          onClick={() => setTool('pen')}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={tool === 'eraser' ? 'default' : 'ghost'}
          onClick={() => setTool('eraser')}
        >
          <Eraser className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1 ml-2">
          {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded border-2 ${color === c ? 'border-gray-800' : 'border-gray-300'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full border rounded-lg bg-white cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}