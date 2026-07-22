import {
    FieldValues,
    Path,
    RegisterOptions,
    UseFormRegister,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";

type Option = {
    id: number;
    name: string;
};

type Props<T extends FieldValues> = {
    labelText: string;
    fieldName: Path<T>;
    register: UseFormRegister<T>;
    registerOptions?: RegisterOptions<T>;
    options: Option[];
    defaultValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
};

const OptionSelect = <T extends FieldValues>({
    fieldName,
    labelText,
    options,
    register,
    defaultValue,
    disabled,
    placeholder,
    registerOptions,
    error,
}: Props<T>) => {
    return (
        <div className="space-y-1.5">
            {labelText && (
                <label
                    htmlFor={`select-option-${fieldName}`}
                    className="text-xs font-medium text-gray-500"
                >
                    {labelText}
                </label>
            )}

            <div className="relative">
                <select
                    id={`select-option-${fieldName}`}
                    defaultValue={defaultValue ?? ""}
                    disabled={disabled}
                    {...register(fieldName, registerOptions)}
                    className={`
            w-full
            appearance-none
            rounded-xl
            border
            bg-white
            px-3
            py-2.5
            pr-10
            text-sm
            text-gray-700
            shadow-sm
            transition-all
            duration-200
            focus:outline-none
            focus:ring-2
            focus:ring-blue-100
            focus:border-blue-500
            ${error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-gray-200 hover:border-gray-300"
                        }
            ${disabled
                            ? "bg-blue-100 text-gray-400 cursor-not-allowed"
                            : ""
                        }
          `}
                >
                    <option value="" disabled hidden>
                        {placeholder || "Select..."}
                    </option>

                    {options.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default OptionSelect;