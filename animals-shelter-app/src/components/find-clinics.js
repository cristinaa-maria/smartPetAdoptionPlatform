import { useState } from "react";
import { Card, CardContent } from "./ui/Card";
import Button from "./ui/Button";
import axios from "axios";

export default function FindVetClinics() {
    const [location, setLocation] = useState("");
    const [clinics, setClinics] = useState([]);
    const [message, setMessage] = useState("");

    const handleSearch = async () => {
        if (!location) {
            setMessage("Te rugăm să introduci o locație.");
            return;
        }
        setMessage("Căutăm clinici veterinare...");

        try {
            const response = await axios.get(`/api/find-clinics?location=${location}`);
            if (response.data.length > 0) {
                setClinics(response.data);
                setMessage("");
            } else {
                setMessage("Nu am găsit clinici veterinare în această zonă.");
            }
        } catch (error) {
            setMessage("A apărut o eroare la căutare. Încearcă din nou.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md p-4 shadow-xl">
                <CardContent>
                    <h2 className="text-2xl font-bold mb-4 text-center">Găsește Clinici Veterinare</h2>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Introdu locația"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSearch}>
                        Caută clinici
                    </Button>
                    {message && <p className="mt-4 text-center text-gray-700 font-semibold">{message}</p>}
                    <div className="mt-4">
                        {clinics.map((clinic, index) => (
                            <Card key={index} className="mb-2 p-2 border">
                                <CardContent>
                                    <h3 className="font-bold">{clinic.name}</h3>
                                    <p>{clinic.address}</p>
                                    <p>{clinic.phone}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
