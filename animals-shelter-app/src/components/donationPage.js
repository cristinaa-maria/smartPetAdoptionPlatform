import type React from "react";
import { useState } from "react";
import { PawPrint, CreditCard, Loader2 } from "lucide-react";
import Button from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import Input from "./ui/Input";

const PetCard = ({ pet }) => (
    <Card className="overflow-hidden">
        <img src={pet.image || "/placeholder.svg"} alt={pet.name} className="w-full h-48 object-cover" />
        <CardContent className="p-4">
            <h3 className="text-lg font-semibold">{pet.name}</h3>
            <div className="text-sm text-gray-600">
                <p>{pet.type} • {pet.age} • {pet.size}</p>
            </div>
        </CardContent>
    </Card>
);

const processSponsorship = async (sponsorshipDetails) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
};

const DonationPage = () => {
    const [selectedPet, setSelectedPet] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [sponsorshipPeriod, setSponsorshipPeriod] = useState("1");
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState("");

    const handleSponsorship = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setMessage("");

        try {
            const result = await processSponsorship({ selectedPet, paymentMethod, sponsorshipPeriod });
            if (result.success) {
                setMessage("Mulțumim! Donația a fost procesată cu succes.");
            }
        } catch (error) {
            setMessage("A apărut o eroare. Te rugăm să încerci din nou.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600"/>
                        <span className="text-xl font-bold">PetPal Donație</span>
                    </a>
                </div>
            </header>

            <h1 className="text-4xl font-bold mt-8 mb-6 text-center">Donează către unul din adăposturi</h1>

            <div className="max-w-4xl mx-auto px-4 mb-8">
                <form onSubmit={handleSponsorship} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <select
                            value={selectedPet}
                            onChange={(e) => setSelectedPet(e.target.value)}
                            className="w-full p-4 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            aria-label="Alege un animal pentru sponsorizare"
                        >
                            <option value="">Selectează un adăpost</option>
                            <option value="1">Adăpost 1</option>
                            <option value="2">Adăpost 2</option>
                        </select>

                        <select
                            value={sponsorshipPeriod}
                            onChange={(e) => setSponsorshipPeriod(e.target.value)}
                            className="w-full p-4 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            aria-label="Perioada de donație"
                        >
                            <option value="1">1 lună</option>
                            <option value="3">3 luni</option>
                            <option value="6">6 luni</option>
                            <option value="12">1 an</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full p-4 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            aria-label="Metoda de plată"
                        >
                            <option value="card">Card Bancar</option>
                            <option value="paypal">PayPal</option>
                            <option value="transfer">Transfer Bancar</option>
                        </select>

                        <Button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full h-full py-4 px-6 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
                        >
                            {isProcessing ? <Loader2 className="animate-spin w-6 h-6"/> : <CreditCard className="w-6 h-6 mr-2"/>}
                            {isProcessing ? "Procesare..." : "Donează"}
                        </Button>
                    </div>
                </form>

                {message && (
                    <div className="text-center mt-6 text-green-700 font-semibold">{message}</div>
                )}
            </div>
        </div>
    );
};

export default DonationPage;