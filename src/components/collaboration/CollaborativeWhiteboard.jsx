import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Pencil, Eraser, Square, Circle, Type, Undo, Redo, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CollaborativeWhiteboard({ roomId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [elements, setElements] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: whiteboardData = [] } = useQuery({
    queryKey: ['whiteboard', roomId],
    queryFn: () => base44.entities.WhiteboardData.filter({ room_id: roomId }, 'order'),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (whiteboardData.length > 0) {
      setElements(whiteboardData.map(d => d.data));
      redrawCanvas();
    }
  }, [whiteboardData]);

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return;
    
    const unsubscribe = base44.entities.WhiteboardData.subscribe((event) => {
      if (event.data.room_id === roomId) {
        queryClient.invalidateQueries({ queryKey: ['whiteboard', roomId] });
      }
    });

    return unsubscribe;
  }, [roomId]);

  const saveElementMutation = useMutation({
    mutationFn: (elementData) => {
      if (!user?.id) throw new Error('Not authenticated');
      return base44.entities.WhiteboardData.create({
        room_id: roomId,
        user_id: user.id,
        element_type: tool,
        data: elementData,
        order: elements.length,
      });
    },
    onError: () => toast.error('Failed to save drawing. Please try again.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard', roomId] });
    },
  });

  const clearBoardMutation = useMutation({
    mutationFn: async () => {
      const items = await base44.entities.WhiteboardData.filter({ room_id: roomId });
      await Promise.all(items.map(item => base44.entities.WhiteboardData.delete(item.id)));
    },
    onError: () => toast.error('Failed to clear whiteboard. Please try again.'),
    onSuccess: () => {
      setElements([]);
      clearCanvas();
      queryClient.invalidateQueries({ queryKey: ['whiteboard', roomId] });
      toast.success('Whiteboard cleared');
    },
  });

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);

    if (tool === 'pencil') {
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pencil') {
      const ctx = canvas.getContext('2d');
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Save the element
    const elementData = {
      tool,
      color,
      lineWidth,
      points: [{ x, y }],
    };

    saveElementMutation.mutate(elementData);
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.beginPath();
      element.points?.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success('Whiteboard downloaded');
  };

  const colors = ['#000000', '#FF0000', '#6DBF7E', '#C9A84C', '#D4AF37', '#800020', '#D4AF37'];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
        <Button
          variant={tool === 'pencil' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('pencil')}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant={tool === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('eraser')}
        >
          <Eraser className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-2" />

        {colors.map(c => (
          <button
            key={c}
            className={`w-8 h-8 rounded border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
          />
        ))}

        <div className="w-px h-6 bg-border mx-2" />

        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-24"
        />

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={downloadCanvas}>
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => clearBoardMutation.mutate()}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Drawing as {user?.full_name} • Changes sync in real-time
      </p>
    </div>
  );
}
