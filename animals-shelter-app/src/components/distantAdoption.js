import type React from "react";
import { useState } from "react";
import { ArrowLeft, PawPrint, CreditCard, Loader2 } from "lucide-react";
import Button from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import Input from "./ui/Input";

const processSponsorship = async (sponsorshipDetails) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true };
};

const DistantAdoptionPage = () => {
    const [selectedPet, setSelectedPet] = useState(null);
    const [amount, setAmount] = useState("");
    const [sponsorshipPeriod, setSponsorshipPeriod] = useState("1");
    const [cardNumber, setCardNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [cvv, setCvv] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState("");

    const handleSponsorship = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        setMessage("");

        try {
            const result = await processSponsorship({
                selectedPet,
                amount,
                sponsorshipPeriod,
                cardNumber,
                expiryDate,
                cvv,
            });
            if (result.success) {
                setMessage("Mulțumim! Sponsorizarea a fost procesată cu succes.");
            }
        } catch (error) {
            setMessage("A apărut o eroare. Te rugăm să încerci din nou.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReturn = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container flex h-16 items-center justify-between px-4">
                    <a href="/home" className="flex items-center gap-2">
                        <PawPrint className="h-6 w-6 text-green-600"/>
                        <span className="text-xl font-bold">PetPal Adopții la Distanță</span>
                    </a>
                </div>
            </header>

            <div className="mb-8">
                <Button
                    variant="ghost"
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-md"
                    onClick={handleReturn}
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Înapoi
                </Button>
            </div>

            <h1 className="text-4xl font-bold mt-8 mb-6 text-center">Sponsorizare Adopție la Distanță</h1>

            <div className="max-w-4xl mx-auto px-4 mb-8">
                <form onSubmit={handleSponsorship} className="flex flex-col gap-4">
                    {/* Perioada de sponsorizare */}
                    <div>
                        <label className="block text-lg font-medium">Selectează o perioadă</label>
                        <select
                            value={sponsorshipPeriod}
                            onChange={(e) => setSponsorshipPeriod(e.target.value)}
                            className="w-full p-4 text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            aria-label="Perioada de sponsorizare"
                        >
                            <option value="1">1 lună</option>
                            <option value="3">3 luni</option>
                            <option value="6">6 luni</option>
                            <option value="12">1 an</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-lg font-medium">Introdu suma pe care dorești să o donezi</label>
                        <Input
                            type="number"
                            min="1"
                            placeholder="Ex: 50"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="mt-2 w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                    </div>

                    <div>
                        <label className="block text-lg font-medium">Număr Card</label>
                        <Input
                            type="text"
                            placeholder="1234 5678 9101 1121"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            required
                            maxLength={16}
                            className="mt-2 w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-lg font-medium">Data Expirării</label>
                            <Input
                                type="text"
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                required
                                maxLength={5}
                                className="mt-2 w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-medium">CVV</label>
                            <Input
                                type="text"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value)}
                                required
                                maxLength={3}
                                className="mt-2 w-full p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full h-full py-4 px-6 text-lg bg-green-600 hover:bg-green-700 flex items-center justify-center"
                    >
                        {isProcessing ? <Loader2 className="animate-spin w-6 h-6"/> :
                            <CreditCard className="w-6 h-6 mr-2"/>}
                        {isProcessing ? "Procesare..." : "Donează"}
                    </Button>
                </form>

                {message && (
                    <div className="text-center mt-6 text-green-700 font-semibold">{message}</div>
                )}
            </div>
        </div>
    );
};

export default DistantAdoptionPage;
