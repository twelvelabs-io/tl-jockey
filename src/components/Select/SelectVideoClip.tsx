import React from 'react'
import Select, { type ActionMeta, type OptionsOrGroups } from 'react-select'

interface SelectProps<T> {
  data: T[]
  className: string
  selectedOption: string
  handleChange: (option: string | null, actionMeta: ActionMeta<any>) => void // Adjust ActionMeta type as needed
  renderOption: (item: T, index: number) => React.ReactNode
}

interface GroupBase<Option> {
  readonly options: readonly Option[]
  readonly label?: string
}

interface Option { value: string | null }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function SelectVideoClip<T extends string | number> ({
  data,
  selectedOption,
  className,
  handleChange,
  renderOption
}: SelectProps<T>) {
  const options: OptionsOrGroups<Option, GroupBase<Option>> = [
    {
      label: '', // Label for the group if needed
      options: data.map((item) => ({
        value: item.toString(),
        label: item.toString()
      }))
    }
  ]

  return (
    <div className={className}>
      <Select
        defaultValue={selectedOption}
        onChange={handleChange}
        options={options}
        menuIsOpen={true} 
        theme={(theme) => ({
          ...theme,
          borderRadius: 0,
          borderColor: '#D4D5D2',
          colors: {
            ...theme.colors,
            text: 'black',
            primary25: '#E5E6E4',
            primary: '#F7FEF2',
            neutral80: 'black',
          }
        })}
        // styles={{
        //   control: (baseStyles, state) => ({
        //     ...baseStyles,
        //     cursor: state.menuIsOpen ? 'pointer' : ''
        //   }),
        //   option: (provided, state) => ({
        //     ...provided,
        //     cursor: 'pointer'
        //   })
        // }}
        styles={{
          control: () => ({
            display: 'none',  // Hide the control
          }),
          option: (provided) => ({
            ...provided,
            color: 'black',
            cursor: 'pointer',
            fontSize: "14px",
            
          })
        }}
      />
    </div>
  )
}

export default SelectVideoClip
