"use client";
import { UseFormRegister, FieldValues, FieldErrors } from "react-hook-form";
import { ChangeEvent } from "react";

interface InputProps {
  id: string;
  label: string;
  type?: string;
  disabled?: boolean;
  formatPrice?: boolean;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  min: number;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  type,
  disabled,
  required,
  register,
  errors,
  handleChange,
  min,
}) => {
  return (
    <div className="w-full relative">
      <input
        id={id}
        disabled={disabled}
        {...register(id, { required })}
        placeholder=" "
        type={type}
        className={`
        text-xl
        peer w-full p-1 pt-4 font-light bg-white border-2 rounded-md outline-none transition disabled:opacity-70 disabled:cursor-not-allowed 
         ${errors[id]
          ? "border-rose-500 focus:border-rose-500"
          : "border-neutral-300 focus:border-neutral-800"
        }`}
        onChange={handleChange}
        min={min}
      />
      <label
        className={`absolute text-md duration-150 transform -translate-y-2 top-2 z-10 origin-[0] text-neutral-100
         left-1
         peer-placeholder-shown:scale-100 
        peer-placeholder-shown:translate-y-0 
        peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-neutral-700
         ${errors[id] ? "text-rose-500" : "text-zinc-400"
        }`}
      >
        {label}
      </label>
    </div>
  );
};
export default Input;
