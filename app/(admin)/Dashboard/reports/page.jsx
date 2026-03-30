"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

export default function ReportsDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("pending");
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) { router.replace("/login"); return; }
        if (session.user.role !== "admin") { router.replace("/"); return; }
        fetchReports();
    }, [session, status]);

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin/reports");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setReports(data.reports || []);
        } catch (error) {
            showToast("Failed to load reports", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAction = async (reportId, action) => {
        setActionLoading(reportId);
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message);
                setReports((prev) =>
                    prev.map((report) =>
                        report._id === reportId
                            ? { ...report, status: data.report.status }
                            : report
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

    const filteredReports = reports.filter((report) => report.status === filterStatus);

    // Stats
    const stats = {
        total: reports.length,
        pending: reports.filter((r) => r.status === "pending").length,
        resolved: reports.filter((r) => r.status === "resolved").length,
        dismissed: reports.filter((r) => r.status === "dismissed").length,
    };

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from(".stat-card", {
                    y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
                });
                gsap.from(".table-container", {
                    y: 40, opacity: 0, duration: 1, delay: 0.4, ease: "power2.out"
                });
            });
            return () => ctx.revert();
        }
    }, [loading]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-mono text-xs animate-pulse">FETCHING REPORTS...</p>
                </div>
            </div>
        );
    }

    if (!session || session.user.role !== "admin") return null;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-rose-500/30">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[120px] rounded-full" />
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
                        <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-white">Reports Panel</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold italic">Moderation Hub</p>
                        </div>
                    </div>
                    <button onClick={() => router.push("/Dashboard")} className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> BACK TO DASHBOARD
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: "Total Reports", value: stats.total, color: "text-indigo-400", icon: "📑" },
                        { label: "Pending", value: stats.pending, color: "text-rose-400", icon: "⏳" },
                        { label: "Resolved", value: stats.resolved, color: "text-emerald-400", icon: "✅" },
                        { label: "Dismissed", value: stats.dismissed, color: "text-slate-400", icon: "🗑️" },
                    ].map((stat) => (
                        <div key={stat.label} className="stat-card bg-slate-900/50 border border-white/5 p-5 rounded-2xl transition-all shadow-sm">
                            <div className="text-xl mb-3">{stat.icon}</div>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="flex mb-8">
                    <div className="flex bg-slate-900/40 border border-white/5 p-1 rounded-xl">
                        {["pending", "resolved", "dismissed"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterStatus(f)}
                                className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-tighter transition-all ${filterStatus === f ? "bg-rose-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reports Table Container */}
                <div className="table-container bg-slate-900/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                                    <th className="px-6 py-5">Reporter</th>
                                    <th className="px-6 py-5">Target Type</th>
                                    <th className="px-6 py-5">Reason</th>
                                    <th className="px-6 py-5 w-1/3">Target Info</th>
                                    <th className="px-6 py-5 text-right w-40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-slate-500 text-sm font-medium">No {filterStatus} reports found.</td>
                                    </tr>
                                ) : (
                                filteredReports.map((report) => (
                                    <tr key={report._id} className="group hover:bg-white/[0.01] transition-colors">
                                        <td className="px-6 py-5 align-top">
                                             <div className="flex items-center gap-3">
                                                 <img src={report.reporterId?.profileImage || "/default-avatar.png"} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                                                 <div>
                                                     <div className="text-xs font-bold text-white">{report.reporterId?.name || "Unknown"}</div>
                                                     <div className="text-[10px] text-slate-500">@{report.reporterId?.username || "?"}</div>
                                                 </div>
                                             </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold 
                                                ${report.targetType === "Post" ? "bg-blue-500/10 text-blue-400" : 
                                                  report.targetType === "Comment" ? "bg-purple-500/10 text-purple-400" : 
                                                  "bg-amber-500/10 text-amber-400"}`}>
                                                {report.targetType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="text-sm text-rose-300 font-bold">{report.reason}</div>
                                            {report.details && <div className="text-[11px] text-slate-400 mt-1 italic">"{report.details}"</div>}
                                            <div className="text-[9px] text-slate-600 mt-2">{new Date(report.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 text-xs text-slate-300">
                                                {report.targetType === "Profile" && (
                                                    <div>
                                                        <div className="font-bold text-white mb-1">Account: {report.targetDetails?.name}</div>
                                                        <div className="text-[10px] text-slate-500">Email: {report.targetDetails?.email}</div>
                                                    </div>
                                                )}
                                                {report.targetType === "Post" && (
                                                    <div>
                                                        <div className="font-bold text-white mb-1">Author: {report.targetDetails?.user?.name}</div>
                                                        <div className="text-[11px] line-clamp-2">{report.targetDetails?.caption || "No Caption"}</div>
                                                        {report.targetDetails?.image?.length > 0 && <span className="text-[9px] text-blue-400 mt-1 block">[Contains Media]</span>}
                                                    </div>
                                                )}
                                                {report.targetType === "Comment" && (
                                                    <div>
                                                        <div className="font-bold text-white mb-1">Commenter: {report.targetDetails?.commentUser?.name || "Unknown"}</div>
                                                        <div className="text-[11px] line-clamp-2 bg-slate-950 p-2 rounded mt-1 border border-white/5">"{report.targetDetails?.commentText}"</div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right align-top">
                                            {filterStatus === "pending" && (
                                                <div className="flex flex-col gap-2 relative">
                                                    <button
                                                        onClick={() => handleAction(report._id, "dismiss")}
                                                        disabled={actionLoading === report._id}
                                                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-slate-500/50 text-slate-400 hover:bg-slate-500 hover:text-white"
                                                    >
                                                        {actionLoading === report._id ? "..." : "DISMISS"}
                                                        </button>
                                                    {report.targetType === "Post" && (
                                                        <button
                                                            onClick={() => handleAction(report._id, "resolve_delete_post")}
                                                            disabled={actionLoading === report._id}
                                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                                                        >
                                                            DELETE POST
                                                        </button>
                                                    )}
                                                    {report.targetType === "Profile" && (
                                                        <button
                                                            onClick={() => handleAction(report._id, "resolve_block_user")}
                                                            disabled={actionLoading === report._id}
                                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                                                        >
                                                            BLOCK USER
                                                        </button>
                                                    )}
                                                    {report.targetType === "Comment" && (
                                                        <button
                                                            onClick={() => handleAction(report._id, "resolve_delete_comment")}
                                                            disabled={actionLoading === report._id}
                                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
                                                        >
                                                            DELETE COMMENT
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {filterStatus !== "pending" && (
                                                <span className={`text-[10px] font-bold uppercase ${filterStatus === "resolved" ? "text-emerald-500" : "text-slate-500"}`}>
                                                    {filterStatus}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <p>SYSTEM LOG: {filteredReports.length} REPORTS_FOUND</p>
                </div>
            </main>
        </div>
    );
}
