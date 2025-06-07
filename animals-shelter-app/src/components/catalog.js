import { useState, useEffect } from "react"
import { PawPrint, MapPin, LogOut } from "lucide-react"
import Button from "./ui/Button"

const Catalog = () => {
    const [viewMode, setViewMode] = useState("catalog")
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const API_BASE_URL = "http://localhost:8083"

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/allAnimals`)
                if (!response.ok) {
                    throw new Error("Network response was not ok")
                }
                const data = await response.json()

                // Animals now have simple image URLs, no processing needed
                setAnimals(data)

                // For each animal, get the associated user's location
                data.forEach((animal) => {
                    if (animal.userId) {
                        fetchUserLocation(animal.id, animal.userId)
                    }
                })
            } catch (error) {
                console.error("Error fetching animals:", error)
            }
        }

        fetchAnimals()
    }, [])

    const fetchUserLocation = async (animalId, userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`)
            if (!response.ok) {
                throw new Error("Failed to fetch user data")
            }
            const userData = await response.json()

            if (userData.location && userData.location.coordinates) {
                const [longitude, latitude] = userData.location.coordinates
                fetchLocation(animalId, latitude, longitude)
            }
        } catch (error) {
            console.error(`Error fetching user location for ${userId}:`, error)
        }
    }

    const fetchLocation = async (animalId, latitude, longitude) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`)
            if (!response.ok) {
                throw new Error("Failed to fetch location")
            }
            const address = await response.text()
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: address }))
        } catch (error) {
            console.error("Error fetching location:", error)
        }
    }

    const navigateToAdoption = (animalId) => {
        window.location.href = `/book-adoption?animalId=${animalId}`
    }

    const navigateToFostering = (animalId) => {
        window.location.href = `/fostering?animalId=${animalId}`
    }

    const navigateToDistantAdoption = (animalId) => {
        window.location.href = `/distantAdoption?animalId=${animalId}`
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="border-b mb-8">
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
            <h1 className="text-3xl font-bold mb-6 text-center">Animale disponibile</h1>

            <div className="flex items-center justify-center space-x-4 mb-6">
                <Button onClick={() => (window.location.href = "/map")}>Hartă</Button>
            </div>

            {viewMode === "catalog" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {animals.map((animal) => (
                        <div
                            key={animal.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            {/* Simplified image display */}
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                {animal.image ? (
                                    <img
                                        src={animal.image || "/placeholder.svg"}
                                        alt={animal.name}
                                        className="w-full h-48 object-cover"
                                        onError={(e) => {
                                            e.target.src = "/placeholder.svg?height=192&width=300"
                                        }}
                                    />
                                ) : (
                                    <div className="text-gray-400">Fără imagine</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                <p className="text-gray-600 mb-1">Specia: {animal.species}</p>
                                <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                <p className="text-gray-600 flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {locations[animal.id] || "Se încarcă locația..."}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => navigateToAdoption(animal.id)}
                                    >
                                        Adopție
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => navigateToFostering(animal.id)}
                                    >
                                        Foster
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700"
                                        onClick={() => navigateToDistantAdoption(animal.id)}
                                    >
                                        Adopție la distanță
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-xl font-semibold">Map View (Implement Google Maps or similar here)</p>
                </div>
            )}
        </div>
    )
}

export default Catalog
