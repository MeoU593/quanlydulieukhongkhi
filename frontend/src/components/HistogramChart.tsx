import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'
import { HistogramBin } from '../api/data'

interface HistogramChartProps {
    data: HistogramBin[]
    color?: string
    unit?: string
}

export const HistogramChart: React.FC<HistogramChartProps> = ({
    data,
    color = '#3b82f6', // Default blue-500
    unit = ''
}) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                Không có dữ liệu phân phối
            </div>
        )
    }

    return (
        <div className="w-full h-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                        dataKey="label"
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                    />
                    <YAxis
                        stroke="#6b7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#000000e0',
                            border: '1px solid #ffffff20',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: '#ffffff05' }}
                        labelFormatter={(value) => `Nồng độ: ${value} ${unit}`}
                        formatter={(value: number) => [value.toLocaleString(), 'Số lượng điểm ảnh']}
                    />
                    <Bar
                        dataKey="count"
                        radius={[4, 4, 0, 0]}
                    >
                        {data.map((_entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={color}
                                fillOpacity={0.4 + (index / data.length) * 0.6} // Visual gradient
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
