"use client"; // Mark this component as a Client Component

import { usePathname } from 'next/navigation'; // Use next/navigation's usePathname hook
import Link from 'next/link';
import './navbar.css';

const Navbar = () => {
  const pathname = usePathname(); // Get the current pathname

  const isActive = (path) => pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <Link href="/" className={isActive('/')}>HomeChef</Link> {/* Apply active class here */}
      </div>
      <ul className="navbar__links">
        <li>
          <Link href="/homecook" className={isActive('/homecook')}>BecomeHomeCook</Link>
        </li>
        <li>
          <Link href="/delivery" className={isActive('/delivery')}>BecomeDeliveryDriver</Link>
        </li>
        <li>
          <Link href="/login" className={isActive('/login')}>Login</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
