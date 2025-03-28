import { useState } from "react"
import {PawPrint, MapPin, LogOut} from "lucide-react"
import  Button  from "./ui/Button"
import type React from "react";


const Catalog = () => {
    const [viewMode, setViewMode] = useState("catalog")

    const animals = [
        {
            id: 1,
            name: "Buddy",
            age: 3,
            breed: "Golden Retriever",
            healthCondition: "Cățel adorabil",
            location: "București",
            coordinates: { lat: 44.4268, lng: 26.1025 },
        },
        {
            id: 2,
            name: "Luna",
            age: 2,
            breed: "Siamese Cat",
            healthCondition: "Pisică blândă",
            location: "Cluj-Napoca",
            coordinates: { lat: 46.7712, lng: 23.6236 },
        },
    ]

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
                        <a className="text-sm font-medium hover:text-green-600 transition-colors"
                           href="/editor_catalog">
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
                                window.location.href = "/login";
                            }}
                        >
                            <LogOut className="h-4 w-4"/>
                            Deconectare
                        </button>
                    </nav>
                </div>
            </header>
            <h1 className="text-3xl font-bold mb-6 text-center">Animale disponibile</h1>

            <div className="flex items-center justify-center space-x-4 mb-6">
                <Button onClick={() => window.location.href = "/map"}>Hartă</Button>

            </div>

            {viewMode === "catalog" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {animals.map((animal) => (
                        <div key={animal.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2">{animal.name}</h2>
                                <p className="text-gray-600 mb-1">Vârsta: {animal.age} years</p>
                                <p className="text-gray-600 mb-1">Specia: {animal.breed}</p>
                                <p className="text-gray-600 mb-1">Descrierea: {animal.healthCondition}</p>
                                <p className="text-gray-600 flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" /> {animal.location}
                                </p>
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
