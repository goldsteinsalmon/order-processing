
import React from "react";
import SyncStatusIndicator from "./sync/SyncStatusIndicator";

/**
 * This component extends the Navbar with additional elements
 * It's designed to be imported by the Layout component
 */
const NavbarExtension: React.FC = () => {
  return (
    <div className="mr-4">
      <SyncStatusIndicator />
    </div>
  );
};

export default NavbarExtension;
