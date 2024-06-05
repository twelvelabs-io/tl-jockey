import React from 'react'
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
interface DummyVideoThumbnailProps {
    width?: string;
    height?: string
}

export const DummyVideoThumbnail:React.FC<DummyVideoThumbnailProps> = ({width, height}) => {

    return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width || '102'}
            height={height || 52}
            fill="none"
            >
            <rect width={width || '102'} height={height || 56} fill="#E5E6E4" rx={4} />
            <path
            fill="#B7B9B4"
            fillRule="evenodd"
            d="M51 37.722c5.334 0 9.659-4.353 9.659-9.722 0-5.37-4.325-9.722-9.66-9.722-5.334 0-9.658 4.352-9.658 9.722 0 5.37 4.324 9.722 9.659 9.722ZM55.025 28l-5.635 3.24v-6.48L55.025 28Z"
            clipRule="evenodd"
            />
        </svg>
    )
}

export default DummyVideoThumbnail