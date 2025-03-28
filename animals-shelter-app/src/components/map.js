import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PawPrint } from "lucide-react";
import axios from "axios";

const customIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const ShelterMap = () => {
    const [shelters, setShelters] = useState([]);
    const [selectedShelter, setSelectedShelter] = useState(null);
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]);

    useEffect(() => {
        axios.get("http://localhost:8083/api/locations")
            .then(response => {
                setShelters(response.data);

                if (response.data.length > 0) {
                    setMapCenter([response.data[0].coordinates[1], response.data[0].coordinates[0]]);
                }
            })
            .catch(error => console.error("Eroare la preluarea locațiilor:", error));
    }, []);

    return (
        <div className="flex h-screen">
            <div className="w-3/4 h-full">
                <header className="border-b mb-8">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600"/>
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                        <nav className="flex gap-6">
                            <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/home">Acasă</a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/adoption">Adoptă acum</a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/editor_catalog">Adaugă anunț adopție</a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/info">ÎntreabăPetPal</a>
                            <a className="text-sm font-medium hover:text-green-600 transition-colors" href="/community">Alătură-te comunității</a>
                        </nav>
                    </div>
                </header>

                <MapContainer center={mapCenter} zoom={10} className="h-full w-full">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {shelters.map((shelter) => (
                        <Marker
                            key={shelter.id}
                            position={[shelter.coordinates[1], shelter.coordinates[0]]}
                            icon={customIcon}
                            eventHandlers={{click: () => setSelectedShelter(shelter)}}
                        >
                            <Popup>{shelter.name}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Sidebar Section */}
            <div className="w-1/4 bg-gray-100 p-4">
                <h2 className="text-xl font-bold mb-4">Shelter Details</h2>
                {shelters.map((shelter) => (
                    <div key={shelter.id} className="bg-white p-4 mb-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">{shelter.name}</h3>
                        <p className="text-sm text-gray-600">{shelter.address}</p>
                        <p className="text-sm text-gray-600">Open: {shelter.hours}</p>
                        <button
                            onClick={() => {
                                setSelectedShelter(shelter);
                                setMapCenter([shelter.coordinates[1], shelter.coordinates[0]]); // Mutăm harta pe această locație
                            }}
                            className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg"
                        >
                            View on Map
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShelterMap;
