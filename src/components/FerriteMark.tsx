export function FerriteMark({ size = 24, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Ferrite mark">
      <g transform="translate(9,9) scale(0.82)">
        <path
          fillRule="evenodd"
          fill={color}
          d="M18 26H82a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H18A10 10 0 0 1 8 64V36a10 10 0 0 1 10-10ZM47 50a13 13 0 1 1-26 0 13 13 0 1 1 26 0ZM75 50a9 9 0 1 1-18 0 9 9 0 1 1 18 0Z"
        />
      </g>
    </svg>
  );
}
