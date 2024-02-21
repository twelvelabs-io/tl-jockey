import React from 'react';
import { ButtonProps } from './ButtonTypes';

const Button: React.FC<ButtonProps> = ({ className, children }) => {
    return (
        <>
            <button className={className}>
                {children}
            </button>
        </>
    );
};

export default Button;
