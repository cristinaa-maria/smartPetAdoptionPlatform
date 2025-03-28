export function Separator({ orientation = "horizontal", className = "" }) {
    return (
        <hr
            className={`${orientation === "horizontal" ? "w-full h-px" : "h-full w-px"} bg-gray-200 border-0 ${className}`}
        />
    )
}

