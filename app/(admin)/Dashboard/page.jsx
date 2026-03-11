"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

export default function AdminDashboard() {
    // --- KEEPING YOUR LOGIC UNTOUCHED ---
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    const cardsRef = useRef([]);
    const tableRef = useRef(null);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) { router.replace("/login"); return; }
        if (session.user.role !== "admin") { router.replace("/"); return; }
        fetchUsers();
    }, [session, status]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            showToast("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = async (userId, action) => {
        setActionLoading(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message);
                setUsers((prev) =>
                    prev.map((user) =>
                        user._id === userId
                            ? { ...user, isBlocked: data.user.isBlocked, role: data.user.role }
                            : user
                    )
                );
            } else {
                showToast(data.error || "Action failed", "error");
            }
        } catch (error) {
            showToast("Action failed", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterStatus === "all"
                ? true
                : filterStatus === "blocked"
                    ? user.isBlocked
                    : !user.isBlocked;
        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: users.length,
        active: users.filter((u) => !u.isBlocked).length,
        blocked: users.filter((u) => u.isBlocked).length,
        admins: users.filter((u) => u.role === "admin").length,
        online: users.filter((u) => u.isOnline).length,
    };
    // --- END OF YOUR LOGIC ---

    // PROFESSIONAL GSAP ANIMATIONS
    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                // Staggered reveal for stat cards
                gsap.from(".stat-card", {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out"
                });

                // Smooth fade in for the table
                gsap.from(".table-container", {
                    y: 40,
                    opacity: 0,
                    duration: 1,
                    delay: 0.4,
                    ease: "power2.out"
                });
            });
            return () => ctx.revert();
        }
    }, [loading]);

    // Professional Card Hover Animation
    const onHover = (e) => {
        gsap.to(e.currentTarget, {
            y: -5,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            borderColor: "rgba(99, 102, 241, 0.4)",
            duration: 0.3
        });
    };

    const onLeave = (e) => {
        gsap.to(e.currentTarget, {
            y: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            borderColor: "rgba(255, 255, 255, 0.05)",
            duration: 0.3
        });
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-xs animate-pulse">SYNCHRONIZING SECURE ACCESS...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "admin") return null;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30">
            {/* Background Subtle Gradient Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Toast System */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-6 right-6 z-[100]">
                        <div className={`px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-red-500/10 border-red-500/50 text-red-400"}`}>
                            <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 20c0 .553.447 1 1 1h16c.553 0 1-.447 1-1 0-7.032-4.476-13.41-11-15.602V5a3 3 0 10-6 0v.398h-.066z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white">Admin Dashboard</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold italic">WorkSpera Core v2.4</p>
                        </div>
                    </div>
                    <button onClick={() => router.push("/")} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> RETURN TO PLATFORM
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                    {[
                        { label: "Total Users", value: stats.total, color: "text-indigo-400", icon: "👥" },
                        { label: "Active", value: stats.active, color: "text-emerald-400", icon: "⚡" },
                        { label: "Blocked", value: stats.blocked, color: "text-rose-400", icon: "🚫" },
                        { label: "Admins", value: stats.admins, color: "text-amber-400", icon: "🛡️" },
                        { label: "Online", value: stats.online, color: "text-cyan-400", icon: "🟢" },
                    ].map((stat) => (
                        <div key={stat.label} onMouseEnter={onHover} onMouseLeave={onLeave} className="stat-card bg-slate-900/50 border border-white/5 p-5 rounded-2xl transition-all shadow-sm">
                            <div className="text-xl mb-3">{stat.icon}</div>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter & Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search records by name, email or UID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/40 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex bg-slate-900/40 border border-white/5 p-1 rounded-xl">
                        {["all", "active", "blocked"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tighter transition-all ${filterStatus === f ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table Container */}
                <div className="table-container bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                                    <th className="px-8 py-5">Member</th>
                                    <th className="px-6 py-5">Account Status</th>
                                    <th className="px-6 py-5">Authority</th>
                                    <th className="px-6 py-5">Network Reach</th>
                                    <th className="px-8 py-5 text-right">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <img src={user.profileImage || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/5" alt="" />
                                                    {user.isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{user.name}</div>
                                                    <div className="text-[11px] text-slate-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${user.isBlocked ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                                <span className={`w-1 h-1 rounded-full ${user.isBlocked ? "bg-red-400" : "bg-emerald-400"}`}></span>
                                                {user.isBlocked ? "BLOCKED" : "VERIFIED"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-[10px] font-mono ${user.role === "admin" ? "text-amber-500" : "text-slate-500"}`}>
                                                {user.role === "admin" ? "MASTER_ACCESS" : "STANDARD_USER"}
                                            </span>
                                        </td>
                                        {/* Restored Following/Followers Logic Here */}
                                        <td className="px-6 py-5">
                                            <div className="flex gap-4 text-[11px]">
                                                <span className="text-slate-500"><b className="text-white">{user.followersCount || 0}</b> Followers</span>
                                                <span className="text-slate-500"><b className="text-white">{user.followingCount || 0}</b> Following</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user._id !== session.user.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(user._id, user.isBlocked ? "unblock" : "block")}
                                                            disabled={actionLoading === user._id}
                                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${user.isBlocked ? "border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white" : "border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"}`}
                                                        >
                                                            {actionLoading === user._id ? "..." : user.isBlocked ? "RESTORE" : "RESTRICT"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(user._id, user.role === "admin" ? "remove-admin" : "make-admin")}
                                                            disabled={actionLoading === user._id}
                                                            className="px-4 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 text-slate-300 hover:bg-white hover:text-black transition-all"
                                                        >
                                                            {user.role === "admin" ? "DEMOTE" : "PROMOTE"}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest italic">Current Session</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <p>SYSTEM LOG: {filteredUsers.length} DATA_ENTRIES_RETRIEVED</p>
                    <p>© 2024 WORKSPERA CLOUD OS</p>
                </div>
            </main>
        </div>
    );
}