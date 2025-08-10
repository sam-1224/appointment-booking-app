import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

export default function AdminDashboard({ token }) {
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        const res = await fetch(`${API}/api/all-bookings`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setBookings(data.bookings || []);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <div>
            <h2 className="text-xl font-bold mb-3">All Bookings</h2>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                            <th className="border p-2 dark:border-gray-700">ID</th>
                            <th className="border p-2 dark:border-gray-700">Patient</th>
                            <th className="border p-2 dark:border-gray-700">Slot Start</th>
                            <th className="border p-2 dark:border-gray-700">Slot End</th>
                            <th className="border p-2 dark:border-gray-700">Booked At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((b) => (
                            <tr key={b.id}>
                                <td className="border p-2 dark:border-gray-700">{b.id}</td>
                                <td className="border p-2 dark:border-gray-700">{b.user.name}</td>
                                <td className="border p-2 dark:border-gray-700">
                                    {new Date(b.slot.startAt).toLocaleString()}
                                </td>
                                <td className="border p-2 dark:border-gray-700">
                                    {new Date(b.slot.endAt).toLocaleTimeString()}
                                </td>
                                <td className="border p-2 dark:border-gray-700">
                                    {new Date(b.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {bookings.length === 0 && (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center p-3 text-gray-500 dark:text-gray-400"
                                >
                                    No bookings found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
