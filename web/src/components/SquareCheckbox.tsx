import { Checkbox, type CheckboxProps } from '@mui/material'
import { Check, Minus } from 'lucide-react'

const BOX = 'grid size-[18px] place-items-center'
const FILLED = `${BOX} bg-(--mui-palette-primary-main) text-(--mui-palette-background-default)`

export const SquareCheckbox = (props: CheckboxProps) => (
  <Checkbox
    className="p-0"
    icon={<span className={`${BOX} border-2 border-(--mui-palette-text-primary)`} />}
    checkedIcon={
      <span className={FILLED}>
        <Check size={14} strokeWidth={3} />
      </span>
    }
    indeterminateIcon={
      <span className={FILLED}>
        <Minus size={14} strokeWidth={3} />
      </span>
    }
    {...props}
  />
)
