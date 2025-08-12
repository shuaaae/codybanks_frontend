import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip } from 'chart.js';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip);

const PROGRESSION_LABELS = {
  5: 'EXCELLENT',
  4: 'GOOD',
  3: 'MEDIOCRE',
  2: 'BAD',
  1: 'VERY POOR PERF.'
};

export default function ProgressionChart({ progressionData, loading, dateRange, isDrawingMode }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedColor, setSelectedColor] = useState('#ff6b35');

  // Drawing functions
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Handle touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!isDrawingMode) return;
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setCurrentPath([coords]);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawingMode) return;
    const coords = getCanvasCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setDrawings(prev => [...prev, { path: [...currentPath], color: selectedColor }]);
    }
    setCurrentPath([]);
  };

  const clearDrawings = () => {
    setDrawings([]);
    setCurrentPath([]);
  };

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw completed paths
    drawings.forEach(drawing => {
      const path = drawing.path || drawing; // Support both old and new format
      const color = drawing.color || '#ff6b35'; // Default color for old drawings
      
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });
    
    // Draw current path
    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [drawings, currentPath, selectedColor]);

  // Generate date labels from the date range
  const generateDateLabels = () => {
    if (!dateRange || !dateRange[0]) return progressionData.map((d, i) => `Day ${i + 1}`);
    
    const startDate = new Date(dateRange[0].startDate);
    const labels = [];
    
    for (let i = 0; i < progressionData.length; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Format as "Aug 5", "Aug 6", etc.
      const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const day = currentDate.getDate();
      labels.push(`${month} ${day}`);
    }
    
    return labels;
  };

  // Generate day count labels (Day 1, Day 2, etc.)
  const generateDayLabels = () => {
    return progressionData.map((d, i) => `Day ${i + 1}`);
  };

  if (loading) {
    return <div className="text-blue-300 mt-8">Loading...</div>;
  }

  if (progressionData.length === 0) {
    return <div className="text-gray-300 mt-8">No data for selected range.</div>;
  }

  return (
    <div className="w-full">
      {/* Drawing Mode Controls */}
      {isDrawingMode && (
        <div className="mb-4 p-3 bg-orange-900/30 rounded-lg border border-orange-600/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-orange-200 text-sm font-medium">Coach Feedback Mode Active</span>
            </div>
            <button
              onClick={clearDrawings}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Clear Drawings
            </button>
          </div>
          
          {/* Color Picker */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-orange-200 text-xs font-medium">Pen Color:</span>
            <div className="flex items-center gap-2">
              {[
                { color: '#ff6b35', name: 'Orange' },
                { color: '#22c55e', name: 'Green' },
                { color: '#3b82f6', name: 'Blue' },
                { color: '#ef4444', name: 'Red' },
                { color: '#a855f7', name: 'Purple' },
                { color: '#eab308', name: 'Yellow' },
                { color: '#ffffff', name: 'White' },
                { color: '#6b7280', name: 'Gray' }
              ].map((colorOption) => (
                <button
                  key={colorOption.color}
                  onClick={() => setSelectedColor(colorOption.color)}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedColor === colorOption.color 
                      ? 'border-white shadow-lg scale-110' 
                      : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: colorOption.color }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
          
          <p className="text-orange-300 text-xs">
            Click and drag on the chart to draw feedback annotations
          </p>
        </div>
      )}
      
      {/* Chart Container with Drawing Overlay */}
      <div className="relative">
        <Line
        data={{
          labels: generateDayLabels(),
          datasets: [
            {
              label: 'Progression',
              data: progressionData.map(d => d.score),
              borderColor: isDrawingMode ? 'transparent' : '#facc15',
              backgroundColor: isDrawingMode ? 'transparent' : '#facc15',
              tension: 0.3,
              pointRadius: isDrawingMode ? 0 : 5,
              pointBackgroundColor: isDrawingMode ? 'transparent' : '#facc15',
              fill: false,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: ctx => {
                  // Show the actual date in the tooltip title
                  const dateLabels = generateDateLabels();
                  return dateLabels[ctx[0].dataIndex] || `Day ${ctx[0].dataIndex + 1}`;
                },
                label: ctx => {
                  const d = progressionData[ctx.dataIndex];
                  const total = d.win + d.lose;
                  const winRate = total > 0 ? ((d.win / total) * 100).toFixed(1) : 0;
                  return ` ${PROGRESSION_LABELS[d.score] || 'No Data'} (Win: ${d.win}, Lose: ${d.lose}, Win Rate: ${winRate}%)`;
                }
              }
            },
            title: {
              display: true,
              text: `TRAINING PROGRESS TRACKER - ${generateDateLabels().join(' to ')}`,
              font: { size: 22, weight: 'bold' },
              color: '#fff',
              padding: { top: 10, bottom: 20 }
            }
          },
          scales: {
            y: {
              min: 1,
              max: 5,
              ticks: {
                stepSize: 1,
                callback: v => `${v} ${PROGRESSION_LABELS[v] ? PROGRESSION_LABELS[v] : ''}`,
                color: '#fff',
                font: { weight: 'bold' }
              },
              title: {
                display: true,
                text: 'PROGRESSION',
                color: '#fff',
                font: { weight: 'bold' }
              },
              grid: { color: '#444' }
            },
            x: {
              title: {
                display: true,
                text: 'NUMBER OF DAYS',
                color: '#fff',
                font: { weight: 'bold' }
              },
              ticks: { color: '#fff', font: { weight: 'bold' } },
              grid: { color: '#444' }
            }
          }
        }}
        height={350}
        width={900}
        ref={chartRef}
      />
      
      {/* Drawing Canvas Overlay */}
      {isDrawingMode && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-auto cursor-crosshair"
          width={900}
          height={350}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ 
            zIndex: 10,
            background: 'transparent'
          }}
        />
      )}
    </div>
    </div>
  );
} 