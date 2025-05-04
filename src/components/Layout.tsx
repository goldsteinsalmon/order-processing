
import React from "react";
import Navbar from "./Navbar";
import NavbarExtension from "./NavbarExtension";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <Navbar />
          <NavbarExtension />
        </div>
      </header>
      <main className="container mx-auto py-6 px-4 flex-grow">
        {children}
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Food Order Management System
        </div>
      </footer>
    </div>
  );
};

export default Layout;
