"use client"

interface ChartData {
  label: string
  value: number
  color?: string
}

interface SimpleChartProps {
  data: ChartData[]
  type: "bar" | "line" | "pie"
  title?: string
  height?: number
}

export function SimpleChart({ data, type, title, height = 200 }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value))

  // Evita divisão por zero
  const safeMax = maxValue === 0 ? 1 : maxValue
  const denom = Math.max(data.length - 1, 1) // nunca 0

  if (type === "bar") {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
        <div className="space-y-2" style={{ height }}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-16 text-xs text-gray-600 truncate">{item.label}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full ${item.color || "bg-blue-500"} transition-all duration-500`}
                  style={{ width: `${(item.value / safeMax) * 100}%` }}
                />
                <span className="absolute right-2 top-0 text-xs text-white font-medium leading-4">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === "line") {
    if (data.length === 0) {
      return <div className="h-24 flex items-center justify-center text-gray-500">Nenhum dado</div>
    }

    const points = data
      .map((item, index) => {
        const x = (index / denom) * 100
        const y = 100 - (item.value / safeMax) * 80
        return `${x},${y}`
      })
      .join(" ")

    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
        <div className="relative" style={{ height }}>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
            {data.map((item, index) => {
              const x = (index / denom) * 100
              const y = 100 - (item.value / safeMax) * 80
              return <circle key={index} cx={x} cy={y} r="2" fill="#3b82f6" vectorEffect="non-scaling-stroke" />
            })}
          </svg>
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            {data.map((item, index) => (
              <span key={index} className="truncate">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Pie chart simples
  if (type === "pie") {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let currentAngle = 0

    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium mb-3">{title}</h3>}
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: height, height }}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100
                const angle = (percentage / 100) * 360
                const startAngle = currentAngle
                currentAngle += angle

                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180)
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180)
                const x2 = 50 + 40 * Math.cos(((startAngle + angle) * Math.PI) / 180)
                const y2 = 50 + 40 * Math.sin(((startAngle + angle) * Math.PI) / 180)

                const largeArcFlag = angle > 180 ? 1 : 0

                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={item.color || `hsl(${index * 60}, 70%, 50%)`}
                    stroke="white"
                    strokeWidth="1"
                  />
                )
              })}
            </svg>
          </div>
          <div className="space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                />
                <span className="text-gray-600">
                  {item.label}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
