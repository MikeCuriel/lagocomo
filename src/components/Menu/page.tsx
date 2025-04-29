import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex space-x-4">
        <li>
          <Link href="/dashboard">
            <a>Resumen</a>
          </Link>
        </li>
        <li>
          <Link href="/clientes">
            <a>Clientes</a>
          </Link>
        </li>
        <li>
          <Link href="/propiedades">
            <a>Propiedades</a>
          </Link>
        </li>
        <li>
          <Link href="/ventas">
            <a>Ventas e historial de ventas</a>
          </Link>
        </li>
      </ul>
    </nav>
  );
}