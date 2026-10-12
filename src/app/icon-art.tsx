/** Shared artwork for the generated PNG app icons. */
export function IconArt({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, display: "flex", background: "#1c1917" }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        <g fill="none" stroke="#fafaf9" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="13" y="22" width="30" height="28" rx="5" />
          <path d="M21 15h24a6 6 0 0 1 6 6v20" />
        </g>
      </svg>
    </div>
  );
}
