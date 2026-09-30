import { TextField, type TextFieldProps } from '@mui/material'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

type Props<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  control: Control<T>
  name: Path<T>
}

export const FormTextField = <T extends FieldValues>({ control, name, helperText, ...props }: Props<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { ref, ...field }, fieldState }) => (
      <TextField
        fullWidth
        {...props}
        {...field}
        inputRef={ref}
        error={Boolean(fieldState.error)}
        helperText={fieldState.error?.message ?? helperText}
      />
    )}
  />
)
