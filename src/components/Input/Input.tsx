import React from 'react'

interface InputProps<T> {
  disabled: boolean
  onChange: (event: { target: { value: React.SetStateAction<string> } }) => void
  onClick: () => void
  value: T
  className?: string
  placeholder?: string
}

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
        >
    </input>
  )
};

export default Input
