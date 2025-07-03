import { useState, useEffect, useRef } from "react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { LogOut, PawPrint, Send, AlertCircle, MessageSquare, Menu, X } from "lucide-react"

export default function AdoptionChatbot() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [hasInitialized, setHasInitialized] = useState(false)

    const messagesEndRef = useRef(null)

    const generateId = () => Math.random().toString(36).substring(2, 10)

    useEffect(() => {
        if (hasInitialized && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages, hasInitialized])

    useEffect(() => {
        setMessages([
            {
                id: generateId(),
                role: "assistant",
                content: "Bună ziua! Sunt asistentul virtual PetPal. Cum vă pot ajuta?",
            },
        ])
        setTimeout(() => setHasInitialized(true), 100)
    }, [])

    const formatResponseText = (text) => {
        const paragraphs = text.split(/(?=###|---)/g)

        return paragraphs.map((para, index) => {
            const formattedPara = para
                .replace(/###\s(\d+)\.\s\*\*(.*?)\*\*/g, '<h4 class="font-bold mt-2 text-sm sm:text-base">$1. $2</h4>')
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*([^*]+)\*/g, "<em>$1</em>")
                .replace(/\n/g, "<br />")

            return <div key={index} className="my-1" dangerouslySetInnerHTML={{ __html: formattedPara }} />
        })
    }

    const sendMessageToBackend = async (userMessage) => {
        try {
            const response = await fetch("http://localhost:8083/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: userMessage,
            })

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`)
            }

            const data = await response.text()
            return data
        } catch (error) {
            console.error("Error sending message to backend:", error)
            return "Ne pare rău, a apărut o eroare în comunicarea cu asistentul virtual. Vă rugăm să încercați din nou."
        }
    }

    const handleInputChange = (e) => {
        setInput(e.target.value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!input.trim()) return

        const userMessage = {
            id: generateId(),
            role: "user",
            content: input,
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsTyping(true)

        try {
            const assistantResponse = await sendMessageToBackend(input)

            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    role: "assistant",
                    content: assistantResponse,
                },
            ])
        } catch (error) {
            console.error("Error in chat submission:", error)
            setMessages((prev) => [
                ...prev,
                {
                    id: generateId(),
                    role: "assistant",
                    content: "Ne pare rău, a apărut o eroare. Vă rugăm să încercați din nou.",
                },
            ])
        } finally {
            setIsTyping(false)
        }
    }

    const handleReportProblem = () => {
        window.location.href = "/report-problem"
    }

    const handleTalkToAssistant = () => {
        setMessages((prev) => [
            ...prev,
            {
                id: generateId(),
                role: "assistant",
                content: "Cum vă pot ajuta astăzi cu adopția unui animal de companie?",
            },
        ])
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white border-b shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
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
            <main className="flex-grow flex items-start justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-4xl">
                    <Card className="w-full shadow-lg">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 text-center sm:text-left">
                                Asistentul Virtual PetPal
                            </CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 text-sm sm:text-base py-2 sm:py-2"
                                    onClick={handleReportProblem}
                                >
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Raportează o problemă
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center text-green-600 border-green-200 hover:bg-green-50 text-sm sm:text-base py-2 sm:py-2"
                                    onClick={handleTalkToAssistant}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Vorbește cu asistentul virtual
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-3 sm:p-6">
                            <div className="h-[50vh] sm:h-[60vh] overflow-y-auto mb-4 px-1 sm:px-2 space-y-3 sm:space-y-4">
                                {messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                        {m.role === "user" ? (
                                            <div className="max-w-[85%] sm:max-w-[80%]">
                                                <div className="inline-block p-2 sm:p-3 rounded-lg bg-green-500 text-white text-sm sm:text-base leading-relaxed">
                                                    {m.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="max-w-[90%] sm:max-w-[85%]">
                                                <div className="inline-block p-2 sm:p-3 rounded-lg bg-gray-100 text-black text-sm sm:text-base leading-relaxed">
                                                    {formatResponseText(m.content)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[90%] sm:max-w-[85%]">
                                            <div className="inline-block p-2 sm:p-3 rounded-lg bg-gray-200 text-black">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                                        style={{ animationDelay: "0.2s" }}
                                                    ></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                                        style={{ animationDelay: "0.4s" }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                <Input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Întreabă despre adopția de animale..."
                                    className="flex-grow text-sm sm:text-base py-2 sm:py-2"
                                    disabled={isTyping}
                                />
                                <Button
                                    type="submit"
                                    disabled={isTyping || !input.trim()}
                                    className="bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-2 px-4 sm:px-6 whitespace-nowrap"
                                >
                                    <Send className="h-4 w-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Trimite</span>
                                    <span className="sm:hidden">Send</span>
                                </Button>
                            </form>
                        </CardContent>
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
