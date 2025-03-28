import React from 'react';

const Button = ({ children, className, ...props }) => {
    return (
        <button
            className={`
        px-4 py-2 font-medium rounded-md
        bg-green-600 hover:bg-green-700 text-white
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
        ${className}
      `}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;