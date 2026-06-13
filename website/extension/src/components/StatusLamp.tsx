type StatusLevel = "green" | "yellow" | "red";

const STATUS: Record<StatusLevel, { color: string; glow: string }> = {
  green: { color: "#6b9e72", glow: "rgb(107 158 114 / 50%)" },
  yellow: { color: "#eab56f", glow: "rgb(234 181 111 / 55%)" },
  red: { color: "#d48483", glow: "rgb(212 132 131 / 55%)" },
};

export function StatusLamp({
  status = "green",
  size = "md",
}: {
  status?: StatusLevel;
  size?: "sm" | "md";
}) {
  const config = STATUS[status];
  const px = size === "sm" ? 28 : 40;
  return (
    <div className="status-lamp" style={{ width: px, height: px }}>
      <span
        className="status-lamp-glow"
        style={{ backgroundColor: config.glow, width: px, height: px }}
      />
      <span
        className="status-lamp-core"
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 16px ${config.glow}`,
          width: px,
          height: px,
        }}
      />
    </div>
  );
}
