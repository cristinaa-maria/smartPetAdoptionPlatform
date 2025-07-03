import { useState, useEffect, useCallback } from "react"
import Button from "./ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/Card"
import { PawPrint, Calendar, Info, LogOut, ArrowRight, Bell, Clock, Menu, X } from "lucide-react"

const useCustomNavigation = () => {
    const navigate = useCallback((path) => {
        window.location.href = path
    }, [])

    return { navigate }
}

export default function Homepage() {
    const { navigate } = useCustomNavigation()
    const [showNotifications, setShowNotifications] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
            read: true,
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
            read: true,
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
            read: true,
        },
        {
            id: 4,
            type: "vet_reminder",
            petId: "2",
            petName: "Luna",
            message: "Luna are nevoie de o vizită la veterinar. Programează acum!",
            date: "Acum 2 zile",
            read: true,
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
            console.log(`Accepting request ${requestId}`)

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
            console.log(`Declining request ${requestId}`)
            setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        } catch (error) {
            console.error("Error declining request:", error)
        }
    }

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id)

        if (notification.type === "adoption_request") {
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
            if (mobileMenuOpen && !event.target.closest(".mobile-menu-container")) {
                setMobileMenuOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [showNotifications, mobileMenuOpen])

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

                        <div className="flex flex-wrap gap-2 mt-2">
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
                                    const url = `/notification/${notification.requestId}?notificationId=${notification.id}`
                                    console.log("Navigating to:", url)
                                    window.location.href = url
                                }}
                                className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
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
                        <span className="text-lg sm:text-xl font-bold">PetPal Adoptions</span>
                    </a>

                    <nav className="hidden lg:flex gap-4 xl:gap-6 items-center">
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
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                            onClick={() => {
                                console.log("Logging out")
                                window.location.href = "/login"
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden xl:inline">Deconectare</span>
                        </button>
                    </nav>

                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="relative">
                            <button
                                className="flex items-center justify-center text-gray-700 hover:text-green-600 transition-colors p-2"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-md shadow-lg z-50 py-1 border notification-container">
                                    <div className="p-2 border-b flex justify-between items-center">
                                        <h3 className="font-semibold text-sm">Notificări</h3>
                                        {unreadCount > 0 && (
                                            <button className="text-xs text-green-600 hover:text-green-700" onClick={markAllAsRead}>
                                                Marchează toate
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 text-sm">Nu ai notificări</div>
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
                                            Vezi toate
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="p-2 text-gray-700 hover:text-green-600 transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="lg:hidden border-t bg-white mobile-menu-container">
                        <nav className="flex flex-col p-4 space-y-3">
                            <a className="text-sm font-medium hover:text-green-600 transition-colors py-2" href="#">
                                Acasă
                            </a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors py-2" href="/adoption">
                                Adoptă acum
                            </a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors py-2" href="/editor_catalog">
                                Adaugă anunț adopție
                            </a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors py-2" href="/info">
                                ÎntreabăPetPal
                            </a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors py-2" href="/community">
                                Alătură-te comunității
                            </a>
                            <button
                                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors py-2 text-left"
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
                )}
            </header>

            <main className="flex-1">
                <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-green-400 via-green-500 to-green-600 flex items-center justify-center">
                    <div className="container px-4 sm:px-6 md:px-8">
                        <div className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
                                    Prietenie pe viață? Începe aici!
                                </h1>
                            </div>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-sm sm:text-base px-6 py-2 sm:px-8 sm:py-3"
                                onClick={() => (window.location.href = "/adoption")}
                            >
                                Adoptă acum
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 flex items-center justify-center">
                    <div className="container px-4 sm:px-6 md:px-8">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
                            Ultimele postări și evenimente
                        </h2>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-center text-lg sm:text-xl">{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center flex-grow px-4 sm:px-6">
                                        <p className="text-sm text-gray-500 mb-2 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {event.date}
                                        </p>
                                        <p className="text-sm">{event.description}</p>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-center px-4 sm:px-6">
                                        <Button
                                            variant="outline"
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 text-sm flex items-center gap-2 whitespace-nowrap"
                                            onClick={() => (window.location.href = `/community?event=${event.id}`)}
                                        >
                                            <span>Vezi mai multe detalii</span>
                                            <ArrowRight className="h-4 w-4 flex-shrink-0" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="w-full py-8 sm:py-12 md:py-16 lg:py-20 xl:py-32 bg-green-50 flex items-center justify-center">
                    <div className="container px-4 sm:px-6 md:px-8">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-center mb-8 sm:mb-12">
                            Despre PetPal Adoptions
                        </h2>
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="text-center">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 justify-center text-lg">
                                        <Info className="h-5 w-5 text-green-600" />
                                        Misiunea Noastră
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center px-4 sm:px-6">
                                    <p className="text-sm sm:text-base">
                                        Ne străduim să găsim cămine iubitoare pentru toate animalele care au nevoie, promovând deținerea
                                        responsabilă de animale de companie și compasiunea pentru toate creaturile.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 justify-center text-lg">
                                        <PawPrint className="h-5 w-5 text-green-600" />
                                        Procesul de Adopție
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center px-4 sm:px-6">
                                    <p className="text-sm sm:text-base">
                                        Procesul nostru de adopție este conceput pentru a asigura cea mai bună potrivire între animale și
                                        noile lor familii. Oferim sprijin la fiecare pas.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="text-center">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 justify-center text-lg">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                        Implică-te
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center px-4 sm:px-6">
                                    <p className="text-sm sm:text-base">
                                        De la voluntariat la găzduire temporară, există multe modalități de a ajuta animalele în nevoie.
                                        Alătură-te comunității noastre de iubitori de animale astăzi!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t py-4 sm:py-6 md:py-0 text-center">
                <div className="container flex flex-col gap-4 md:h-24 md:flex-row md:items-center md:justify-center px-4">
                    <div className="flex flex-col gap-4 md:flex-row md:gap-6 md:items-center">
                        <a href="/public" className="flex items-center gap-2 text-lg font-bold justify-center">
                            <PawPrint className="h-6 w-6" />
                            <span>PetPal Adoptions</span>
                        </a>
                        <p className="text-xs sm:text-sm text-gray-500 md:text-base">
                            © 2025 PetPal Adoptions. Toate drepturile rezervate.
                        </p>
                    </div>
                    <nav className="flex gap-4 md:gap-6 justify-center">
                        <a className="text-xs sm:text-sm font-medium hover:underline underline-offset-4" href="#">
                            Termeni
                        </a>
                        <a className="text-xs sm:text-sm font-medium hover:underline underline-offset-4" href="#">
                            Confidențialitate
                        </a>
                    </nav>
                </div>
            </footer>
        </div>
    )
}
