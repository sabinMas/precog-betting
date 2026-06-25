"use client";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface SparkLineProps {
  data: number[];
  color?: string;
}

export function SparkLine({ data, color = "#3b82f6" }: SparkLineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 11 }}
          labelFormatter={() => ""}
          formatter={(v: number) => [`${v}¢`, "Price"]}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
