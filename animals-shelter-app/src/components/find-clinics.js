import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Search, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Button from "./ui/Button"
import Input from "./ui/Input"
import { Card, CardContent } from "./ui/Card"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

const clinicIcon = new L.Icon({
    iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const selectedClinicIcon = new L.Icon({
    iconUrl: "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -34],
    shadowSize: [49, 49],
})

export default function FindVetClinics() {
    const [searchAddress, setSearchAddress] = useState("")
    const [clinics, setClinics] = useState([])
    const [clinicLocations, setClinicLocations] = useState({})
    const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]) // București
    const [zoomLevel, setZoomLevel] = useState(13)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [selectedClinic, setSelectedClinic] = useState(null)
    const mapRef = useRef(null)
    const API_BASE_URL = "http://localhost:8083"
    const DEBUG_LARGE_SEARCH = false
    const calculateRadius = (zoom) => {
        return Math.max(5, 200 / Math.pow(1.1, zoom - 8))
    }

    const radiusToLatLngDegrees = (radiusKm) => {
        return radiusKm / 100
    }

    const calculateBoundingBox = (centerLat, centerLng, radiusKm) => {
        const radiusDegrees = radiusToLatLngDegrees(radiusKm)

        return {
            latMin: centerLat - radiusDegrees,
            latMax: centerLat + radiusDegrees,
            lonMin: centerLng - radiusDegrees,
            lonMax: centerLng + radiusDegrees,
        }
    }

    const geocodeClinicNames = async (clinicNames) => {
        const locations = {}
        const total = clinicNames.length
        const BATCH_SIZE = 3
        const DELAY_BETWEEN_BATCHES = 800


        setGeocodingProgress({ current: 0, total })
        for (let i = 0; i < clinicNames.length; i += BATCH_SIZE) {
            const batch = clinicNames.slice(i, i + BATCH_SIZE)
            const batchPromises = batch.map(async (name, batchIndex) => {
                const globalIndex = i + batchIndex

                try {
                    console.log(`Geocoding clinic ${globalIndex + 1}/${total}: "${name}"`)
                    let response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&countrycodes=ro&limit=3`,
                    )
                    let data = await response.json()
                    if (!data || data.length === 0) {
                        response = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name + " veterinar")}&countrycodes=ro&limit=3`,
                        )
                        data = await response.json()
                    }

                    if (data && data.length > 0) {
                        const result = data[0]
                        const lat = Number.parseFloat(result.lat)
                        const lng = Number.parseFloat(result.lon)
                        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                            const location = {
                                latitude: lat,
                                longitude: lng,
                                address: result.display_name,
                            }
                            setClinicLocations((prev) => ({
                                ...prev,
                                [name]: location,
                            }))

                            return { name, location }
                        } else {
                            throw new Error("Invalid coordinates")
                        }
                    } else {
                        throw new Error("No geocoding results")
                    }
                } catch (error) {
                    const randomOffset = () => (Math.random() - 0.5) * 0.02
                    const fallbackLocation = {
                        latitude: 44.4268 + randomOffset(),
                        longitude: 26.1025 + randomOffset(),
                        address: name + " (locație aproximativă)",
                    }
                    setClinicLocations((prev) => ({
                        ...prev,
                        [name]: fallbackLocation,
                    }))

                    console.log(`⚠ Using fallback location for "${name}"`)
                    return { name, location: fallbackLocation }
                }
            })
            const batchResults = await Promise.allSettled(batchPromises)
            const completedCount = Math.min(i + BATCH_SIZE, total)
            setGeocodingProgress({ current: completedCount, total })
            if (i + BATCH_SIZE < clinicNames.length) {
                await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
            }
        }

        setGeocodingProgress({ current: 0, total: 0 })
        console.log(`Optimized geocoding complete: ${Object.keys(locations).length}/${total} locations processed`)
        return locations
    }

    const fetchNearbyClinics = useCallback(
        async (lat, lng, zoom = zoomLevel) => {
            setLoading(true)
            setError("")
            setSelectedClinic(null)

            try {
                let bounds
                if (mapRef.current) {
                    const mapBounds = mapRef.current.getBounds()
                    bounds = {
                        latMin: mapBounds.getSouth(),
                        latMax: mapBounds.getNorth(),
                        lonMin: mapBounds.getWest(),
                        lonMax: mapBounds.getEast(),
                    }
                } else {
                    const radiusKm = calculateRadius(zoom)
                    bounds = calculateBoundingBox(lat, lng, radiusKm)
                }


                const requestBody = {
                    latMin: bounds.latMin,
                    latMax: bounds.latMax,
                    lonMin: bounds.lonMin,
                    lonMax: bounds.lonMax,
                    query: "veterinar",
                }


                const response = await fetch(`${API_BASE_URL}/nearbyClinics`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                    credentials: "include",
                })

                if (!response.ok) {
                    let errorMessage = `Failed to fetch nearby clinics: ${response.status}`
                    try {
                        const errorData = await response.json()
                        errorMessage = errorData?.message || errorData?.[0] || errorMessage
                    } catch (e) {
                    }
                    throw new Error(errorMessage)
                }

                const clinicNames = await response.json()
                if (clinicNames.some((name) => name.toLowerCase().includes("eroare"))) {
                    console.warn("API returned error messages:", clinicNames)
                    setError("Serviciul de căutare clinici nu este disponibil momentan.")
                    setClinics([])
                    setClinicLocations({})
                    return
                }

                if (clinicNames && clinicNames.length > 0) {
                    setClinics(clinicNames)
                    setClinicLocations({})
                    geocodeClinicNames(clinicNames)
                } else {
                    setClinics([])
                    setClinicLocations({})
                }
            } catch (error) {
                setError(`A apărut o eroare la căutare: ${error.message || error}.`)
                setClinics([])
                setClinicLocations({})
            } finally {
                setLoading(false)
            }
        },
        [API_BASE_URL, zoomLevel],
    )
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId
            return (lat, lng, zoom) => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(() => {
                    fetchNearbyClinics(lat, lng, zoom)
                }, 500)
            }
        })(),
        [fetchNearbyClinics],
    )

    useEffect(() => {
        debouncedSearch(mapCenter[0], mapCenter[1], zoomLevel)
    }, [debouncedSearch, mapCenter, zoomLevel])

    const searchByAddress = async (e) => {
        e.preventDefault()
        if (!searchAddress.trim()) return

        setLoading(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&countrycodes=ro`,
            )
            const data = await response.json()

            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                const newLat = Number.parseFloat(lat)
                const newLng = Number.parseFloat(lon)

                if (!isNaN(newLat) && !isNaN(newLng)) {
                    setMapCenter([newLat, newLng])
                    if (mapRef.current) {
                        mapRef.current.setView([newLat, newLng], zoomLevel)
                    }
                    fetchNearbyClinics(newLat, newLng, zoomLevel)
                } else {
                    setError("Coordonate invalide pentru adresa specificată")
                }
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
                    Math.abs(newCenter[0] - mapCenter[0]) > 0.005 ||
                    Math.abs(newCenter[1] - mapCenter[1]) > 0.005 ||
                    newZoom !== zoomLevel
                ) {
                    setMapCenter(newCenter)
                    setZoomLevel(newZoom)
                }
            },
            zoomend: () => {
                const center = map.getCenter()
                const newZoom = map.getZoom()
                setZoomLevel(newZoom)
                fetchNearbyClinics(center.lat, center.lng, newZoom)
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

        const lat = Number(location.latitude)
        const lng = Number(location.longitude)

        if (!isNaN(lat) && !isNaN(lng)) {
            if (mapRef.current) {
                mapRef.current.setView([lat, lng], 15)
            }
            setSelectedClinic(clinicName)
        }
    }

    const handleMarkerClick = (clinicName) => {
        setSelectedClinic(clinicName)
        const clinicElement = document.getElementById(`clinic-card-${clinicName}`)
        if (clinicElement) {
            clinicElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    }

    const clinicMarkers = useMemo(() => {
        return Object.entries(clinicLocations).map(([clinicName, location]) => {
            const isSelected = selectedClinic === clinicName
            return {
                key: clinicName,
                clinicName: clinicName,
                position: [location.latitude, location.longitude],
                location: location,
                isSelected: isSelected,
            }
        })
    }, [clinicLocations, selectedClinic])

    return (
        <div className="h-screen flex flex-col">
            <header className="border-b bg-white z-10">
                <div className="container flex h-16 items-center justify-between px-4">
                    <div className="flex items-center">
                        <button
                            className="mr-3 p-2 rounded-full hover:bg-teal-50 transition-colors flex items-center"
                            onClick={() => window.history.back()}
                            title="Înapoi"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                                <path
                                    d="M19 12H5M12 19L5 12L12 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        <button
                            className="mr-2 p-2 rounded-full hover:bg-gray-100 lg:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <h1 className="text-xl font-bold">Găsește Clinici Veterinare în apropiere</h1>
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
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-semibold">
                                    Rezultate ({clinics.length})
                                    {clinicMarkers.length !== clinics.length && clinics.length > 0 && (
                                        <span className="text-sm text-gray-500 ml-1">({clinicMarkers.length} pe hartă)</span>
                                    )}
                                </h2>
                                {loading && <span className="text-sm text-gray-500">Se încarcă...</span>}
                            </div>

                            {geocodingProgress.total > 0 && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        <span className="text-sm text-blue-700">
                      Localizez clinicile: {geocodingProgress.current}/{geocodingProgress.total}
                    </span>
                                    </div>
                                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
                            )}

                            {!loading && clinics.length === 0 && !error && (
                                <div className="text-center py-8">
                                    <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                                    <p className="text-gray-500">Nu s-au găsit clinici veterinare în această zonă.</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Încercați să căutați o altă adresă sau să vă deplasați pe hartă.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {clinics.map((clinicName, index) => {
                                    const hasLocation = clinicLocations[clinicName]
                                    const isSelected = selectedClinic === clinicName

                                    return (
                                        <Card
                                            key={`clinic-${index}-${clinicName}`}
                                            id={`clinic-card-${clinicName}`}
                                            className={`overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 ${
                                                isSelected ? "border-blue-500 border-2 bg-blue-50" : ""
                                            } ${!hasLocation ? "opacity-60" : ""}`}
                                            onClick={() => centerMapOnClinic(clinicName)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start">
                                                    <div className="flex items-center mr-2 mt-0.5">
                                                        {hasLocation ? (
                                                            <MapPin
                                                                className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-red-500"}`}
                                                            />
                                                        ) : (
                                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className={`font-bold text-lg ${isSelected ? "text-blue-700" : ""}`}>{clinicName}</h3>
                                                        {hasLocation && hasLocation.address && (
                                                            <p className="text-gray-600 text-sm mt-1">{hasLocation.address}</p>
                                                        )}
                                                        {hasLocation && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Lat: {hasLocation.latitude?.toFixed(4)}, Lng: {hasLocation.longitude?.toFixed(4)}
                                                            </p>
                                                        )}
                                                        {!hasLocation && <p className="text-xs text-gray-400 mt-1">Se localizează...</p>}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t text-xs text-gray-500 text-center">
                        Raza de căutare: {calculateRadius(zoomLevel).toFixed(1)} km | Pinuri: {clinicMarkers.length}
                    </div>
                </div>

                <div className="flex-grow relative">
                    <MapContainer
                        center={mapCenter}
                        zoom={zoomLevel}
                        className="h-full w-full"
                        key="map-container" // Stable key to prevent remounting
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <MapController />
                        {clinicMarkers.map((marker) => (
                            <Marker
                                key={marker.key}
                                position={marker.position}
                                icon={marker.isSelected ? selectedClinicIcon : clinicIcon}
                                eventHandlers={{
                                    click: () => handleMarkerClick(marker.clinicName),
                                }}
                            >
                                <Popup>
                                    <div className="text-center max-w-xs">
                                        <h2 className="text-xl font-semibold mb-2">{marker.clinicName}</h2>
                                        {marker.location.address && <p className="text-gray-600 mb-1">{marker.location.address}</p>}
                                        <p className="text-xs text-gray-500">
                                            {marker.location.latitude?.toFixed(4)}, {marker.location.longitude?.toFixed(4)}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
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
