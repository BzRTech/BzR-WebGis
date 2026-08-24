import type { ReactNode } from "react";

function Ico({
  d,
  size = 16,
  stroke = 1.6,
}: {
  d: ReactNode;
  size?: number;
  stroke?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d}
    </svg>
  );
}

type P = { size?: number };

export const IcoMap = (p: P) => (
  <Ico size={p.size} d={<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14" /><path d="M15 6v14" /></>} />
);
export const IcoLayers = (p: P) => (
  <Ico size={p.size} d={<><path d="M12 3 2 8l10 5 10-5z" /><path d="M2 13l10 5 10-5" /><path d="M2 18l10 5 10-5" /></>} />
);
export const IcoSearch = (p: P) => (
  <Ico size={p.size} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />
);
export const IcoDraw = (p: P) => (
  <Ico size={p.size} d={<><path d="m3 21 4-1 12-12-3-3L4 17z" /><path d="m14 6 3 3" /></>} />
);
export const IcoReport = (p: P) => (
  <Ico size={p.size} d={<><rect x="4" y="3" width="16" height="18" rx="1" /><path d="M8 8h8M8 12h8M8 16h5" /></>} />
);
export const IcoHome = (p: P) => (
  <Ico size={p.size} d={<><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>} />
);
export const IcoDash = (p: P) => (
  <Ico size={p.size} d={<><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>} />
);
export const IcoPlus = (p: P) => <Ico size={p.size} d={<path d="M12 5v14M5 12h14" />} />;
export const IcoMinus = (p: P) => <Ico size={p.size} d={<path d="M5 12h14" />} />;
export const IcoTarget = (p: P) => (
  <Ico size={p.size} d={<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>} />
);
export const IcoArrow = (p: P) => (
  <Ico size={p.size} d={<><path d="M5 12h14M13 6l6 6-6 6" /></>} />
);
export const IcoBack = (p: P) => (
  <Ico size={p.size} d={<><path d="M19 12H5M11 6l-6 6 6 6" /></>} />
);
export const IcoLock = (p: P) => (
  <Ico size={p.size} d={<><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>} />
);
export const IcoUser = (p: P) => (
  <Ico size={p.size} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></>} />
);
export const IcoSun = (p: P) => (
  <Ico size={p.size} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></>} />
);
export const IcoMoon = (p: P) => (
  <Ico size={p.size} d={<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z" />} />
);
export const IcoDl = (p: P) => (
  <Ico size={p.size} d={<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 21h16" /></>} />
);
export const IcoCheck = (p: P) => <Ico size={p.size} d={<path d="m5 12 5 5L20 7" />} />;
export const IcoAlert = (p: P) => (
  <Ico size={p.size} d={<><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18v.01" /></>} />
);
export const IcoCopy = (p: P) => (
  <Ico size={p.size} d={<><rect x="8" y="8" width="13" height="13" rx="1" /><path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4" /></>} />
);
export const IcoUsers = (p: P) => (
  <Ico size={p.size} d={<><circle cx="9" cy="8" r="3.5" /><path d="M3 20c1-3.5 3.5-5 6-5s5 1.5 6 5" /><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M18 20c-.4-2-1.3-3.6-2.6-4.6" /></>} />
);
export const IcoLogout = (p: P) => (
  <Ico size={p.size} d={<><path d="M14 4h5v16h-5" /><path d="M3 12h12M11 8l4 4-4 4" /></>} />
);
export const IcoHistory = (p: P) => (
  <Ico size={p.size} d={<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>} />
);
