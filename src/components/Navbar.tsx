
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FileText, 
  CheckCircle, 
  Calendar, 
  AlertTriangle, 
  MessageSquare,
  Users, 
  Package, 
  Settings 
} from "lucide-react";

const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100";
  };

  const navItems = [
    { name: "Orders", path: "/", icon: <FileText className="mr-2" /> },
    { name: "Completed Orders", path: "/completed-orders", icon: <CheckCircle className="mr-2" /> },
    { name: "Standing Orders", path: "/standing-orders", icon: <Calendar className="mr-2" /> },
    { name: "Missing Items", path: "/missing-items", icon: <AlertTriangle className="mr-2" /> },
    { name: "Returns & Complaints", path: "/returns", icon: <MessageSquare className="mr-2" /> },
    { name: "Customers", path: "/customers", icon: <Users className="mr-2" /> },
    { name: "Products", path: "/products", icon: <Package className="mr-2" /> },
    { name: "Admin", path: "/admin", icon: <Settings className="mr-2" /> },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-4 text-sm font-medium whitespace-nowrap ${isActive(item.path)}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
