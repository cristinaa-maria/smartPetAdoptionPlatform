
import { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { LogOut, PawPrint, Search, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import { AnimalImage } from "./catalog"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const createAnimalIcon = (animalId) => {
    const sizes = [25, 30, 35, 40]
    const sizeIndex = Number.parseInt(animalId) % sizes.length
    const iconSize = sizes[sizeIndex]

    return new L.Icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616430.png",
        iconSize: [iconSize, iconSize],
        iconAnchor: [iconSize / 2, iconSize],
        popupAnchor: [0, -iconSize],
    })
}

const getAvailableAdoptionTypes = (animal) => {
    if (!animal.typesOfAdoptions && !animal.adoptionTypes) {
        return {
            adoption: true,
            fostering: true,
            distantAdoption: true,
        }
    }

    if (animal.typesOfAdoptions && Array.isArray(animal.typesOfAdoptions)) {
        const adoptionTypes = {
            adoption: false,
            fostering: false,
            distantAdoption: false,
        }
        animal.typesOfAdoptions.forEach((type) => {
            const lowerType = type.toLowerCase()

            if (lowerType.includes("adoptie permanenta") || lowerType.includes("adoptie_permanenta")) {
                adoptionTypes.adoption = true
            }
            if (lowerType.includes("foster")) {
                adoptionTypes.fostering = true
            }
            if (lowerType.includes("adoptie la distanta") || lowerType.includes("adoptie_la_distanta")) {
                adoptionTypes.distantAdoption = true
            }
        })

        return adoptionTypes
    }
    if (animal.adoptionTypes && typeof animal.adoptionTypes === "object") {
        return {
            adoption: animal.adoptionTypes.adoptie_permanenta || animal.adoptionTypes.adoption || false,
            fostering: animal.adoptionTypes.foster || animal.adoptionTypes.fostering || false,
            distantAdoption: animal.adoptionTypes.adoptie_la_distanta || animal.adoptionTypes.distantAdoption || false,
        }
    }

    return {
        adoption: true,
        fostering: true,
        distantAdoption: true,
    }
}

const ShelterMap = () => {
    const [animals, setAnimals] = useState([])
    const [locations, setLocations] = useState({})
    const [userInfo, setUserInfo] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025])
    const [zoomLevel, setZoomLevel] = useState(13)
    const [searchAddress, setSearchAddress] = useState("")
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedAnimal, setSelectedAnimal] = useState(null)
    const [species, setSpecies] = useState("all")
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [userLocation, setUserLocation] = useState(null)
    const [isLocating, setIsLocating] = useState(false)
    const [locationPermission, setLocationPermission] = useState(null)
    const [showLocationNotification, setShowLocationNotification] = useState(false)

    const mapRef = useRef(null)
    const API_BASE_URL = "http://localhost:8083"

    const normalizeSpecies = (species) => {
        if (!species) return species

        const lowerSpecies = species.toLowerCase().trim()

        if (lowerSpecies.includes("catel") || lowerSpecies.includes("dog") || lowerSpecies.includes("caine")) {
            return "Caine"
        }

        if (lowerSpecies.includes("pisica") || lowerSpecies.includes("cat")) {
            return "Pisica"
        }
        return species
    }

    const normalizeUserType = (type) => {
        if (!type) return type

        const lowerType = type.toLowerCase().trim()

        if (
            lowerType.includes("individual") ||
            lowerType.includes("person") ||
            lowerType.includes("persoana") ||
            lowerType.includes("fizica")
        ) {
            return "Persoana individuala"
        }

        if (
            lowerType.includes("shelter") ||
            lowerType.includes("adapost") ||
            lowerType.includes("organizatie") ||
            lowerType.includes("organization")
        ) {
            return "Adapost"
        }

        return type
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
            setLocations((prevLocations) => ({ ...prevLocations, [animalId]: "Locație necunoscută" }))
        }
    }

    const calculateRadius = (zoom) => {
        return Math.max(1, 100 / Math.pow(1.2, zoom - 8))
    }

    const fetchNearbyAnimals = useCallback(
        async (lat, lng, zoom) => {
            if (loading) return

            setLoading(true)
            setError(null)

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
                    setUserInfo({})
                    setLoading(false)
                    setIsInitialLoad(false)
                    return
                }

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
                            userName: userData?.name || null,
                        }))
                    } catch (err) {
                        return []
                    }
                })

                const animalArrays = await Promise.all(animalPromises)
                const allAnimals = animalArrays.flat()
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

                setAnimals(validAnimals)
                const userInfoMap = {}
                validAnimals.forEach((animal) => {
                    if (animal.userName || animal.userType) {
                        userInfoMap[animal.id] = {
                            name: animal.userName,
                            type: animal.userType,
                        }
                    }
                })
                setUserInfo(userInfoMap)
                validAnimals.forEach((animal) => {
                    const [longitude, latitude] = animal.userLocation.coordinates
                    fetchLocation(animal.id, latitude, longitude)
                })
            } catch (err) {
                setError("Nu s-au putut încărca datele. Încercați din nou mai târziu.")
                setAnimals([])
                setLocations({})
                setUserInfo({})
            } finally {
                setLoading(false)
                setIsInitialLoad(false)
            }
        },
        [API_BASE_URL, isInitialLoad, loading],
    )

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation nu este suportat de browser-ul dumneavoastră")
            fetchNearbyAnimals(mapCenter[0], mapCenter[1], zoomLevel)
            return
        }

        if (navigator.permissions) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((result) => {
                    setLocationPermission(result.state)

                    if (result.state === "granted") {
                        getUserLocationSilently()
                    } else if (result.state === "prompt") {
                        setShowLocationNotification(true)
                        setTimeout(() => {
                            getUserLocationWithPrompt()
                        }, 2000)
                    } else {
                        fetchNearbyAnimals(mapCenter[0], mapCenter[1], zoomLevel)
                    }
                })
                .catch(() => {
                    setShowLocationNotification(true)
                    setTimeout(() => {
                        getUserLocationWithPrompt()
                    }, 2000)
                })
        } else {
            setShowLocationNotification(true)
            setTimeout(() => {
                getUserLocationWithPrompt()
            }, 2000)
        }
    }, [])

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

    const filteredAnimals =
        species === "all"
            ? animals
            : animals.filter((animal) => {
                const animalSpecies = animal.species?.toLowerCase() || ""
                const filterSpecies = species.toLowerCase()
                if (filterSpecies === "câine") {
                    return (
                        animalSpecies.includes("câine") ||
                        animalSpecies.includes("catelus") ||
                        animalSpecies.includes("dog") ||
                        animalSpecies.includes("caine")
                    )
                }
                if (filterSpecies === "pisică") {
                    return animalSpecies.includes("pisică") || animalSpecies.includes("pisica") || animalSpecies.includes("cat")
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
            click: (e) => {
                if (e.originalEvent.target.tagName !== "IMG") {
                    setSelectedAnimal(null)
                }
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

    const getPrimaryImage = (animal) => {
        if (animal.images && Array.isArray(animal.images) && animal.images.length > 0) {
            return animal.images[0]
        }
        if (animal.image) {
            return animal.image
        }
        return null
    }

    const getUserLocationSilently = () => {
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation([latitude, longitude])
                setMapCenter([latitude, longitude])
                if (mapRef.current) {
                    mapRef.current.setView([latitude, longitude], 15)
                }
                fetchNearbyAnimals(latitude, longitude, 15)
                setIsLocating(false)
                setShowLocationNotification(false)
            },
            (error) => {
                console.log("Location error:", error.message)
                fetchNearbyAnimals(mapCenter[0], mapCenter[1], zoomLevel)
                setIsLocating(false)
                setShowLocationNotification(false)
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
        )
    }

    const getUserLocationWithPrompt = () => {
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation([latitude, longitude])
                setMapCenter([latitude, longitude])
                if (mapRef.current) {
                    mapRef.current.setView([latitude, longitude], 15)
                }
                fetchNearbyAnimals(latitude, longitude, 15)
                setIsLocating(false)
                setShowLocationNotification(false)
                setLocationPermission("granted")
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationPermission("denied")
                }
                fetchNearbyAnimals(mapCenter[0], mapCenter[1], zoomLevel)
                setIsLocating(false)
                setShowLocationNotification(false)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
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
                                {isLocating && <span className="text-sm text-blue-500">Se localizează...</span>}
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                            )}
                            {showLocationNotification && (
                                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <div>
                                            <p className="font-medium">Permiteți accesul la locație</p>
                                            <p className="text-sm">
                                                Pentru a găsi animale în apropierea dumneavoastră, vă rugăm să permiteți accesul la locație când
                                                vi se solicită.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {locationPermission === "denied" && (
                                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <div>
                                            <p className="font-medium">Locația nu este disponibilă</p>
                                            <p className="text-sm">Puteți căuta manual o adresă sau naviga pe hartă pentru a găsi animale.</p>
                                        </div>
                                    </div>
                                </div>
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
                                {sidebarAnimals.map((animal) => {
                                    const availableAdoptionTypes = getAvailableAdoptionTypes(animal)
                                    const adoptionTypeCount = Object.values(availableAdoptionTypes).filter(Boolean).length
                                    const primaryImage = getPrimaryImage(animal)

                                    return (
                                        <div
                                            key={animal.id}
                                            className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow ${
                                                selectedAnimal?.id === animal.id ? "border-green-500 border-2" : ""
                                            }`}
                                            onClick={() => centerMapOnAnimal(animal)}
                                        >
                                            <div className="w-full h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                                                <AnimalImage
                                                    src={primaryImage}
                                                    alt={animal.name || "Imagine animal"}
                                                    animalName={animal.name}
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                                <p className="text-gray-600 mb-1">Specia: {normalizeSpecies(animal.species)}</p>
                                                <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                                {userInfo[animal.id] && (
                                                    <div className="mb-2">
                                                        <p className="text-gray-600 text-sm">
                                                            <span className="font-medium">Proprietar:</span> {userInfo[animal.id].name}
                                                        </p>
                                                        <p className="text-gray-600 text-sm">
                                                            <span className="font-medium">Tip utilizator:</span>{" "}
                                                            {normalizeUserType(userInfo[animal.id].type)}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="text-gray-600 flex items-center mb-3">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    {locations[animal.id] || "Se încarcă locația..."}
                                                </p>

                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">Tipuri disponibile:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {availableAdoptionTypes.adoption && (
                                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                Adopție
                              </span>
                                                        )}
                                                        {availableAdoptionTypes.fostering && (
                                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Foster</span>
                                                        )}
                                                        {availableAdoptionTypes.distantAdoption && (
                                                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                Adopție la distanță
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 justify-start">
                                                    {availableAdoptionTypes.adoption && (
                                                        <Button
                                                            size="sm"
                                                            className={`bg-green-600 hover:bg-green-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                navigateToAdoption(animal.id)
                                                            }}
                                                        >
                                                            Adopție
                                                        </Button>
                                                    )}
                                                    {availableAdoptionTypes.fostering && (
                                                        <Button
                                                            size="sm"
                                                            className={`bg-blue-600 hover:bg-blue-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                navigateToFostering(animal.id)
                                                            }}
                                                        >
                                                            Foster
                                                        </Button>
                                                    )}
                                                    {availableAdoptionTypes.distantAdoption && (
                                                        <Button
                                                            size="sm"
                                                            className={`bg-purple-600 hover:bg-purple-700 text-sm ${adoptionTypeCount === 2 ? "flex-1" : "w-32"}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                navigateToDistantAdoption(animal.id)
                                                            }}
                                                        >
                                                            Adopție la distanță
                                                        </Button>
                                                    )}
                                                </div>
                                                {adoptionTypeCount === 0 && (
                                                    <div className="text-center py-2">
                                                        <p className="text-sm text-gray-500">Nu sunt disponibile tipuri de adopție</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t text-xs text-gray-500 text-center">
                        Raza de căutare: ~{calculateRadius(zoomLevel).toFixed(1)} km
                    </div>
                </div>
                <div className="flex-grow relative">
                    <MapContainer center={mapCenter} zoom={zoomLevel} className="h-full w-full">
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapController />

                        {mapAnimals.map((animal) => {
                            const [longitude, latitude] = animal.userLocation.coordinates
                            const randomOffset = () => (Math.random() - 0.5) * 0.0001
                            const position = [latitude + randomOffset(), longitude + randomOffset()]
                            const primaryImage = getPrimaryImage(animal)

                            return (
                                <Marker
                                    key={animal.id}
                                    position={position}
                                    icon={createAnimalIcon(animal.id)}
                                    eventHandlers={{
                                        click: (e) => {
                                            e.originalEvent.stopPropagation()
                                            setSelectedAnimal(animal)
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center max-w-xs">
                                            <div className="w-full h-24 bg-gray-50 flex items-center justify-center overflow-hidden mb-2 rounded">
                                                <AnimalImage
                                                    src={primaryImage}
                                                    alt={animal.name || "Imagine animal"}
                                                    animalName={animal.name}
                                                />
                                            </div>
                                            <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                            <p className="text-gray-600 mb-1">Specia: {normalizeSpecies(animal.species)}</p>
                                            <p className="text-gray-600 mb-1">Descrierea: {animal.description}</p>
                                            {userInfo[animal.id] && (
                                                <div className="mb-2">
                                                    <p className="text-gray-600 text-sm">
                                                        <span className="font-medium">Proprietar:</span> {userInfo[animal.id].name}
                                                    </p>
                                                    <p className="text-gray-600 text-sm">
                                                        <span className="font-medium">Tip utilizator:</span>{" "}
                                                        {normalizeUserType(userInfo[animal.id].type)}
                                                    </p>
                                                </div>
                                            )}
                                            <p className="text-gray-600 flex items-center justify-center mb-3">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                {locations[animal.id] || "Se încarcă locația..."}
                                            </p>
                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Tipuri disponibile:</p>
                                                <div className="flex flex-wrap gap-1 justify-center">
                                                    {(() => {
                                                        const availableAdoptionTypes = getAvailableAdoptionTypes(animal)
                                                        return (
                                                            <>
                                                                {availableAdoptionTypes.adoption && (
                                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Adopție
                                  </span>
                                                                )}
                                                                {availableAdoptionTypes.fostering && (
                                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Foster
                                  </span>
                                                                )}
                                                                {availableAdoptionTypes.distantAdoption && (
                                                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                    Adopție la distanță
                                  </span>
                                                                )}
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                                {(() => {
                                                    const availableAdoptionTypes = getAvailableAdoptionTypes(animal)
                                                    const adoptionTypeCount = Object.values(availableAdoptionTypes).filter(Boolean).length

                                                    return (
                                                        <>
                                                            {availableAdoptionTypes.adoption && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => navigateToAdoption(animal.id)}
                                                                >
                                                                    Adopție
                                                                </Button>
                                                            )}
                                                            {availableAdoptionTypes.fostering && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-blue-600 hover:bg-blue-700"
                                                                    onClick={() => navigateToFostering(animal.id)}
                                                                >
                                                                    Foster
                                                                </Button>
                                                            )}
                                                            {availableAdoptionTypes.distantAdoption && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-purple-600 hover:bg-purple-700"
                                                                    onClick={() => navigateToDistantAdoption(animal.id)}
                                                                >
                                                                    Adopție la distanță
                                                                </Button>
                                                            )}
                                                            {adoptionTypeCount === 0 && (
                                                                <p className="text-sm text-gray-500">Nu sunt disponibile tipuri de adopție</p>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        })}
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                icon={
                                    new L.DivIcon({
                                        html: '<div class="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full border-2 border-white"><div class="w-4 h-4 bg-white rounded-full"></div></div>',
                                        className: "user-location-marker",
                                        iconSize: [32, 32],
                                        iconAnchor: [16, 16],
                                    })
                                }
                            >
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-medium">Locația ta curentă</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
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
