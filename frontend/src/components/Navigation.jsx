import { Link } from "react-router-dom";

export default function Navigation() {
  return (
    <nav className="bg-[#fff8f7] shadow-md px-8 py-4 flex items-center justify-between">
      <Link
        to="/"
        className="text-2xl font-bold text-red-700 tracking-tight hover:text-red-900 transition-colors duration-200"
        style={{ textDecoration: "none" }}
      >
        Receipt OCR
      </Link>
      <div className="flex gap-6 ml-8">
        <Link
          to="/"
          className="text-red-700 hover:text-red-900 font-medium px-3 py-2 rounded transition-colors duration-200 hover:bg-red-50"
        >
          Home
        </Link>
        <Link
          to="/invoices"
          className="text-red-700 hover:text-red-900 font-medium px-3 py-2 rounded transition-colors duration-200 hover:bg-red-50"
        >
          Invoices
        </Link>
      </div>
    </nav>
  );
}
