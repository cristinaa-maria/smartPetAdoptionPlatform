import { useState, useEffect, useRef } from "react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { LogOut, PawPrint, Send, AlertCircle, MessageSquare } from "lucide-react"

export default function AdoptionChatbot() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)

    const messagesEndRef = useRef(null)

    const generateId = () => Math.random().toString(36).substring(2, 10)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    useEffect(() => {
        setMessages([
            {
                id: generateId(),
                role: "assistant",
                content: "Bună ziua! Sunt asistentul virtual PetPal. Cum vă pot ajuta?",
            },
        ])
    }, [])

    const formatResponseText = (text) => {
        // Split text by list markers ### or --- to create paragraphs
        const paragraphs = text.split(/(?=###|---)/g)

        return paragraphs.map((para, index) => {
            // Process numbered items
            const formattedPara = para
                .replace(/###\s(\d+)\.\s\*\*(.*?)\*\*/g, '<h4 class="font-bold mt-2">$1. $2</h4>')
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
        // Navigate to the report problem page using standard browser navigation
        window.location.href = "/report-problem"
    }

    const handleTalkToAssistant = () => {
        // You can implement specific assistant conversation starter here
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
                <div className="px-4 py-6 sm:px-0">
                    <Card className="w-full max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold text-gray-800">Asistentul Virtual PetPal</CardTitle>
                            <div className="flex space-x-3 mt-2">
                                <Button
                                    variant="outline"
                                    className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={handleReportProblem}
                                >
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Raportează o problemă
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={handleTalkToAssistant}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Vorbește cu asistentul virtual
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[60vh] overflow-y-auto mb-4 px-1">
                                {messages.map((m) => (
                                    <div key={m.id} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
                                        {m.role === "user" ? (
                                            <span className="inline-block p-3 rounded-lg bg-green-500 text-white max-w-[80%]">
                        {m.content}
                      </span>
                                        ) : (
                                            <div className="inline-block p-3 rounded-lg bg-gray-100 text-black max-w-[85%] leading-relaxed">
                                                {formatResponseText(m.content)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="text-left">
                    <span className="inline-block p-2 rounded-lg bg-gray-200 text-black">
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
                    </span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSubmit} className="flex space-x-2">
                                <Input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Întreabă despre adopția de animale..."
                                    className="flex-grow"
                                />
                                <Button type="submit" disabled={isTyping} className="bg-green-600 hover:bg-green-700">
                                    <Send className="h-4 w-4 mr-2" />
                                    Trimite
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <footer className="bg-gray-100 text-gray-600 py-8">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <p>&copy; 2023 Pet Adoption Center. All rights reserved.</p>
                        <div className="flex space-x-4">
                            <a href="/privacy" className="hover:text-green-600">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="hover:text-green-600">
                                Terms of Service
                            </a>
                            <a href="/contact" className="hover:text-green-600">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
