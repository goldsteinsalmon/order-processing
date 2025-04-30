
import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100";
  };

  const navItems = [
    { name: "Orders", path: "/" },
    { name: "Completed Orders", path: "/completed-orders" },
    { name: "Standing Orders", path: "/standing-orders" },
    { name: "Missing Items", path: "/missing-items" },
    { name: "Returns & Complaints", path: "/returns" },
    { name: "Customers", path: "/customers" },
    { name: "Products", path: "/products" },
    { name: "Admin", path: "/admin" },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="px-4">
        <div className="flex flex-wrap">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-4 text-sm font-medium ${isActive(item.path)}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
