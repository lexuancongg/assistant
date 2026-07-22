import { error } from "console";
import { HTMLInputTypeAttribute } from "react";
import { FieldValues, Path, RegisterOptions, UseFormRegister } from "react-hook-form";

type Props<T extends FieldValues> = {
  labelText: string,
  fieldName: Path<T>,
  register: UseFormRegister<T>,
  type?: HTMLInputTypeAttribute,
  registerOptions?: RegisterOptions<T>,
  defaultValue?: string | number,
  disabled?: boolean,
  placeholder?: string,
  error?: string

}
const Input = <T extends FieldValues>(
  {
    fieldName,
    labelText,
    register,
    registerOptions,
    defaultValue,
    disabled = false,
    placeholder,
    type='text',
    error
  }: Props<T>
) => {
  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={fieldName}>
        {labelText} {registerOptions?.required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        id={fieldName}
        className={` w-full h-12 pl-5 text-base text-gray-900 border border-gray-300 rounded-md ${error ? 'border-danger' : ''}`}
        {...register(fieldName, registerOptions)}
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder={placeholder}
      />
      <p className="error-field mt-1 text-danger">{error}</p>
    </div>
  )
}
export default Input;