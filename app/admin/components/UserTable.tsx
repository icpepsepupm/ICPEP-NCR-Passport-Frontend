"use client";

import React from "react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  email?: string;
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cyan-400/15 backdrop-blur-sm p-4">
      <table className="min-w-full table-auto text-cyan-100">
        <thead className="text-left text-cyan-200/70 border-b border-cyan-400/20">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Username</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-4 text-cyan-200/50">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-b border-cyan-400/10 hover:bg-cyan-500/10">
                <td className="px-4 py-2">{user.id}</td>
                <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                <td className="px-4 py-2">{user.username}</td>
                <td className="px-4 py-2">{user.role}</td>
                <td className="px-4 py-2">{user.email || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
