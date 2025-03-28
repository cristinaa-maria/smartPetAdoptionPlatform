const Input = ({ className, ...props }) => {
    return (
        <input
            className={`
        w-full px-3 py-2 
        border border-gray-300 rounded-md
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
        placeholder:text-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
            {...props}
        />
    );
};

export default Input;