"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, active, blocked
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (status === "loading") return;
        if (!session || session.user.role !== "admin") {
            router.replace("/login");
            return;
        }
        fetchUsers();
    }, [session, status]);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Error fetching users:", error);
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
            console.error("Error performing action:", error);
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

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50"
                    >
                        <div
                            className={`px-5 py-3 rounded-xl shadow-2xl backdrop-blur-lg border ${toast.type === "success"
                                    ? "bg-emerald-500/90 border-emerald-400/50"
                                    : "bg-red-500/90 border-red-400/50"
                                }`}
                        >
                            <span className="text-white font-medium text-sm">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                                <p className="text-xs text-slate-400">
                                    WorkSpera Administration Panel
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/")}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-all border border-slate-700/50"
                        >
                            ← Back to App
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: "Total Users", value: stats.total, color: "from-indigo-500 to-blue-500", icon: "👥" },
                        { label: "Active", value: stats.active, color: "from-emerald-500 to-green-500", icon: "✅" },
                        { label: "Blocked", value: stats.blocked, color: "from-red-500 to-rose-500", icon: "🚫" },
                        { label: "Admins", value: stats.admins, color: "from-amber-500 to-orange-500", icon: "🛡️" },
                        { label: "Online", value: stats.online, color: "from-cyan-500 to-teal-500", icon: "🟢" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-slate-900/50 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-x-4 -translate-y-4 blur-xl`}></div>
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search users by name, email, or username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "active", "blocked"].map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setFilterStatus(filter)}
                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all capitalize ${filterStatus === filter
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-slate-700/50"
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/30 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-4">User</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-2">Stats</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>

                    {/* User Rows */}
                    {filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-slate-400 text-sm">No users found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/40">
                            {filteredUsers.map((user, i) => (
                                <motion.div
                                    key={user._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-6 py-4 items-center hover:bg-slate-800/20 transition-colors ${user.isBlocked ? "opacity-60" : ""
                                        }`}
                                >
                                    {/* User Info */}
                                    <div className="col-span-1 md:col-span-4 flex items-center gap-3">
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={user.profileImage || "/default-avatar.png"}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                                            />
                                            {user.isOnline && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                            <p className="text-xs text-slate-400 truncate">@{user.username}</p>
                                            <p className="text-[11px] text-slate-500 truncate md:hidden">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-2 md:gap-0">
                                        <span className="md:hidden text-xs text-slate-500">Status:</span>
                                        {user.isBlocked ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                Blocked
                                            </span>
                                        ) : user.isVerified ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20">
                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/20">
                                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                                Unverified
                                            </span>
                                        )}
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-1 md:col-span-1 flex items-center gap-2 md:gap-0">
                                        <span className="md:hidden text-xs text-slate-500">Role:</span>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${user.role === "admin"
                                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                                    : "bg-slate-700/50 text-slate-400"
                                                }`}
                                        >
                                            {user.role === "admin" ? "🛡️ Admin" : "User"}
                                        </span>
                                    </div>

                                    {/* Stats */}
                                    <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                                        <span className="md:hidden text-xs text-slate-500">Stats:</span>
                                        <span className="text-xs text-slate-400">
                                            <span className="text-white font-semibold">{user.followersCount}</span> followers
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            <span className="text-white font-semibold">{user.followingCount}</span> following
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 md:col-span-3 flex items-center justify-start md:justify-end gap-2 flex-wrap">
                                        {user._id !== session.user.id && (
                                            <>
                                                {user.isBlocked ? (
                                                    <button
                                                        onClick={() => handleAction(user._id, "unblock")}
                                                        disabled={actionLoading === user._id}
                                                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-semibold rounded-lg transition-all border border-emerald-500/20 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user._id ? "..." : "✅ Unblock"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(user._id, "block")}
                                                        disabled={actionLoading === user._id}
                                                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-semibold rounded-lg transition-all border border-red-500/20 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user._id ? "..." : "🚫 Block"}
                                                    </button>
                                                )}
                                                {user.role === "admin" ? (
                                                    <button
                                                        onClick={() => handleAction(user._id, "remove-admin")}
                                                        disabled={actionLoading === user._id}
                                                        className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-xs font-semibold rounded-lg transition-all border border-slate-600/30 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user._id ? "..." : "Remove Admin"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAction(user._id, "make-admin")}
                                                        disabled={actionLoading === user._id}
                                                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 text-xs font-semibold rounded-lg transition-all border border-amber-500/20 disabled:opacity-50"
                                                    >
                                                        {actionLoading === user._id ? "..." : "🛡️ Make Admin"}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {user._id === session.user.id && (
                                            <span className="text-xs text-slate-500 italic">You (Admin)</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Footer Info */}
                <div className="mt-6 text-center text-xs text-slate-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>
        </div>
    );
}
