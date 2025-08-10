import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL;

export default function PatientDashboard({ token }) {
    const [slots, setSlots] = useState([]);
    const [bookings, setBookings] = useState([]);

    const fetchSlots = async () => {
        const today = new Date();
        const from = today.toISOString().split("T")[0];
        const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        const res = await fetch(`${API}/api/slots?from=${from}&to=${to}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSlots(data.slots || []);
    };

    const fetchBookings = async () => {
        const res = await fetch(`${API}/api/my-bookings`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookings(data.bookings || []);
    };

    const bookSlot = async (slotId) => {
        const res = await fetch(`${API}/api/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ slotId }),
        });
        const data = await res.json();
        if (!res.ok) {
            toast.error(data.error?.message || "Booking failed");
        } else {
            toast.success("Slot booked!");
            fetchSlots();
            fetchBookings();
        }
    };

    useEffect(() => {
        fetchSlots();
        fetchBookings();
    }, []);

    return (
        <div className="space-y-6">
            <section>
                <h2 className="text-xl font-bold mb-3">Available Slots</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                        <div
                            key={slot.id}
                            className="border rounded p-3 flex justify-between items-center dark:border-gray-700"
                        >
                            <span>
                                {new Date(slot.startAt).toLocaleString()} -{" "}
                                {new Date(slot.endAt).toLocaleTimeString()}
                            </span>
                            <button
                                onClick={() => bookSlot(slot.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                                Book
                            </button>
                        </div>
                    ))}
                    {slots.length === 0 && (
                        <p className="text-gray-500">No available slots.</p>
                    )}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold mb-3">My Bookings</h2>
                <div className="space-y-2">
                    {bookings.map((b) => (
                        <div
                            key={b.id}
                            className="border rounded p-3 dark:border-gray-700"
                        >
                            Slot: {new Date(b.slot.startAt).toLocaleString()} -{" "}
                            {new Date(b.slot.endAt).toLocaleTimeString()}
                        </div>
                    ))}
                    {bookings.length === 0 && (
                        <p className="text-gray-500">No bookings yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
