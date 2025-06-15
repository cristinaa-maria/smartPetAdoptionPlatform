
import { useState, useEffect, useCallback } from "react"
import { PawPrint, LogOut, ArrowLeft, Calendar, User, Check, X, Mail, Phone, MapPin, Clock } from "lucide-react"
import Button from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"

const sampleRequests = {
    "1": {
        id: "1",
        petName: "Max",
        petType: "Câine",
        petBreed: "Labrador Retriever",
        petAge: "2 ani",
        petImage: "/placeholder.svg?height=300&width=300",
        requesterName: "Alexandru Popescu",
        requesterEmail: "alex.popescu@example.com",
        requesterPhone: "0712 345 678",
        requesterAddress: "Strada Primăverii 15, București",
        requestDate: "14/04/2025",
        requestTime: "10:30",
        preferredAdoptionDate: "20/04/2025",
        status: "pending",
        reason:
            "Îmi doresc un companion pentru activități în aer liber și sunt pregătit să ofer un cămin iubitor unui câine care are nevoie.",
    },
    "3": {
        id: "3",
        petName: "Fifi",
        petType: "Pisică",
        petBreed: "Siameză",
        petAge: "3 ani",
        petImage: "/placeholder.svg?height=300&width=300",
        requesterName: "Mihai Dumitrescu",
        requesterEmail: "mihai.dumitrescu@example.com",
        requesterPhone: "0734 567 890",
        requesterAddress: "Strada Florilor 8, Cluj-Napoca",
        requestDate: "15/04/2025",
        requestTime: "09:15",
        preferredAdoptionDate: "22/04/2025",
        status: "pending",
        reason:
            "Vreau să ofer un cămin unui animal care are nevoie de o a doua șansă. Am spațiu, timp și experiență cu pisicile.",
    },
}

// Sample notifications data - in a real app, this would come from an API
const sampleNotifications = {
    "1": {
        id: "1",
        type: "adoption_request",
        requestId: "1",
        petName: "Max",
        petType: "Câine",
        requestDate: "14/04/2025",
        requesterName: "Alexandru Popescu",
        message: "Cerere nouă de adopție pentru Max",
        date: "Acum 2 ore",
        read: false,
    },
    "3": {
        id: "3",
        type: "adoption_request",
        requestId: "3",
        petName: "Fifi",
        petType: "Pisică",
        requestDate: "15/04/2025",
        requesterName: "Mihai Dumitrescu",
        message: "Cerere nouă de adopție pentru Fifi",
        date: "Acum 1 zi",
        read: false,
    },
}

// Enhanced useSearchParams hook to handle different URL formats
const useSearchParams = () => {
    const [params, setParams] = useState({})

    useEffect(() => {
        if (typeof window !== "undefined") {
            console.log("Current URL:", window.location.href)

            // Get the current URL
            const url = window.location.href
            const paramsObj = {}

            // Extract request ID from path
            // This will match patterns like /notification/1 or /notification/abc123
            const pathMatch = url.match(/\/notification\/([^/?]+)/)
            if (pathMatch && pathMatch[1]) {
                console.log("Found ID in path:", pathMatch[1])
                paramsObj.id = pathMatch[1]
            }

            // Parse query parameters
            const searchParams = new URLSearchParams(window.location.search)
            for (const [key, value] of searchParams.entries()) {
                console.log(`Found query param: ${key}=${value}`)
                paramsObj[key] = value
            }

            console.log("Final parsed parameters:", paramsObj)
            setParams(paramsObj)
        }
    }, [])

    return params
}

// Custom hook to handle routing
const useRouter = () => {
    const push = useCallback((path) => {
        if (typeof window !== "undefined") {
            window.location.href = path
        }
    }, [])

    const back = useCallback(() => {
        if (typeof window !== "undefined") {
            window.history.back()
        }
    }, [])

    return { push, back }
}

export default function Notification() {
    console.log("Notification component rendering")

    // Move hooks inside the component
    const router = useRouter()
    const searchParams = useSearchParams()
    const requestId = searchParams.id
    const notificationId = searchParams.notificationId

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [processingAction, setProcessingAction] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [confirmationAction, setConfirmationAction] = useState("")
    const [actionReason, setActionReason] = useState("")
    const [actionComplete, setActionComplete] = useState(false)
    const [request, setRequest] = useState(null) // Initialize request state
    const [notification, setNotification] = useState(null) // Initialize notification state

    const API_BASE_URL = "http://localhost:8083"

    // Manually extract ID from URL if searchParams hook isn't working
    useEffect(() => {
        if (!requestId && typeof window !== "undefined") {
            const url = window.location.href
            const pathMatch = url.match(/\/notification\/([^/?]+)/)

            if (pathMatch && pathMatch[1]) {
                console.log("Manually extracted ID from URL:", pathMatch[1])
                // Directly fetch data with this ID
                fetchRequestDataWithId(pathMatch[1])
            } else {
                console.error("Could not extract ID from URL")
                setError("ID-ul cererii lipsește")
                setLoading(false)
            }
        }
    }, [requestId])

    // Function to fetch data with a specific ID
    const fetchRequestDataWithId = async (id) => {
        console.log("Fetching data for request ID:", id)

        try {
            // Using sample data for demonstration
            setTimeout(() => {
                if (sampleRequests[id]) {
                    setRequest(sampleRequests[id])
                    console.log("Found request data:", sampleRequests[id])

                    // If notification ID is provided, fetch notification details
                    const urlParams = new URLSearchParams(window.location.search)
                    const notifId = urlParams.get("notificationId")

                    if (notifId && sampleNotifications[notifId]) {
                        setNotification(sampleNotifications[notifId])
                        console.log(`Loaded notification: ${notifId} for request: ${id}`)
                    }
                } else {
                    console.error("Request not found in sample data")
                    setError("Cererea de adopție nu a fost găsită")
                }
                setLoading(false)
            }, 800) // Simulate API delay
        } catch (err) {
            console.error("Error fetching adoption request:", err)
            setError("Nu s-a putut încărca cererea de adopție")
            setLoading(false)
        }
    }

    // Update the fetchRequestData function to log more information
    const fetchRequestData = async () => {
        console.log("Search params:", searchParams)
        console.log("Request ID from params:", requestId)
        console.log("Notification ID from params:", notificationId)

        if (!requestId) {
            console.warn("No request ID found in params, will try manual extraction")
            return // The manual extraction effect will handle this case
        }

        try {
            // Using sample data for demonstration
            setTimeout(() => {
                if (sampleRequests[requestId]) {
                    setRequest(sampleRequests[requestId])
                    console.log("Found request data:", sampleRequests[requestId])

                    // If notification ID is provided, fetch notification details
                    if (notificationId && sampleNotifications[notificationId]) {
                        setNotification(sampleNotifications[notificationId])
                        console.log(`Loaded notification: ${notificationId} for request: ${requestId}`)
                    }
                } else {
                    console.error("Request not found in sample data")
                    setError("Cererea de adopție nu a fost găsită")
                }
                setLoading(false)
            }, 800) // Simulate API delay
        } catch (err) {
            console.error("Error fetching adoption request:", err)
            setError("Nu s-a putut încărca cererea de adopție")
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log("Running fetchRequestData effect")
        fetchRequestData()
    }, [requestId, notificationId])

    const handleAction = (action) => {
        setConfirmationAction(action)
        setShowConfirmation(true)
    }

    const confirmAction = async () => {
        setProcessingAction(true)

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update local state to reflect the change
            setRequest({
                ...request,
                status: confirmationAction === "approve" ? "approved" : "declined",
                statusReason: actionReason,
            })

            setActionComplete(true)
        } catch (err) {
            console.error(`Error ${confirmationAction}ing adoption request:`, err)
            setError(`Nu s-a putut ${confirmationAction === "approve" ? "aproba" : "respinge"} cererea`)
        } finally {
            setProcessingAction(false)
            setShowConfirmation(false)
        }
    }

    const cancelAction = () => {
        setShowConfirmation(false)
        setConfirmationAction("")
        setActionReason("")
    }

    console.log("Current component state:", {
        loading,
        error,
        request: request ? "Has request data" : "No request data",
        notification: notification ? "Has notification data" : "No notification data",
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="border-b bg-white">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Se încarcă cererea de adopție...</p>
                    </div>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="border-b bg-white">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
                            <p>{error}</p>
                        </div>
                        <Button onClick={() => router.push("/home")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Înapoi la pagina principală
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    if (!request) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="border-b bg-white">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <p className="text-gray-600 mb-4">Cererea de adopție nu a fost găsită</p>
                        <Button onClick={() => router.push("/home")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Înapoi la pagina principală
                        </Button>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="border-b bg-white">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6 items-center">
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

            <main className="flex-1 container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-6">
                    <Button variant="outline" onClick={() => router.push("/home")} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Înapoi
                    </Button>
                    <h1 className="text-2xl font-bold">Cerere de adopție pentru {request.petName}</h1>
                    <div className="flex items-center mt-2">
                        <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                        <p className="text-gray-500 text-sm">
                            Cerere primită la data de {request.requestDate}, ora {request.requestTime}
                        </p>
                    </div>

                    {/* Display notification information if available */}
                    {notification && (
                        <div className="mt-2 bg-green-50 p-3 rounded-md border border-green-200">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium">Notificare:</span> {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                        </div>
                    )}
                </div>

                {actionComplete && (
                    <div
                        className={`mb-6 p-4 rounded-lg ${
                            request.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                    >
                        <p className="font-semibold">
                            {request.status === "approved"
                                ? "Cererea de adopție a fost aprobată!"
                                : "Cererea de adopție a fost respinsă."}
                        </p>
                        {actionReason && <p className="mt-2">{actionReason}</p>}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left column - Pet Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PawPrint className="h-5 w-5 text-green-600" />
                                Informații despre animal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <img
                                    src={request.petImage || "/placeholder.svg"}
                                    alt={request.petName}
                                    className="rounded-lg w-full max-w-xs object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{request.petName}</h3>
                                <p className="text-gray-600">
                                    {request.petType} • {request.petBreed}
                                </p>
                                <p className="text-gray-600">Vârstă: {request.petAge}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Middle column - Requester Information */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-green-600" />
                                Informații despre solicitant
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold">Date personale</h3>
                                    <div className="mt-2 space-y-2">
                                        <p className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            {request.requesterName}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-500" />
                                            {request.requesterEmail}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-500" />
                                            {request.requesterPhone}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-500" />
                                            {request.requesterAddress}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Detalii cerere</h3>
                                    <div className="mt-2 space-y-2">
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            Data cererii: {request.requestDate}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-500" />
                                            Ora cererii: {request.requestTime}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            Data preferată pentru adopție: {request.preferredAdoptionDate}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${getStatusColor(request.status)} mr-1`}></div>
                                            Status: {getStatusText(request.status)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold">Motivul adopției</h3>
                                <p className="mt-2">{request.reason}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action buttons */}
                {!actionComplete && request.status === "pending" && (
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                            onClick={() => handleAction("decline")}
                        >
                            <X className="mr-2 h-5 w-5" />
                            Respinge cererea
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")}>
                            <Check className="mr-2 h-5 w-5" />
                            Aprobă cererea
                        </Button>
                    </div>
                )}

                {request.status === "approved" && !actionComplete && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => router.push(`/adoption-schedule?id=${request.id}`)}
                        >
                            <Calendar className="mr-2 h-5 w-5" />
                            Programează adopția
                        </Button>
                    </div>
                )}
            </main>

            {/* Confirmation Dialog */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold">
                                {confirmationAction === "approve" ? "Aprobă cererea" : "Respinge cererea"}
                            </h2>
                        </div>
                        <div className="p-4">
                            <p className="mb-4">
                                {confirmationAction === "approve"
                                    ? `Ești sigur că vrei să aprobi cererea de adopție pentru ${request.petName}?`
                                    : `Ești sigur că vrei să respingi cererea de adopție pentru ${request.petName}?`}
                            </p>
                            <label className="block mb-2">Adaugă un mesaj (opțional):</label>
                            <textarea
                                className="w-full border rounded-md p-2 mb-4"
                                rows={4}
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder={
                                    confirmationAction === "approve"
                                        ? "Ex: Felicitări! Cererea ta a fost aprobată. Te vom contacta pentru a stabili detaliile."
                                        : "Ex: Ne pare rău, dar cererea ta nu a fost aprobată din următoarele motive..."
                                }
                            />
                        </div>
                        <div className="p-4 border-t flex justify-end space-x-2">
                            <Button variant="outline" onClick={cancelAction} disabled={processingAction}>
                                Anulează
                            </Button>
                            <Button
                                className={
                                    confirmationAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                }
                                onClick={confirmAction}
                                disabled={processingAction}
                            >
                                {processingAction ? (
                                    <span className="flex items-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Se procesează...
                  </span>
                                ) : confirmationAction === "approve" ? (
                                    "Aprobă"
                                ) : (
                                    "Respinge"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper functions
function getStatusColor(status) {
    switch (status) {
        case "approved":
            return "bg-green-500"
        case "declined":
            return "bg-red-500"
        case "pending":
        default:
            return "bg-yellow-500"
    }
}

function getStatusText(status) {
    switch (status) {
        case "approved":
            return "Aprobată"
        case "declined":
            return "Respinsă"
        case "pending":
        default:
            return "În așteptare"
    }
}
