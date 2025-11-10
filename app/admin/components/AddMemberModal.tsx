"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface User {
  firstName?: string;
  lastName?: string;
  age?: number;
  role?: string;
  schoolId?: number;
  password?: string;
}

interface School {
  id: number;
  name: string;
  code: string;
}

interface AddMemberModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<User>) => void;
  schools: School[];
}

export default function AddMemberModal({ onClose, onSubmit, schools }: AddMemberModalProps) {
  const [form, setForm] = useState<Partial<User>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.role || !form.schoolId || !form.password) {
      alert("First name, last name, role, school, and password are required.");
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="rounded-2xl border border-cyan-400/25 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto neon-panel" style={{ background: "var(--card-bg)" }}>
        <div className="sticky top-0 border-b border-cyan-400/20 p-6 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
          <h3 className="orbitron text-xl text-cyan-400 font-bold">Add New Member</h3>
          <button onClick={onClose} className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer">
            <X className="w-5 h-5 text-cyan-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 mb-4">
            <p className="text-[11px] text-cyan-300/80">
              <strong>Note:</strong> Username will be auto-generated based on role and school code (e.g., NCR-MB-SCHOOL-01).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={form.firstName || ""}
                onChange={handleChange}
                placeholder="John"
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={form.lastName || ""}
                onChange={handleChange}
                placeholder="Doe"
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Age
              </label>
              <input
                type="number"
                name="age"
                value={form.age || ""}
                onChange={handleChange}
                placeholder="25"
                min="1"
                max="120"
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Role *
              </label>
              <select
                name="role"
                value={form.role || ""}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="">Select role</option>
                <option value="ADMIN">Admin</option>
                <option value="SCANNER">Scanner</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                School *
              </label>
              <select
                name="schoolId"
                value={form.schoolId || ""}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password || ""}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all hover:bg-teal-400 active:scale-95 cursor-pointer"
            >
              Create Member
            </button>
            <button
              onClick={onClose}
              className="px-6 h-10 rounded-md border border-cyan-400/40 text-sm transition-all hover:border-cyan-300/60 active:scale-95 cursor-pointer"
              style={{ color: "var(--text-primary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}