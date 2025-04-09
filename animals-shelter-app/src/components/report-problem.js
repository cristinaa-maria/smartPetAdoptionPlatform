import { useState } from "react"
import { PawPrint, LogOut, Send, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card"
import Button from "./ui/Button"
import Input from "./ui/Input"
import Textarea from "./ui/Textarea"
import Label from "./ui/Label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/Select"

export default function ReportProblem() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        category: "",
        description: "",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState("")

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSelectChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            category: value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError("")

        // Validate form
        if (!formData.name || !formData.email || !formData.category || !formData.description) {
            setError("Vă rugăm să completați toate câmpurile obligatorii.")
            setIsSubmitting(false)
            return
        }

        try {
            // In a real application, you would send this data to your backend
            // const response = await fetch("http://localhost:8083/report-problem", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            //   body: JSON.stringify(formData),
            // })

            // if (!response.ok) {
            //   throw new Error(`Error: ${response.status}`)
            // }

            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Success
            setSubmitted(true)
            console.log("Report submitted:", formData)
        } catch (error) {
            console.error("Error submitting report:", error)
            setError("A apărut o eroare la trimiterea raportului. Vă rugăm să încercați din nou.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setFormData({
            name: "",
            email: "",
            category: "",
            description: "",
        })
        setSubmitted(false)
        setError("")
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/home">
                            Acasă
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/adoption">
                            Adoptă acum
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/editor_catalog">
                            Adaugă anunț adopție
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/info">
                            ÎntreabăPetPal
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/community">
                            Alătură-te comunității
                        </a>
                        <button
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors ml-2"
                            onClick={() => {
                                console.log("Logging out")
                                window.location.href = "/login"
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Deconectare
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-grow">
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-6">
                        <a href="/info" className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Înapoi la Asistentul Virtual
                        </a>
                    </div>

                    <Card className="w-full max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold text-gray-800">Raportează o problemă</CardTitle>
                            <p className="text-gray-500 mt-2">
                                Vă rugăm să ne spuneți ce probleme ați întâmpinat pentru a putea îmbunătăți serviciile noastre.
                            </p>
                        </CardHeader>

                        <CardContent>
                            {submitted ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-8 w-8"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">Mulțumim pentru raportare!</h3>
                                    <p className="text-gray-600 mb-6">
                                        Am primit raportul dumneavoastră și îl vom analiza cât mai curând posibil.
                                    </p>
                                    <Button onClick={handleReset} className="bg-green-600 hover:bg-green-700">
                                        Raportează altă problemă
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nume complet *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Introduceți numele dvs."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Introduceți adresa de email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Categoria problemei *</Label>
                                        <Select value={formData.category} onValueChange={handleSelectChange}>
                                            <SelectTrigger id="category" className="w-full">
                                                <SelectValue placeholder="Selectați categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="technical">Probleme tehnice</SelectItem>
                                                <SelectItem value="account">Probleme cu contul</SelectItem>
                                                <SelectItem value="adoption">Probleme cu procesul de adopție</SelectItem>
                                                <SelectItem value="chatbot">Probleme cu asistentul virtual</SelectItem>
                                                <SelectItem value="other">Altă problemă</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrierea problemei *</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Vă rugăm să descrieți problema întâmpinată cât mai detaliat posibil..."
                                            rows={6}
                                            required
                                        />
                                    </div>
                                </form>
                            )}
                        </CardContent>

                        {!submitted && (
                            <CardFooter className="flex justify-end space-x-4 border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="border-gray-300"
                                >
                                    Anulează
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Se trimite...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Trimite raportul
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>

            <footer className="bg-gray-100 text-gray-600 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p>&copy; 2023 Pet Adoption Center. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" className="hover:text-green-600">
                                Privacy Policy
                            </a>
                            <a href="#" className="hover:text-green-600">
                                Terms of Service
                            </a>
                            <a href="#" className="hover:text-green-600">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
