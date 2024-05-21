import React from 'react'
import { InputProps } from './InputTypes'

function Input<T> ({ disabled, onChange, placeholder, onClick, value, className }: InputProps<T>): JSX.Element {
  return (
    <input
        name='input'
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        onClick={onClick}
        value={value as string}
        className={className}
        maxLength={1000}
        >
    </input>
  )
};

export default Input
