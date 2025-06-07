import { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { LogOut, PawPrint, Search, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Remove the single animalIcon constant and replace with this function
const createAnimalIcon = (animalId) => {
    // Create different sizes based on animal ID to ensure consistency
    const sizes = [25, 30, 35, 40] // Different icon sizes
    const sizeIndex = Number.parseInt(animalId) % sizes.length
    const iconSize = sizes[sizeIndex]

    return new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616430.png",
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize],
        popupAnchor: [0, -iconSize],
    })
}

const ShelterMap = () => {
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]) // București
    const [zoomLevel, setZoomLevel] = useState(13)
    const [searchAddress, setSearchAddress] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedAnimal, setSelectedAnimal] = useState(null)
    const [species, setSpecies] = useState("all")
    const [isInitialLoad, setIsInitialLoad] = useState(true)

    const mapRef = useRef(null)
    const API_BASE_URL = "http://localhost:8083"

    const fetchLocation = async (animalId, latitude, longitude) => {
        try {
            const response = await fetch(`${API_BASE_URL}/reverse-geocode?latitude=${latitude}&longitude=${longitude}`)
            if (!response.ok) {
                throw new Error("Failed to fetch location")
            }
            const address = await response.text()
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: address }))
        } catch (error) {
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație necunoscută" }))
        }
    }

    const calculateRadius = (zoom) => {
        // Invert the logic: lower zoom = larger radius, higher zoom = smaller radius
        // This makes sense because when zoomed out, you want to see animals in a larger area
        return Math.max(1, 100 / Math.pow(1.2, zoom - 8))
    }

    const fetchNearbyAnimals = useCallback(
        async (lat, lng, zoom) => {
            setLoading(true)
            setError(null)

            if (!isInitialLoad) {
                setAnimals([])
                setLocations({})
            }

            try {
                const radius = calculateRadius(zoom)
                const nearbyResponse = await fetch(`${API_BASE_URL}/nearby`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: lat, longitude: lng, radius: radius }),
                    credentials: "include",
                })

                if (!nearbyResponse.ok) {
                    throw new Error(`Failed to fetch nearby users: ${nearbyResponse.status}`)
                }

                const userIds = await nearbyResponse.json()

                if (userIds.length === 0) {
                    setAnimals([])
                    setLocations({})
                    setLoading(false)
                    setIsInitialLoad(false)
                    return
                }

                // Fetch all animals and user data in parallel
                const animalPromises = userIds.map(async (userId) => {
                    try {
                        const [animalResponse, userResponse] = await Promise.all([
                            fetch(`${API_BASE_URL}/animalCatalog?userId=${userId}`, {
                                method: "GET",
                                credentials: "include",
                            }),
                            fetch(`${API_BASE_URL}/users/${userId}`),
                        ])

                        let userAnimals = []
                        let userData = null

                        if (animalResponse.ok) {
                            userAnimals = await animalResponse.json()
                        }

                        if (userResponse.ok) {
                            userData = await userResponse.json()
                        }

                        return userAnimals.map((animal) => ({
                            ...animal,
                            userLocation: userData?.location || null,
                            userContact: userData?.contact || null,
                            userType: userData?.type || null,
                        }))
                    } catch (err) {
                        return []
                    }
                })

                const animalArrays = await Promise.all(animalPromises)
                const allAnimals = animalArrays.flat()

                // Validare animale cu coordonate valide (doar acestea rămân)
                const validAnimals = allAnimals.filter((animal) => {
                    const hasValidLocation =
                        animal.userLocation &&
                        animal.userLocation.coordinates &&
                        Array.isArray(animal.userLocation.coordinates) &&
                        animal.userLocation.coordinates.length === 2 &&
                        typeof animal.userLocation.coordinates[0] === "number" &&
                        typeof animal.userLocation.coordinates[1] === "number" &&
                        !isNaN(animal.userLocation.coordinates[0]) &&
                        !isNaN(animal.userLocation.coordinates[1])
                    return hasValidLocation
                })

                // --- MODIFICARE IMPORTANTĂ ---
                // Setează animalele imediat (pinii și lista apar instant)
                setAnimals(validAnimals)

                // Fetch location pentru adrese în background (nu mai aștepți la Promise.all)
                validAnimals.forEach((animal) => {
                    const [longitude, latitude] = animal.userLocation.coordinates
                    fetchLocation(animal.id, latitude, longitude)
                })
            } catch (err) {
                setError("Nu s-au putut încărca datele. Încercați din nou mai târziu.")
                setAnimals([])
                setLocations({})
            } finally {
                setLoading(false)
                setIsInitialLoad(false)
            }
        },
        [API_BASE_URL, isInitialLoad],
    )

    useEffect(() => {
        fetchNearbyAnimals(mapCenter[0], mapCenter[1], zoomLevel)
        // eslint-disable-next-line
    }, []) // Only run once on mount

    const handleMapChange = useCallback(
        (newCenter, newZoom) => {
            if (!isInitialLoad) {
                fetchNearbyAnimals(newCenter[0], newCenter[1], newZoom)
            }
        },
        [fetchNearbyAnimals, isInitialLoad],
    )

    const searchByAddress = async (e) => {
        e.preventDefault()
        if (!searchAddress.trim()) return

        setLoading(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`,
            )
            const data = await response.json()

            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                const newCenter = [Number.parseFloat(lat), Number.parseFloat(lon)]
                setMapCenter(newCenter)
                if (mapRef.current) {
                    mapRef.current.setView(newCenter, zoomLevel)
                }
                fetchNearbyAnimals(Number.parseFloat(lat), Number.parseFloat(lon), zoomLevel)
            } else {
                setError("Adresa nu a putut fi găsită")
            }
        } catch (err) {
            setError("Eroare la căutarea adresei")
        } finally {
            setLoading(false)
        }
    }

    // Filtrare specii (toate animalele au coordonate valide)
    const filteredAnimals =
        species === "all"
            ? animals
            : animals.filter((animal) => {
                const animalSpecies = animal.species?.toLowerCase() || ""
                const filterSpecies = species.toLowerCase()
                if (filterSpecies === "câine") {
                    return animalSpecies.includes("câine") || animalSpecies.includes("catelus") || animalSpecies.includes("dog")
                }
                return animalSpecies.includes(filterSpecies)
            })

    const sidebarAnimals = filteredAnimals
    const mapAnimals = filteredAnimals

    const MapController = () => {
        const map = useMap()
        mapRef.current = map

        useMapEvents({
            moveend: () => {
                const center = map.getCenter()
                const newCenter = [center.lat, center.lng]
                const newZoom = map.getZoom()
                if (
                    !isInitialLoad &&
                    (Math.abs(newCenter[0] - mapCenter[0]) > 0.01 ||
                        Math.abs(newCenter[1] - mapCenter[1]) > 0.01 ||
                        newZoom !== zoomLevel)
                ) {
                    setMapCenter(newCenter)
                    setZoomLevel(newZoom)
                    handleMapChange(newCenter, newZoom)
                }
            },
            click: () => {
                setSelectedAnimal(null)
            },
        })

        return null
    }

    const centerMapOnAnimal = (animal) => {
        if (!animal.userLocation || !animal.userLocation.coordinates) return
        const [lng, lat] = animal.userLocation.coordinates
        if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15)
        }
        setSelectedAnimal(animal)
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
        <div className="h-screen flex flex-col">
            <header className="border-b bg-white z-10">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center">
                        <button
                            className="mr-2 p-2 rounded-full hover:bg-gray-100 lg:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600" />
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                    </div>
                    <div className="hidden md:flex gap-6 items-center">
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/home">
                            Acasă
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/adoption">
                            Adoptă acum
                        </a>
                        <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/editor_catalog">
                            Adaugă anunț adopție
                        </a>
                        <button
                            className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                            onClick={() => (window.location.href = "/login")}
                        >
                            <LogOut className="h-4 w-4" />
                            Deconectare
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div
                    className={`${
                        sidebarOpen ? "w-full lg:w-96" : "w-0"
                    } bg-white border-r overflow-hidden transition-all duration-300 flex flex-col`}
                >
                    <div className="p-4 border-b">
                        <form onSubmit={searchByAddress} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Caută o adresă..."
                                value={searchAddress}
                                onChange={(e) => setSearchAddress(e.target.value)}
                                className="flex-grow"
                            />
                            <Button type="submit" disabled={loading} className="px-3">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>

                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            <Button
                                variant={species === "all" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpecies("all")}
                                className="whitespace-nowrap"
                            >
                                Toate
                            </Button>
                            <Button
                                variant={species === "câine" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpecies("câine")}
                                className="whitespace-nowrap"
                            >
                                Câini
                            </Button>
                            <Button
                                variant={species === "pisică" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpecies("pisică")}
                                className="whitespace-nowrap"
                            >
                                Pisici
                            </Button>
                            <Button
                                variant={species === "pasăre" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSpecies("pasăre")}
                                className="whitespace-nowrap"
                            >
                                Păsări
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-semibold">Rezultate ({sidebarAnimals.length})</h2>
                                {loading && <span className="text-sm text-gray-500">Se încarcă...</span>}
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                            )}

                            {!loading && sidebarAnimals.length === 0 && !isInitialLoad && (
                                <div className="text-center py-8">
                                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-500">Nu s-au găsit animale în această zonă.</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Încercați să măriți raza de căutare sau să vă deplasați în altă zonă.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {sidebarAnimals.map((animal) => (
                                    <div
                                        key={animal.id}
                                        className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
                                            selectedAnimal?.id === animal.id ? "border-green-500 border-2" : ""
                                        }`}
                                        onClick={() => centerMapOnAnimal(animal)}
                                    >
                                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                            {animal.image ? (
                                                <img
                                                    src={animal.image || "/placeholder.svg"}
                                                    alt={animal.name}
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = "/placeholder.svg?height=128&width=200"
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
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigateToAdoption(animal.id)
                                                    }}
                                                >
                                                    Adopție
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigateToFostering(animal.id)
                                                    }}
                                                >
                                                    Foster
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigateToDistantAdoption(animal.id)
                                                    }}
                                                >
                                                    Adopție la distanță
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t text-xs text-gray-500 text-center">
                        Raza de căutare: ~{calculateRadius(zoomLevel).toFixed(1)} km
                    </div>
                </div>

                {/* Map container */}
                <div className="flex-grow relative">
                    <MapContainer center={mapCenter} zoom={zoomLevel} className="h-full w-full">
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapController />

                        {mapAnimals.map((animal) => {
                            const [longitude, latitude] = animal.userLocation.coordinates
                            // Add a tiny random offset to each marker's position (±0.00005 degrees, approximately ±5 meters)
                            const randomOffset = () => (Math.random() - 0.5) * 0.0001
                            const position = [latitude + randomOffset(), longitude + randomOffset()]

                            return (
                                <Marker
                                    key={animal.id}
                                    position={position}
                                    icon={createAnimalIcon(animal.id)}
                                    eventHandlers={{
                                        click: () => setSelectedAnimal(animal),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center max-w-xs">
                                            {animal.image && (
                                                <img
                                                    src={animal.image || "/placeholder.svg"}
                                                    alt={animal.name}
                                                    className="w-full h-24 object-cover mb-2 rounded"
                                                    onError={(e) => {
                                                        e.target.src = "/placeholder.svg?height=96&width=200"
                                                    }}
                                                />
                                            )}
                                            <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                            <p className="text-gray-600 mb-1">Specia: {animal.species}</p>
                                            <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                            <p className="text-gray-600 flex items-center justify-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {locations[animal.id] || "Se încarcă locația..."}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-4 justify-center">
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
                                    </Popup>
                                </Marker>
                            )
                        })}
                    </MapContainer>

                    <button
                        className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-full shadow-md lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShelterMap
