import { Button } from '@mui/material'
import { ChevronRight, LoaderCircle } from 'lucide-react'

type Props = {
  submitting: boolean
  label: string
  submittingLabel: string
}

// While submitting the button keeps its width and only swaps the label, so the form does not
// jump and a second click cannot fire.
export const SubmitButton = ({ submitting, label, submittingLabel }: Props) => (
  <Button
    type="submit"
    variant="contained"
    size="large"
    fullWidth
    disabled={submitting}
    className="min-h-12 text-[15px]"
    startIcon={submitting ? <LoaderCircle size={18} className="animate-spin" /> : undefined}
    endIcon={submitting ? undefined : <ChevronRight size={18} />}
  >
    {submitting ? submittingLabel : label}
  </Button>
)
