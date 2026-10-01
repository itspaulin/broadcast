type Props = {
  count: number
  // Solid ink on the selected tab, outlined on the others.
  solid: boolean
}

export const CountBadge = ({ count, solid }: Props) => (
  <span
    className={`px-1.5 py-px text-xs font-semibold tabular-nums ${
      solid
        ? 'bg-(--mui-palette-text-primary) text-(--mui-palette-background-default)'
        : 'border border-(--mui-palette-divider)'
    }`}
  >
    {count}
  </span>
)
