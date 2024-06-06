// CommonContext.js
import React, { FC, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as LogoIcon } from '../../icons/logo.svg'
import { CommonProviderProps, WrapperPage } from './IndexVideoTypes';

const CommonContext = createContext<React.ReactNode | null>(null);

export const CommonProvider: FC<CommonProviderProps> = ({ children }) => {
  const commonElement = (
    <div className={'text-center justify-between flex p-6 border-b-[1px] border-[#E5E6E4]'}>
      <Link to="/Chat">
        <LogoIcon />
      </Link>
      <div className={'flex flex-row gap-8'}>
        <Link to="/Chat">
          <button>
            <p className={'font-aeonikBold text-[16px] leading-5 hover:text-[#006F33]'}>
              {WrapperPage.CHAT}
            </p>
          </button>
        </Link>
        <Link to="/Index">
          <button>
            <p className={'font-aeonikBold text-[16px] leading-5 hover:text-[#006F33]'}>
              {WrapperPage.INDEX}
            </p>
          </button>
        </Link>
      </div>
      <div></div>
    </div>
  );

  return <CommonContext.Provider value={commonElement}>{children}</CommonContext.Provider>;
};

export const useCommonElement = (): React.ReactNode | null => {
  return useContext(CommonContext);
};
