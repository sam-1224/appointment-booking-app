import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Login({ onAuth }) {
    const [email, setEmail] = useState("patient@example.com");
    const [password, setPassword] = useState("Passw0rd!");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        toast.dismiss();

        try {
            const res = await fetch(`${API}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error?.message || "Login failed");
                setLoading(false);
                return;
            }
            toast.success("Login successful!");
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.role);
            onAuth?.(data.token, data.role);
            navigate("/");
        } catch {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <form
                onSubmit={submit}
                className="bg-white dark:bg-gray-800 p-6 rounded shadow w-96 space-y-4"
            >
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                    Login
                </h2>
                <input
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                />
                <input
                    type="password"
                    className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 rounded text-white ${loading
                            ? "bg-gray-400"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
