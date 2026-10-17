import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export function RedlineLogo({ size = 32, className = "", ...props }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="7" className="fill-surface stroke-border" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" className="text-muted/50" />
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" className="text-accent/80" />
      <circle cx="16" cy="16" r="2.5" className="fill-red-500" />
      <line x1="16" y1="3" x2="16" y2="29" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-red-500" />
      <line x1="3" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-red-500/60" />
      <line x1="16" y1="16" x2="23" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-accent" />
      <circle cx="23" cy="9" r="1.2" className="fill-accent" />
    </svg>
  );
}
