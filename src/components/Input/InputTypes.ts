export interface InputProps<T> {
    disabled: boolean
    onChange: (event: { target: { value: React.SetStateAction<string> } }) => void
    onClick: () => void
    value: T
    className?: string
    placeholder?: string
}