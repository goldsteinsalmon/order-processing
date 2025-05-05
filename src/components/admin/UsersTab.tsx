import React from "react";
import { useData } from "@/context/DataContext";
import UserCard from "../users/UserCard";

const UsersTab: React.FC = () => {
  const { users } = useData();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};

export default UsersTab;
