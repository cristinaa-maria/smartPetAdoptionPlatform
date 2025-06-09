import { useState, useEffect, useCallback } from "react"
import Button from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card"
import { PawPrint, Calendar, Info, LogOut, ArrowRight, Bell, Clock } from 'lucide-react'

// Custom navigation hook that doesn't rely on Next.js
const useCustomNavigation = () => {
    const navigate = useCallback((path) => {
        window.location.href = path
    }, [])

    return { navigate }
}

export default function Homepage() {
    const { navigate } = useCustomNavigation()
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([
        {
            id: 1,
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
        {
            id: 2,
            type: "adoption_scheduled",
            requestId: "2",
            petName: "Luna",
            adoptionDate: "15/04/2025",
            adoptionTime: "14:30",
            message: "Programare adopție: Luna - 15/04/2025, ora 14:30",
            date: "Acum 1 zi",
            read: false,
        },
        {
            id: 3,
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
        {
            id: 4,
            type: "vet_reminder",
            petId: "2",
            petName: "Luna",
            message: "Luna are nevoie de o vizită la veterinar. Programează acum!",
            date: "Acum 2 zile",
            read: false,
        },
        {
            id: 5,
            type: "adoption_success",
            petId: "3",
            petName: "Bella",
            message: "Bella a fost adoptată! Mulțumim pentru implicare.",
            date: "Acum 3 zile",
            read: true,
        },
    ])

    const unreadCount = notifications.filter((notification) => !notification.read).length

    const markAsRead = (id) => {
        setNotifications(
            notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
        )
    }

    const markAllAsRead = () => {
        setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
    }

    const handleAcceptRequest = async (notificationId, requestId) => {
        try {
            // In a real app, call API to accept the request
            // await fetch(`${API_BASE_URL}/adoptionRequests/${requestId}/accept`, { method: 'POST' })

            console.log(`Accepting request ${requestId}`)

            // Update notifications - remove this notification and add a success one
            setNotifications((prev) => {
                const notification = prev.find((n) => n.id === notificationId)
                const newNotifications = prev.filter((n) => n.id !== notificationId)

                if (notification) {
                    newNotifications.unshift({
                        id: Date.now(),
                        type: "adoption_success",
                        petId: requestId,
                        petName: notification.petName,
                        message: `Cererea de adopție pentru ${notification.petName} a fost aprobată!`,
                        date: "Chiar acum",
                        read: false,
                    })
                }

                return newNotifications
            })
        } catch (error) {
            console.error("Error accepting request:", error)
        }
    }

    const handleDeclineRequest = async (notificationId, requestId) => {
        try {
            // In a real app, call API to decline the request
            // await fetch(`${API_BASE_URL}/adoptionRequests/${requestId}/decline`, { method: 'POST' })

            console.log(`Declining request ${requestId}`)

            // Update notifications - remove this notification
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        } catch (error) {
            console.error("Error declining request:", error)
        }
    }

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id)

        // Navigate based on notification type using window.location instead of Next.js router
        if (notification.type === "adoption_request") {
            // Pass both notification ID and request ID using a more explicit URL format
            const url = `/notification/${notification.requestId}?notificationId=${notification.id}`
            console.log("Navigating to:", url)
            window.location.href = url
        } else if (notification.type === "adoption_scheduled") {
            window.location.href = `/adoption-schedule?id=${notification.requestId}`
        } else if (notification.type === "vet_reminder") {
            window.location.href = `/pet-profile?id=${notification.petId}`
        } else if (notification.type === "adoption_success") {
            window.location.href = `/pet-profile?id=${notification.petId}`
        }

        setShowNotifications(false)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest(".notification-container")) {
                setShowNotifications(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showNotifications])

    // Format notification message based on type
    const formatNotificationContent = (notification) => {
        switch (notification.type) {
            case "adoption_request":
                return (
                    <div>
                        <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>
                            Cerere nouă de adopție pentru <span className="font-medium">{notification.petName}</span>
                        </p>
                        <p className="text-xs text-gray-600 mt-1">De la: {notification.requesterName}</p>
                        <p className="text-xs text-gray-600">Data cererii: {notification.requestDate}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>

                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcceptRequest(notification.id, notification.requestId)
                                }}
                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                            >
                                Acceptă
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeclineRequest(notification.id, notification.requestId)
                                }}
                                className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                            >
                                Refuză
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    // Use a more explicit URL format to avoid any parsing issues
                                    const url = `/notification/${notification.requestId}?notificationId=${notification.id}`
                                    console.log("Navigating to:", url)
                                    window.location.href = url
                                }}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded ml-auto"
                            >
                                Detalii
                            </button>
                        </div>
                    </div>
                )
            case "adoption_scheduled":
                return (
                    <div>
                        <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>
                            Programare adopție: <span className="font-medium">{notification.petName}</span>
                        </p>
                        <div className="flex items-center mt-1 text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{notification.adoptionDate}</span>
                            <Clock className="h-3 w-3 ml-2 mr-1" />
                            <span>{notification.adoptionTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                    </div>
                )
            default:
                return (
                    <div>
                        <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                    </div>
                )
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">PetPal Adoptions</span>
                    </a>
                    <nav className="flex gap-6 items-center">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="#">
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

                        {/* Notification Icon */}
                        <div className="relative">
                            <button
                                className="flex items-center justify-center text-gray-700 hover:text-green-600 transition-colors"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 py-1 border notification-container">
                                    <div className="p-2 border-b flex justify-between items-center">
                                        <h3 className="font-semibold">Notificări</h3>
                                        {unreadCount > 0 && (
                                            <button className="text-xs text-green-600 hover:text-green-700" onClick={markAllAsRead}>
                                                Marchează toate ca citite
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">Nu ai notificări</div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? "bg-green-50" : ""}`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    {formatNotificationContent(notification)}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 text-center border-t">
                                        <a href="/notifications" className="text-xs text-green-600 hover:text-green-700">
                                            Vezi toate notificările
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

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
            <main className="flex-1">
                <section className="w-full py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-green-400 via-green-500 to-green-600 flex items-center justify-center">
                    <div className="container px-2 md:px-4">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                                    Prietenie pe viață? Începe aici!
                                </h1>
                            </div>
                            <Button className="bg-green-600 hover:bg-green-700" onClick={() => (window.location.href = "/adoption")}>
                                Adoptă acum
                            </Button>
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-16 lg:py-20 flex items-center justify-center">
                    <div className="container px-6 md:px-8">
                        <h2 className="text-3xl font-bold tracking-tighter justify-center text-center mb-12">
                            Ultimele postări și evenimente
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    id: "event-1",
                                    title: "Târg de Adopții de Vară",
                                    date: "15 Iulie, 2025",
                                    description:
                                        "Alătură-te nouă la cel mai mare eveniment de adopție al anului! Întâlnește sute de animăluțe adorabile.",
                                },
                                {
                                    id: "event-2",
                                    title: "Anunț Nou Parteneriat",
                                    date: "1 August, 2025",
                                    description:
                                        "Suntem încântați să anunțăm noul nostru parteneriat cu Clinica Veterinară Locală, oferind îngrijire la preț redus.",
                                },
                                {
                                    id: "event-3",
                                    title: "Orientare pentru Voluntari",
                                    date: "10 August, 2025",
                                    description:
                                        "Ești interesat să ajuți animalele? Participă la orientarea noastră pentru voluntari pentru a afla cum poți face o diferență.",
                                },
                            ].map((event, index) => (
                                <Card key={index} className="flex flex-col h-full">
                                    <CardHeader>
                                        <CardTitle className="text-center">{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center flex-grow">
                                        <p className="text-sm text-gray-500 mb-2 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {event.date}
                                        </p>
                                        <p className="text-sm">{event.description}</p>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-center">
                                        <Button
                                            variant="outline"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => (window.location.href = `/events/${event.id}`)}
                                        >
                                            Vezi mai multe detalii
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
                <section className="w-full py-12 md:py-24 lg:py-32 bg-green-50 flex items-center justify-center">
                    <div className="container px-4 md:px-6">
                        <h2 className="text-3xl font-bold tracking-tighter text-center mb-12">Despre PetPal Adoptions</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Info className="h-5 w-5 text-green-600" />
                                        Misiunea Noastră
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        Ne străduim să găsim cămine iubitoare pentru toate animalele care au nevoie, promovând deținerea
                                        responsabilă de animale de companie și compasiunea pentru toate creaturile.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <PawPrint className="h-5 w-5 text-green-600" />
                                        Procesul de Adopție
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        Procesul nostru de adopție este conceput pentru a asigura cea mai bună potrivire între animale și
                                        noile lor familii. Oferim sprijin la fiecare pas.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 justify-center">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                        Implică-te
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p>
                                        De la voluntariat la găzduire temporară, există multe modalități de a ajuta animalele în nevoie.
                                        Alătură-te comunității noastre de iubitori de animale astăzi!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t py-6 md:py-0 text-center">
                <div className="container flex flex-col gap-4 md:h-24 md:flex-row md:items-center md:justify-center">
                    <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-center">
                        <a href="/public" className="flex items-center gap-2 text-lg font-bold justify-center">
                            <PawPrint className="h-6 w-6" />
                            <span>PetPal Adoptions</span>
                        </a>
                        <p className="text-sm text-gray-500 md:text-base">© 2023 PetPal Adoptions. Toate drepturile rezervate.</p>
                    </div>
                    <nav className="flex gap-4 md:gap-6 justify-center">
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Termeni
                        </a>
                        <a className="text-sm font-medium hover:underline underline-offset-4" href="#">
                            Confidențialitate
                        </a>
                    </nav>
                </div>
            </footer>
        </div>
    )
}