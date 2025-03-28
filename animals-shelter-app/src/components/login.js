import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Input from "./ui/Input"
import Label from "./ui/Label"
import Button from "./ui/Button"
import { PawPrint } from "lucide-react"

export default function Login() {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const response = await fetch("http://localhost:8083/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            })


            const contentType = response.headers.get("content-type")
            let data

            if (contentType && contentType.includes("application/json")) {
                data = await response.json()
            } else {
                const text = await response.text()
                data = { message: text }
            }

            if (response.ok) {
                // If we have a token, use it
                if (data.token) {
                    localStorage.setItem("token", data.token)
                } else {
                    // If no token but successful login, create a temporary one
                    // This is a fallback and should be replaced with proper token handling
                    localStorage.setItem("token", "temp-auth-" + Date.now())
                }
                navigate("/home")
            } else {
                setError(data.error || data.message || "Login failed. Please try again.")
            }
        } catch (error) {
            console.error("Error during login:", error)
            setError("An error occurred. Please check your connection and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 to-blue-500">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0 opacity-20"
                    style={{ backgroundImage: "url('/placeholder.svg?height=400&width=800')" }}
                ></div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <PawPrint className="h-12 w-12 text-green-600 mx-auto" />
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Bine ai revenit</h2>
                        <p className="mt-2 text-sm text-gray-600">Loghează-te pentru a-ți găsi noul prieten!</p>
                    </div>
                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200">
                            <p className="text-red-600 text-center text-sm">{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Adresa de email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="mt-1"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Parolă
                            </Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                {isLoading ? "Se procesează..." : "Logare"}
                            </Button>
                        </div>
                    </form>
                    <div className="mt-4 text-center">
                        <Link to="/signup" className="text-sm text-green-600 hover:text-green-500">
                            Încă nu ai cont? Înregistrează-te aici
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

