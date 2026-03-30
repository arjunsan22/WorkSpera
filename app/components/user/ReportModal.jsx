"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const reasons = [
        "Spam",
        "Harassment or Bullying",
        "Hate Speech",
        "Nudity or Sexual Content",
        "Fake Account or Impersonation",
        "Violence or Threat",
        "Self-Injury",
        "Other"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!reason) {
            setError("Please select a reason.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetType, targetId, reason, details })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                    setReason("");
                    setDetails("");
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to submit report.");
            }
        } catch (err) {
            setError("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-5 border-b border-slate-800">
                        <div className="flex items-center gap-2 text-rose-500 font-bold">
                            <FaExclamationTriangle />
                            <h2>Report {targetType}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="p-5">
                        {success ? (
                            <div className="py-10 text-center">
                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
                                <p className="text-sm text-slate-400">Our moderation team will review this shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Why are you reporting this?</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-rose-500/50 outline-none"
                                    >
                                        <option value="" disabled>Select a reason</option>
                                        {reasons.map((r) => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Additional Details (Optional)</label>
                                    <textarea
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder="Provide more context..."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-rose-500/50 outline-none resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-xs text-red-500 font-medium">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? "Submitting..." : "Submit Report"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
