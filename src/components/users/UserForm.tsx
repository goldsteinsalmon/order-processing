import React, { useState } from "react";
import { User } from "@/types";

interface UserFormProps {
  onSubmit: (user: User) => void;
  initialData?: User;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const user: User = {
      id: initialData?.id || Date.now().toString(),
      name,
      email,
      role,
    };

    onSubmit(user);
    setName("");
    setEmail("");
    setRole("user");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          className="input input-bordered w-full"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          className="input input-bordered w-full"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Role</label>
        <select
          className="select select-bordered w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button type="submit" className="btn btn-primary">
        {initialData ? "Update User" : "Add User"}
      </button>
    </form>
  );
};

export default UserForm;
