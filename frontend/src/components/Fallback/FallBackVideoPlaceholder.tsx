import React from "react";
import DummyVideoThumbnail from "../../icons/DummyVideoThumbnail";

enum dummyData {
    time = "08:10",
    text = "San Francisco 49ers vs. Kansas City Chiefs | Super Bowl LVIII..."
}

interface FallbackVideoPlaceholderProps {
    size?: string
}

const FallBackVideoPlaceholder: React.FC<FallbackVideoPlaceholderProps> = ({ size }) => (
    <div className='flex flex-row gap-1 cursor-pointer'>
      <div className='relative cursor-pointer'>
        <DummyVideoThumbnail/>
        <div className='opacity-60 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'>
          {/* <PlayVideoSmall /> */}
        </div>
        <div className='absolute top-0 right-0 pr-[4px] pl-[4px] pt-[2px] pb-[2px] bg-[#22222299] rounded-bl-lg rounded-tr-lg'>
          <p className='text-[12px] font-aeonik text-[#FFFFFF]'>
            {
              dummyData.time
            }
          </p>
        </div>
      </div>
      <div className="div">
        <p className='font-aeonik font-normal text-sm text-[#585956]'>
            {
              dummyData.text
            }
        </p>
      </div>
    </div>
  );
  
  export default FallBackVideoPlaceholder;