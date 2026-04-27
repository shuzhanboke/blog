const rainColumns = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${index * 6 + 2}%`,
  delay: `${(index % 6) * 0.9}s`,
  duration: `${9 + (index % 5) * 1.4}s`,
}))

const petals = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${(index * 7) % 100}%`,
  delay: `${(index % 7) * 1.3}s`,
  duration: `${14 + (index % 5) * 2}s`,
  size: `${12 + (index % 4) * 8}px`,
}))

export default function BackgroundFx() {
  return (
    <div className="site-backdrop" aria-hidden="true">
      <div className="backdrop-layer backdrop-layer--grid" />
      <div className="backdrop-layer backdrop-layer--glow" />
      <div className="backdrop-layer backdrop-layer--particles" />
      <div className="backdrop-layer backdrop-layer--hacker-rain">
        {rainColumns.map((column) => (
          <span
            key={column.id}
            className="matrix-rain__column"
            style={{
              left: column.left,
              animationDelay: column.delay,
              animationDuration: column.duration,
            }}
          />
        ))}
      </div>
      <div className="backdrop-layer backdrop-layer--literary-petals">
        {petals.map((petal) => (
          <span
            key={petal.id}
            className="literary-petal"
            style={{
              left: petal.left,
              width: petal.size,
              height: petal.size,
              animationDelay: petal.delay,
              animationDuration: petal.duration,
            }}
          />
        ))}
      </div>
      <div className="backdrop-layer backdrop-layer--crt" />
    </div>
  )
}
