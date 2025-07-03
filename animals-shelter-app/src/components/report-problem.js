import { useState } from "react"
import { PawPrint, LogOut, Send, ArrowLeft, Menu, X } from "lucide-react"
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

        if (!formData.name || !formData.email || !formData.category || !formData.description) {
            setError("Vă rugăm să completați toate câmpurile obligatorii.")
            setIsSubmitting(false)
            return
        }

        try {

            await new Promise((resolve) => setTimeout(resolve, 1000))
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
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <a href="/home" className="flex items-center gap-2 flex-shrink-0">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-lg sm:text-xl font-bold">PetPal Adoptions</span>
                        </a>
                        <nav className="hidden lg:flex items-center gap-6">
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
                                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                onClick={() => {
                                    console.log("Logging out")
                                    window.location.href = "/login"
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                Deconectare
                            </button>
                        </nav>
                        <button
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                    {mobileMenuOpen && (
                        <div className="lg:hidden border-t bg-white">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                                <a
                                    href="/home"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Acasă
                                </a>
                                <a
                                    href="/adoption"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Adoptă acum
                                </a>
                                <a
                                    href="/editor_catalog"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Adaugă anunț adopție
                                </a>
                                <a
                                    href="/info"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    ÎntreabăPetPal
                                </a>
                                <a
                                    href="/community"
                                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-md"
                                >
                                    Alătură-te comunității
                                </a>
                                <button
                                    className="flex items-center gap-2 w-full px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                                    onClick={() => {
                                        console.log("Logging out")
                                        window.location.href = "/login"
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Deconectare
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="mb-4 sm:mb-6">
                        <a
                            href="/info"
                            className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors text-sm sm:text-base"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Înapoi la Asistentul Virtual
                        </a>
                    </div>
                    <Card className="w-full max-w-3xl mx-auto shadow-lg">
                        <CardHeader className="pb-4 sm:pb-6">
                            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">Raportează o problemă</CardTitle>
                            <p className="text-gray-500 mt-2 text-sm sm:text-base">
                                Vă rugăm să ne spuneți ce probleme ați întâmpinat pentru a putea îmbunătăți serviciile noastre.
                            </p>
                        </CardHeader>

                        <CardContent className="px-4 sm:px-6">
                            {submitted ? (
                                <div className="text-center py-6 sm:py-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 text-green-600 mb-4">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6 sm:h-8 sm:w-8"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Mulțumim pentru raportare!</h3>
                                    <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
                                        Am primit raportul dumneavoastră și îl vom analiza cât mai curând posibil.
                                    </p>
                                    <Button
                                        onClick={handleReset}
                                        className="bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
                                    >
                                        Raportează altă problemă
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-3 rounded-md text-sm sm:text-base">
                                            {error}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm sm:text-base font-medium">
                                                Nume complet *
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Introduceți numele dvs."
                                                className="text-sm sm:text-base py-2 sm:py-3"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm sm:text-base font-medium">
                                                Email *
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Introduceți adresa de email"
                                                className="text-sm sm:text-base py-2 sm:py-3"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm sm:text-base font-medium">
                                            Categoria problemei *
                                        </Label>
                                        <Select value={formData.category} onValueChange={handleSelectChange}>
                                            <SelectTrigger id="category" className="w-full text-sm sm:text-base py-2 sm:py-3">
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
                                        <Label htmlFor="description" className="text-sm sm:text-base font-medium">
                                            Descrierea problemei *
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Vă rugăm să descrieți problema întâmpinată cât mai detaliat posibil..."
                                            rows={5}
                                            className="text-sm sm:text-base resize-none"
                                            required
                                        />
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Includeți detalii precum când a apărut problema, ce acțiuni ați efectuat, și orice mesaje de
                                            eroare.
                                        </p>
                                    </div>
                                </form>
                            )}
                        </CardContent>

                        {!submitted && (
                            <CardFooter className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t pt-4 sm:pt-6 px-4 sm:px-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="w-full sm:w-auto border-gray-300 text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 order-2 sm:order-1"
                                >
                                    Anulează
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 order-1 sm:order-2"
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
                                            <span className="hidden sm:inline">Se trimite...</span>
                                            <span className="sm:hidden">Trimite...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            <span className="hidden sm:inline">Trimite raportul</span>
                                            <span className="sm:hidden">Trimite</span>
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </main>

            <footer className="bg-gray-100 text-gray-600 py-6 sm:py-8 mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm sm:text-base text-center sm:text-left">
                            &copy; 2025 Pet Adoption Center. All rights reserved.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-center">
                            <a href="/privacy" className="text-sm sm:text-base hover:text-green-600 transition-colors">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="text-sm sm:text-base hover:text-green-600 transition-colors">
                                Terms of Service
                            </a>
                            <a href="/contact" className="text-sm sm:text-base hover:text-green-600 transition-colors">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
