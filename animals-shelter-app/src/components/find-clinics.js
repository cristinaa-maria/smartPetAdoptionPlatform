import { useState, useEffect, useCallback, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Search, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import { Card, CardContent } from "./ui/Card"

// Fix Leaflet icon issues
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Replace the current clinic icon with a plain red pin
const clinicIcon = new L.Icon({
    iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// Custom icon for home/fixed position
const homeIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/1946/1946488.png",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
})

// Mock data for clinics
const MOCK_CLINICS = [
    "Clinica Veterinară PetCare",
    "Animal Hospital Dr. Popescu",
    "Centrul Veterinar Anima Vet",
    "Clinica Veterinară Happy Pets",
    "Spitalul Veterinar Bucharest",
    "Cabinet Veterinar Sănătate Animală",
    "Clinica de Urgență Veterinară 24/7",
    "Centrul Medical Veterinar Paws & Claws",
]

// Mock geocoded locations for the clinics
const MOCK_LOCATIONS = {
    "Clinica Veterinară PetCare": {
        latitude: 44.4268,
        longitude: 26.1025,
        address: "Strada Academiei 35, București, România",
    },
    "Animal Hospital Dr. Popescu": {
        latitude: 44.4358,
        longitude: 26.1225,
        address: "Bulevardul Magheru 27, București, România",
    },
    "Centrul Veterinar Anima Vet": {
        latitude: 44.4168,
        longitude: 26.0925,
        address: "Strada Lipscani 43, București, România",
    },
    "Clinica Veterinară Happy Pets": {
        latitude: 44.4468,
        longitude: 26.0825,
        address: "Calea Victoriei 118, București, România",
    },
    "Spitalul Veterinar Bucharest": {
        latitude: 44.4368,
        longitude: 26.1125,
        address: "Bulevardul Carol I 53, București, România",
    },
    "Cabinet Veterinar Sănătate Animală": {
        latitude: 44.4218,
        longitude: 26.0975,
        address: "Strada Doamnei 17-19, București, România",
    },
    "Clinica de Urgență Veterinară 24/7": {
        latitude: 44.4318,
        longitude: 26.1075,
        address: "Strada Ion Câmpineanu 25, București, România",
    },
    "Centrul Medical Veterinar Paws & Claws": {
        latitude: 44.4418,
        longitude: 26.0875,
        address: "Strada Brezoianu 23-25, București, România",
    },
}

// Fixed position for a pin (e.g., your home or current location)
const FIXED_POSITION = {
    latitude: 44.43,
    longitude: 26.1,
    name: "Locația mea",
    address: "Piața Universității, București, România",
}

export default function FindVetClinics() {
    const [searchAddress, setSearchAddress] = useState("")
    const [clinics, setClinics] = useState([])
    const [clinicLocations, setClinicLocations] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]) // București center
    const [zoomLevel, setZoomLevel] = useState(13)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedClinic, setSelectedClinic] = useState(null)
    const [useMockData, setUseMockData] = useState(true)

    const mapRef = useRef(null)
    const API_BASE_URL = "http://localhost:8083"

    const calculateRadius = (zoom) => {
        return Math.max(0.5, 50 / Math.pow(1.5, zoom - 5))
    }

    // Function to geocode clinic names to get their locations
    const geocodeClinicNames = async (clinicNames) => {
        const locations = {}

        for (const name of clinicNames) {
            try {
                // Use OpenStreetMap Nominatim to geocode the clinic name + "veterinar" in the current map area
                const query = `${name} veterinar`
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${
                        mapCenter[1] - 0.1
                    },${mapCenter[0] - 0.1},${mapCenter[1] + 0.1},${mapCenter[0] + 0.1}`,
                )
                const data = await response.json()

                if (data && data.length > 0) {
                    locations[name] = {
                        latitude: Number.parseFloat(data[0].lat),
                        longitude: Number.parseFloat(data[0].lon),
                        address: data[0].display_name,
                    }
                }
            } catch (error) {
                console.error(`Error geocoding clinic "${name}":`, error)
            }
        }

        return locations
    }

    const fetchNearbyClinics = useCallback(
        async (lat, lng, zoom) => {
            setLoading(true)
            setError("")

            try {
                // Check if we should use mock data
                if (useMockData) {
                    console.log("Using mock data for clinics")
                    setClinics(MOCK_CLINICS)
                    setClinicLocations(MOCK_LOCATIONS)
                    setLoading(false)
                    return
                }

                const radius = calculateRadius(zoom)
                console.log(`Searching for clinics with radius: ${radius}km at [${lat}, ${lng}]`)

                const response = await fetch(`${API_BASE_URL}/nearbyClinics`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        latitude: lat,
                        longitude: lng,
                    }),
                    credentials: "include",
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch nearby clinics: ${response.status}`)
                }

                const clinicNames = await response.json()
                console.log("Received clinic names:", clinicNames)

                if (clinicNames && clinicNames.length > 0) {
                    setClinics(clinicNames)

                    // Geocode clinic names to get their locations
                    const locations = await geocodeClinicNames(clinicNames)
                    setClinicLocations(locations)

                    console.log(`Found ${clinicNames.length} clinics:`, clinicNames)
                    console.log("Geocoded locations:", locations)
                } else {
                    // If no clinics found, use mock data
                    console.log("No clinics found, using mock data")
                    setClinics(MOCK_CLINICS)
                    setClinicLocations(MOCK_LOCATIONS)
                }
            } catch (error) {
                console.error("Error fetching nearby clinics:", error)
                setError("A apărut o eroare la căutare. Se afișează date de exemplu.")

                // Use mock data on error
                console.log("Using mock data due to error")
                setClinics(MOCK_CLINICS)
                setClinicLocations(MOCK_LOCATIONS)
            } finally {
                setLoading(false)
            }
        },
        [API_BASE_URL, useMockData],
    )

    useEffect(() => {
        // Fetch clinics when component mounts or map center changes
        fetchNearbyClinics(mapCenter[0], mapCenter[1], zoomLevel)
    }, [fetchNearbyClinics, mapCenter, zoomLevel])

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
                setMapCenter([Number.parseFloat(lat), Number.parseFloat(lon)])
                if (mapRef.current) {
                    mapRef.current.setView([Number.parseFloat(lat), Number.parseFloat(lon)], zoomLevel)
                }
                fetchNearbyClinics(Number.parseFloat(lat), Number.parseFloat(lon), zoomLevel)
            } else {
                setError("Adresa nu a putut fi găsită")
            }
        } catch (err) {
            console.error("Error searching address:", err)
            setError("Eroare la căutarea adresei")
        } finally {
            setLoading(false)
        }
    }

    const MapController = () => {
        const map = useMap()
        mapRef.current = map

        useMapEvents({
            moveend: () => {
                const center = map.getCenter()
                const newCenter = [center.lat, center.lng]
                const newZoom = map.getZoom()

                if (
                    Math.abs(newCenter[0] - mapCenter[0]) > 0.01 ||
                    Math.abs(newCenter[1] - mapCenter[1]) > 0.01 ||
                    newZoom !== zoomLevel
                ) {
                    setMapCenter(newCenter)
                    setZoomLevel(newZoom)
                    fetchNearbyClinics(center.lat, center.lng, newZoom)
                }
            },
            click: () => {
                setSelectedClinic(null)
            },
        })

        return null
    }

    const centerMapOnClinic = (clinicName) => {
        const location = clinicLocations[clinicName]
        if (!location || !location.latitude || !location.longitude) return

        if (mapRef.current) {
            mapRef.current.setView([location.latitude, location.longitude], 15)
        }
        setSelectedClinic(clinicName)
    }

    // Remove the toggleMockData function
    // const toggleMockData = () => {
    //   setUseMockData(!useMockData)
    //   fetchNearbyClinics(mapCenter[0], mapCenter[1], zoomLevel)
    // }

    const centerMapOnFixedPosition = () => {
        if (mapRef.current) {
            mapRef.current.setView([FIXED_POSITION.latitude, FIXED_POSITION.longitude], 15)
        }
        setSelectedClinic(null)
    }

    return (
        <div className="h-screen flex flex-col">
            <header className="border-b bg-white z-10">
                <div className="container flex h-16 items-center px-4">
                    <button className="flex items-center text-lg font-bold" onClick={() => window.history.back()}>
                        <ChevronLeft className="h-6 w-6 text-green-500 mr-2" />
                        PetPal Adopție
                    </button>
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
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-semibold">Rezultate ({clinics.length})</h2>
                                {loading && <span className="text-sm text-gray-500">Se încarcă...</span>}
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                            )}

                            {!loading && clinics.length === 0 && !error && (
                                <div className="text-center py-8">
                                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-500">Nu s-au găsit clinici veterinare în această zonă.</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Încercați să măriți raza de căutare sau să vă deplasați în altă zonă.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {clinics.map((clinicName, index) => (
                                    <Card
                                        key={index}
                                        className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                                            selectedClinic === clinicName ? "border-blue-500 border-2" : ""
                                        }`}
                                        onClick={() => centerMapOnClinic(clinicName)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start">
                                                <MapPin className="h-5 w-5 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg">{clinicName}</h3>
                                                    {clinicLocations[clinicName] && clinicLocations[clinicName].address && (
                                                        <p className="text-gray-600 text-sm mt-1">{clinicLocations[clinicName].address}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
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

                        {/* Fixed position marker */}
                        <Marker
                            position={[FIXED_POSITION.latitude, FIXED_POSITION.longitude]}
                            icon={homeIcon}
                            eventHandlers={{
                                click: () => {
                                    setSelectedClinic(null)
                                },
                            }}
                        >
                            <Popup>
                                <div className="text-center max-w-xs">
                                    <h2 className="text-xl font-semibold mb-2">{FIXED_POSITION.name}</h2>
                                    <p className="text-gray-600 mb-1">{FIXED_POSITION.address}</p>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Clinic markers */}
                        {Object.entries(clinicLocations).map(([clinicName, location], index) => {
                            if (!location || !location.latitude || !location.longitude) return null

                            return (
                                <Marker
                                    key={index}
                                    position={[location.latitude, location.longitude]}
                                    icon={clinicIcon}
                                    eventHandlers={{
                                        click: () => setSelectedClinic(clinicName),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-center max-w-xs">
                                            <h2 className="text-xl font-semibold mb-2">{clinicName}</h2>
                                            {location.address && <p className="text-gray-600 mb-1">{location.address}</p>}
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
