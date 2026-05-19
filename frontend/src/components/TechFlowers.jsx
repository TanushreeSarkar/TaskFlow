/**
 * Animated tech-style geometric flowers for auth page backgrounds.
 * Uses cherry-red and bright-blue strokes on a black canvas.
 */

const TechFlower = ({ cx, cy, size, color, delay, rotate, animClass }) => (
  <g transform={`translate(${cx},${cy}) rotate(${rotate})`} style={{ animationDelay: delay }}>
    {/* Central circuit dot */}
    <circle cx="0" cy="0" r={size * 0.08} fill={color} opacity="0.5" />
    <circle cx="0" cy="0" r={size * 0.15} fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />

    {/* Petal geometry — 6 tech petals */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const px = Math.cos(rad) * size * 0.5;
      const py = Math.sin(rad) * size * 0.5;
      const ox = Math.cos(rad) * size * 0.85;
      const oy = Math.sin(rad) * size * 0.85;
      return (
        <g key={i}>
          {/* Petal line */}
          <line x1="0" y1="0" x2={ox} y2={oy} stroke={color} strokeWidth="0.5" opacity="0.2" />
          {/* Petal diamond shape */}
          <path
            d={`M ${px * 0.6} ${py * 0.6} 
                L ${px + py * 0.2} ${py - px * 0.2} 
                L ${ox} ${oy} 
                L ${px - py * 0.2} ${py + px * 0.2} Z`}
            fill={color}
            opacity="0.04"
            stroke={color}
            strokeWidth="0.5"
          />
          {/* Node dot at tip */}
          <circle cx={ox} cy={oy} r={size * 0.04} fill={color} opacity="0.4" />
          {/* Connecting arc */}
          {i < 5 && (
            <path
              d={`M ${ox} ${oy} Q ${ox * 0.7 + Math.cos(rad + 0.5) * size * 0.3} ${oy * 0.7 + Math.sin(rad + 0.5) * size * 0.3} ${Math.cos(((angle + 60) * Math.PI) / 180) * size * 0.85} ${Math.sin(((angle + 60) * Math.PI) / 180) * size * 0.85}`}
              fill="none"
              stroke={color}
              strokeWidth="0.3"
              opacity="0.15"
            />
          )}
        </g>
      );
    })}

    {/* Inner ring */}
    <circle cx="0" cy="0" r={size * 0.35} fill="none" stroke={color} strokeWidth="0.4" opacity="0.15" strokeDasharray="3 5" />
    {/* Outer ring */}
    <circle cx="0" cy="0" r={size * 0.85} fill="none" stroke={color} strokeWidth="0.3" opacity="0.1" strokeDasharray="2 8" />
  </g>
);

const TechCircuit = ({ x1, y1, x2, y2, color }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="0.3" opacity="0.06" strokeDasharray="4 8" />
);

export const TechFlowers = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      {/* Cherry red flowers */}
      <g className="animate-drift" style={{ transformOrigin: '200px 150px' }}>
        <TechFlower cx={120} cy={100} size={80} color="#e11d48" delay="0s" rotate={15} />
      </g>
      <g className="animate-drift-reverse" style={{ transformOrigin: '1000px 200px' }}>
        <TechFlower cx={1050} cy={180} size={100} color="#e11d48" delay="2s" rotate={-20} />
      </g>
      <g className="animate-drift" style={{ transformOrigin: '150px 650px' }}>
        <TechFlower cx={100} cy={680} size={70} color="#e11d48" delay="4s" rotate={45} />
      </g>
      <g className="animate-drift-reverse" style={{ transformOrigin: '900px 700px' }}>
        <TechFlower cx={1000} cy={650} size={90} color="#e11d48" delay="1s" rotate={-10} />
      </g>

      {/* Bright blue flowers */}
      <g className="animate-drift-reverse" style={{ transformOrigin: '350px 700px' }}>
        <TechFlower cx={350} cy={720} size={65} color="#3b82f6" delay="3s" rotate={30} />
      </g>
      <g className="animate-drift" style={{ transformOrigin: '900px 100px' }}>
        <TechFlower cx={850} cy={80} size={75} color="#3b82f6" delay="1s" rotate={-25} />
      </g>
      <g className="animate-drift-reverse" style={{ transformOrigin: '600px 50px' }}>
        <TechFlower cx={550} cy={50} size={55} color="#3b82f6" delay="5s" rotate={60} />
      </g>
      <g className="animate-drift" style={{ transformOrigin: '1100px 500px' }}>
        <TechFlower cx={1120} cy={450} size={85} color="#3b82f6" delay="2s" rotate={-40} />
      </g>

      {/* Small accent flowers */}
      <g className="animate-drift" style={{ transformOrigin: '50px 400px' }}>
        <TechFlower cx={30} cy={380} size={45} color="#e11d48" delay="6s" rotate={10} />
      </g>
      <g className="animate-drift-reverse" style={{ transformOrigin: '700px 750px' }}>
        <TechFlower cx={700} cy={760} size={50} color="#3b82f6" delay="3s" rotate={-55} />
      </g>
      <g className="animate-drift" style={{ transformOrigin: '400px 200px' }}>
        <TechFlower cx={380} cy={220} size={40} color="#e11d48" delay="7s" rotate={75} />
      </g>
      <g className="animate-drift-reverse" style={{ transformOrigin: '1150px 300px' }}>
        <TechFlower cx={1160} cy={250} size={45} color="#3b82f6" delay="4s" rotate={-30} />
      </g>

      {/* Circuit connection lines */}
      <TechCircuit x1={120} y1={100} x2={380} y2={220} color="#e11d48" />
      <TechCircuit x1={850} y1={80} x2={1050} y2={180} color="#3b82f6" />
      <TechCircuit x1={100} y1={680} x2={350} y2={720} color="#e11d48" />
      <TechCircuit x1={1000} y1={650} x2={1120} y2={450} color="#3b82f6" />
      <TechCircuit x1={550} y1={50} x2={850} y2={80} color="#3b82f6" />
      <TechCircuit x1={380} y1={220} x2={550} y2={50} color="#e11d48" />
    </svg>
  </div>
);

export default TechFlowers;
