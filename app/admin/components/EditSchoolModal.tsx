"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import type { School } from "@/lib/hooks/useSchools";

interface EditSchoolModalProps {
    school: School;
    onClose: () => void;
    onSubmit: (id: number, data: { name: string; code: string }) => void;
}

export default function EditSchoolModal({ school, onClose, onSubmit }: EditSchoolModalProps) {
    const [form, setForm] = useState({ name: school.name, code: school.code });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "code" ? value.toUpperCase() : value,
        }));
    };

    const handleSubmit = () => {
        if (!form.name || !form.code) {
            alert("School name and code are required.");
            return;
        }
        if (form.code.length !== 3) {
            alert("School code must be exactly 3 characters.");
            return;
        }

        onSubmit(school.id, form);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="rounded-2xl border border-cyan-400/25 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto neon-panel" style={{ background: "var(--card-bg)" }}>
                <div className="sticky top-0 border-b border-cyan-400/20 p-6 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
                    <h3 className="orbitron text-xl text-cyan-400 font-bold">Edit School</h3>
                    <button onClick={onClose} className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer">
                        <X className="w-5 h-5 text-cyan-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>School Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="University Name"
                                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>School Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={form.code}
                                onChange={handleChange}
                                placeholder="XYZ"
                                maxLength={3}
                                className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all"
                                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button onClick={handleSubmit} className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all hover:bg-teal-400 active:scale-95 cursor-pointer">Save Changes</button>
                        <button onClick={onClose} className="px-6 h-10 rounded-md border border-cyan-400/40 text-sm transition-all hover:border-cyan-300/60 active:scale-95 cursor-pointer" style={{ color: "var(--text-primary)" }}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}