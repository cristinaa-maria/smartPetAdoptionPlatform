import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { PawPrint } from "lucide-react";
import axios from "axios";

const userIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

const ShelterMap = () => {
    const [shelters, setShelters] = useState([]);
    const [users, setUsers] = useState([]);
    const [mapCenter, setMapCenter] = useState([44.4268, 26.1025]);
    const [zoomLevel, setZoomLevel] = useState(12); // Zoom inițial

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

    // Calculăm raza bazată pe zoom
    const calculateRadius = (zoom) => {
        const baseRadius = 50000;
        return baseRadius / Math.pow(2, zoom - 5);
    };

    const findUsersNearby = () => {
        const radius = calculateRadius(zoomLevel);
        axios.post("http://localhost:8080/users/nearby", {
            latitude: mapCenter[0],
            longitude: mapCenter[1],
            radius: radius
        })
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => console.error("Eroare la căutarea utilizatorilor:", error));
    };

    const MapEvents = () => {
        useMapEvents({
            moveend: (e) => {
                const newCenter = e.target.getCenter();
                setMapCenter([newCenter.lat, newCenter.lng]);
                findUsersNearby();
            },
            zoomend: (e) => {
                const newZoom = e.target.getZoom();
                setZoomLevel(newZoom);
                findUsersNearby();
            }
        });
        return null;
    };

    return (
        <div className="flex h-screen">
            <div className="w-3/4 h-full">
                <header className="border-b mb-8">
                    <div className="container flex h-16 items-center justify-between px-4">
                        <a href="/home" className="flex items-center gap-2">
                            <PawPrint className="h-6 w-6 text-green-600"/>
                            <span className="text-xl font-bold">PetPal Adoptions</span>
                        </a>
                    </div>
                </header>

                <MapContainer center={mapCenter} zoom={zoomLevel} className="h-full w-full">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MapEvents />

                    {shelters.map((shelter) => (
                        <Marker
                            key={shelter.id}
                            position={[shelter.coordinates[1], shelter.coordinates[0]]}
                            icon={L.icon({
                                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                            })}
                        >
                            <Popup>{shelter.name}</Popup>
                        </Marker>
                    ))}

                    {users.map((user) => (
                        <Marker
                            key={user.id}
                            position={[user.location.coordinates[1], user.location.coordinates[0]]}
                            icon={userIcon}
                        >
                            <Popup>
                                <strong>{user.name}</strong><br />
                                {user.email}<br />
                                {user.contact}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default ShelterMap;
