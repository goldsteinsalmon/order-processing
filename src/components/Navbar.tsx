
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";

interface NavLinkProps {
  to: string;
  label: string;
  icon?: React.ReactNode;
  badgeCount?: number;
  onlyMobile?: boolean;
  onClose?: () => void;
  showBadge?: boolean;
}

const Navbar: React.FC = () => {
  const { missingItems } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Only count missing items
  const missingItemsCount = missingItems.length;
  
  // Get today's date for display
  const todayFormatted = format(new Date(), "EEEE, MMMM d, yyyy");
  
  // Handle menu close
  const handleClose = () => setIsOpen(false);
  
  // Helper for links that will be used in both desktop and mobile
  const NavLink: React.FC<NavLinkProps> = ({ 
    to, 
    label, 
    icon, 
    badgeCount, 
    onlyMobile, 
    onClose,
    showBadge = false 
  }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
    
    // Only show on mobile if specified
    if (!isMobile && onlyMobile) return null;

    const className = cn(
      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
      {
        "bg-primary text-primary-foreground": isActive && !isMobile,
        "bg-secondary text-secondary-foreground": isActive && isMobile,
        "hover:bg-secondary": !isActive && !isMobile,
        "hover:bg-secondary/80": !isActive && isMobile,
      }
    );
    
    return (
      <Link to={to} className={className} onClick={onClose}>
        {icon}
        <span>{label}</span>
        {showBadge && typeof badgeCount === 'number' && badgeCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-red-500 text-white">
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  // Desktop Navigation
  const DesktopNav = () => (
    <div className="hidden md:flex items-center space-x-1">
      <NavLink to="/" label="Orders" />
      <NavLink to="/completed-orders" label="Completed Orders" />
      <NavLink to="/customers" label="Customers" />
      <NavLink to="/standing-orders" label="Standing Orders" />
      <NavLink to="/products" label="Products" />
      <NavLink to="/returns" label="Returns" />
      <NavLink to="/missing-items" label="Missing Items" badgeCount={missingItemsCount} showBadge={true} />
      <NavLink to="/batch-tracking" label="Batch Tracking" />
      <NavLink to="/admin" label="Admin" />
    </div>
  );

  // Mobile Navigation (Hamburger Menu)
  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col space-y-4 mt-6">
          <NavLink to="/" label="Orders" onClose={handleClose} />
          <NavLink to="/completed-orders" label="Completed Orders" onClose={handleClose} />
          <NavLink to="/customers" label="Customers" onClose={handleClose} />
          <NavLink to="/standing-orders" label="Standing Orders" onClose={handleClose} />
          <NavLink to="/products" label="Products" onClose={handleClose} />
          <NavLink to="/returns" label="Returns" onClose={handleClose} />
          <NavLink to="/missing-items" label="Missing Items" badgeCount={missingItemsCount} showBadge={true} onClose={handleClose} />
          <NavLink to="/batch-tracking" label="Batch Tracking" onClose={handleClose} />
          <NavLink to="/admin" label="Admin" onClose={handleClose} />
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-30 bg-background border-b">
      <div className="container flex h-16 items-center">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="font-bold text-lg">Order Manager</span>
          </div>
          
          <DesktopNav />
          
          <div className="text-sm text-muted-foreground hidden md:block">
            {todayFormatted}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
