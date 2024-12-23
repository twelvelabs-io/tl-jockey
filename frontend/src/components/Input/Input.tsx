import React, { forwardRef } from 'react'
import { InputProps } from './InputTypes'

const Input = forwardRef<HTMLInputElement, InputProps<any>>((props, ref) => {
  const { disabled, onChange, placeholder, onClick, value, className, onSubmit } = props;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        ref={ref}
        name='input'
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        onClick={onClick}
        value={value as string}
        className={`align-text-top ${className}`}
        maxLength={1000}
        style={{
          verticalAlign: 'top',
          paddingTop: '8px'
        }}
      />
    </form>
  )
});

export default Input