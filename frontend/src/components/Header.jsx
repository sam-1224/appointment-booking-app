import { Link } from "react-router-dom";

export default function Header({ auth, logout }) {
    return (
        <header className="bg-gray-900 shadow px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-400">
                Clinic Booking
            </h1>
            <nav className="flex items-center gap-4">
                {auth.token && (
                    <span className="text-sm text-gray-300">
                        Role: {auth.role}
                    </span>
                )}
                <Link to="/" className="text-blue-400 hover:underline">
                    Home
                </Link>
                {!auth.token && (
                    <>
                        <Link to="/login" className="text-blue-400 hover:underline">
                            Login
                        </Link>
                        <Link to="/register" className="text-blue-400 hover:underline">
                            Register
                        </Link>
                    </>
                )}
                {auth.token && (
                    <button
                        onClick={logout}
                        className="text-red-400 hover:underline"
                    >
                        Logout
                    </button>
                )}
            </nav>
        </header>
    );
}
