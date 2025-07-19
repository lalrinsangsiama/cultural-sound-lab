"use client";

import { cn } from "@/lib/utils";

interface ChartContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={cn("w-full h-[300px]", className)}>
      {children}
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  className?: string;
}

export function SimpleBarChart({ data, className }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={cn("w-full h-full flex items-end justify-between gap-2 p-4", className)}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center">
            <div 
              className={cn(
                "w-full rounded-t-md transition-all duration-300 hover:opacity-80",
                item.color || "bg-primary"
              )}
              style={{ 
                height: `${(item.value / maxValue) * 200}px`,
                minHeight: "4px"
              }}
            />
            <div className="text-xs font-medium mt-2 text-center">
              {item.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ${item.value.toFixed(0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SimplePieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  className?: string;
}

export function SimplePieChart({ data, className }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const segments = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className={cn("w-full h-full flex items-center justify-center", className)}>
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20" />
          {segments.map((segment, index) => {
            const startAngleRad = (segment.startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (segment.endAngle - 90) * (Math.PI / 180);
            
            const x1 = 100 + 80 * Math.cos(startAngleRad);
            const y1 = 100 + 80 * Math.sin(startAngleRad);
            const x2 = 100 + 80 * Math.cos(endAngleRad);
            const y2 = 100 + 80 * Math.sin(endAngleRad);
            
            const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');
            
            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                className="hover:opacity-80 transition-opacity"
              />
            );
          })}
        </svg>
        
        <div className="absolute top-full mt-4 w-full">
          <div className="flex flex-wrap justify-center gap-3">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: segment.color }}
                />
                <span>{segment.label}: {segment.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SimpleLineChartProps {
  data: Array<{ label: string; value: number }>;
  className?: string;
}

export function SimpleLineChart({ data, className }: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 300;
    const y = 200 - ((item.value - minValue) / range) * 160;
    return { x, y, ...item };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  return (
    <div className={cn("w-full h-full p-4", className)}>
      <svg width="300" height="200" viewBox="0 0 300 200" className="w-full h-full">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="0"
            y1={40 + i * 32}
            x2="300"
            y2={40 + i * 32}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="hsl(var(--primary))"
            className="hover:r-6 transition-all cursor-pointer"
          />
        ))}
      </svg>
      
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}