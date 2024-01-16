import { Alert } from "@mui/material"
import { ReactComponent as WarningIcon } from '../../icons/Warning.svg'
import React from "react"

interface WarningsProps {
    type: string
}

const Warnings: React.FC<WarningsProps> = (type) => {
        return (
        <Alert icon={false} severity="error" className={'w-full mt-4 h-[40px] flex flex-row justify-start items-center border-gradient-to-r border from-red-300 to red-50 border-[#F88F87]'}>
            <div className={'w-full flex flex-row justify-start items-center gap-2'}>
                <WarningIcon/>
                <p className={'font-aeonik text-sm text-gray-700'}>
                    Please select videos to delete
                </p>
            </div>
        </Alert>
        )
  }

  export default Warnings