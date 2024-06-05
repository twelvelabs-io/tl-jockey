import React from 'react'

interface DeleteIconProps {
    colorOfIcon: string,
    width: string,
    height: string
}

export const DeleteIcon:React.FC<DeleteIconProps> = ({ colorOfIcon, width, height }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            fill="none"
        >
            <path
                fill={colorOfIcon}
                d="M1 16c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V4H1v12ZM14 1h-3.5l-1-1h-5l-1 1H0v2h14V1Z"
            />
      </svg>
    )
}

export default DeleteIcon

