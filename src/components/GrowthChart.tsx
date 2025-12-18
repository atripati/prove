import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";

interface GrowthChartProps {
  data: Array<{
    date: string;
    score: number;
    activity?: number;
  }>;
  title?: string;
  className?: string;
}

export function GrowthChart({ data, title, className }: GrowthChartProps) {
  return (
    <div className={cn("rounded-2xl bg-card border border-border p-6", className)}>
      {title && (
        <h3 className="text-lg font-display font-semibold mb-4">{title}</h3>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(168, 65%, 38%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(168, 65%, 38%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(40, 20%, 88%)' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(220, 10%, 45%)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(40, 25%, 99%)',
                border: '1px solid hsl(40, 20%, 88%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(220, 25%, 12%)', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(168, 65%, 38%)"
              strokeWidth={3}
              fill="url(#growthGradient)"
              dot={{ fill: 'hsl(168, 65%, 38%)', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(168, 65%, 38%)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
