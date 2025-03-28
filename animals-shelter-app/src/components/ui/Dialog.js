import React, { Fragment } from 'react';

// Dialog Context for managing state
const DialogContext = React.createContext({
    isOpen: false,
    setIsOpen: () => {},
});

// Main Dialog component
const Dialog = ({ children }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <DialogContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </DialogContext.Provider>
    );
};

// Dialog Trigger component
const DialogTrigger = ({ children, asChild = false }) => {
    const { setIsOpen } = React.useContext(DialogContext);

    if (asChild) {
        return React.cloneElement(React.Children.only(children), {
            onClick: (e) => {
                children.props.onClick?.(e);
                setIsOpen(true);
            },
        });
    }

    return (
        <button onClick={() => setIsOpen(true)}>
            {children}
        </button>
    );
};

// Dialog Content component
const DialogContent = ({ children, className, ...props }) => {
    const { isOpen, setIsOpen } = React.useContext(DialogContext);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            {/* Dialog positioning */}
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Main dialog panel */}
                <div
                    className={`
            relative
            w-full max-w-md transform overflow-hidden
            rounded-lg bg-white p-6 text-left
            shadow-xl transition-all
            z-50
            ${className}
          `}
                    onClick={e => e.stopPropagation()}
                    {...props}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

// Dialog Header component
const DialogHeader = ({ className, ...props }) => {
    return (
        <div
            className={`
        mb-4 pb-4 border-b border-gray-200
        ${className}
      `}
            {...props}
        />
    );
};

// Dialog Title component
const DialogTitle = ({ className, children, ...props }) => {
    return (
        <h3
            className={`
        text-lg font-semibold leading-6 text-gray-900
        ${className}
      `}
            {...props}
        >
            {children}
        </h3>
    );
};

// Dialog Footer component
const DialogFooter = ({ className, children, ...props }) => {
    return (
        <div
            className={`
        mt-6 flex justify-end space-x-3
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
};

// Dialog Close button
const DialogClose = ({ className, children, onClick, ...props }) => {
    const { setIsOpen } = React.useContext(DialogContext);

    return (
        <button
            className={`
        absolute top-4 right-4
        text-gray-400 hover:text-gray-500
        focus:outline-none focus:ring-2 focus:ring-green-500
        ${className}
      `}
            onClick={(e) => {
                onClick?.(e);
                setIsOpen(false);
            }}
            {...props}
        >
            <span className="sr-only">Close</span>
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    );
};

// Export all components
export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
};