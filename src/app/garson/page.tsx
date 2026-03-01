"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Users, Utensils, LogOut, ChevronDown } from "lucide-react";

type TableStatus = "EMPTY" | "OCCUPIED";

interface TableData {
    id: string;
    name: string;
    status: TableStatus;
    capacity: number;
    active_order_id: string | null;
    current_total_amount: number;
    floor: string;
}

const fetchTablesMock = async (): Promise<TableData[]> => {
    return [
        { id: "1", name: "A1", status: "OCCUPIED", capacity: 4, active_order_id: "order-1", current_total_amount: 580, floor: "1. Kat" },
        { id: "2", name: "A2", status: "EMPTY", capacity: 2, active_order_id: null, current_total_amount: 0, floor: "1. Kat" },
        { id: "3", name: "A3", status: "EMPTY", capacity: 4, active_order_id: null, current_total_amount: 0, floor: "1. Kat" },
        { id: "4", name: "A4", status: "OCCUPIED", capacity: 6, active_order_id: "order-4", current_total_amount: 320, floor: "1. Kat" },
        { id: "5", name: "A5", status: "EMPTY", capacity: 2, active_order_id: null, current_total_amount: 0, floor: "1. Kat" },
        { id: "6", name: "B1", status: "OCCUPIED", capacity: 6, active_order_id: "order-2", current_total_amount: 1410, floor: "Bahçe" },
        { id: "7", name: "B2", status: "EMPTY", capacity: 4, active_order_id: null, current_total_amount: 0, floor: "Bahçe" },
        { id: "8", name: "B3", status: "EMPTY", capacity: 4, active_order_id: null, current_total_amount: 0, floor: "Bahçe" },
        { id: "9", name: "B4", status: "OCCUPIED", capacity: 8, active_order_id: "order-5", current_total_amount: 2150, floor: "Bahçe" },
        { id: "10", name: "T1", status: "OCCUPIED", capacity: 4, active_order_id: "order-3", current_total_amount: 250, floor: "Teras" },
        { id: "11", name: "T2", status: "EMPTY", capacity: 2, active_order_id: null, current_total_amount: 0, floor: "Teras" },
        { id: "12", name: "T3", status: "EMPTY", capacity: 4, active_order_id: null, current_total_amount: 0, floor: "Teras" },
    ];
};

export default function GarsonMasalarPage() {
    const router = useRouter();
    const [tables, setTables] = useState<TableData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState<string>("Tümü");
    const [isSelectOpen, setIsSelectOpen] = useState(false);

    const floors = ["Tümü", "1. Kat", "Bahçe", "Teras"];

    useEffect(() => {
        fetchTablesMock().then((data) => {
            setTables(data);
            setLoading(false);
        });
    }, []);

    const filteredTables = selectedFloor === "Tümü"
        ? tables
        : tables.filter(t => t.floor === selectedFloor);

    const occupiedCount = filteredTables.filter(t => t.status === "OCCUPIED").length;
    const emptyCount = filteredTables.filter(t => t.status === "EMPTY").length;

    const handleTableClick = (tableId: string) => {
        router.push(`/garson/${tableId}`);
    };

    return (
        <div className="min-h-screen font-sans" style={{ background: "#0d0d0d" }}>

            {/* ── Header ── */}
            <header style={{
                background: "linear-gradient(180deg, #111111 0%, #0d0d0d 100%)",
                borderBottom: "1px solid rgba(234,179,8,0.12)",
            }}>
                <div style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    padding: "14px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    {/* Logo + Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "42px", height: "42px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)",
                            boxShadow: "0 0 18px rgba(234,179,8,0.35)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <Utensils size={20} color="#000" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ color: "#eab308", fontWeight: 800, fontSize: "16px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                Premium Resto
                            </div>
                            <div style={{ color: "#6b7280", fontSize: "11px", letterSpacing: "0.06em", marginTop: "1px" }}>
                                Garson Paneli
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            title="Masa Taşı"
                            style={{
                                padding: "10px",
                                background: "rgba(234,179,8,0.08)",
                                border: "1px solid rgba(234,179,8,0.18)",
                                borderRadius: "12px",
                                color: "#eab308",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(234,179,8,0.18)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(234,179,8,0.08)";
                            }}
                        >
                            <ArrowRightLeft size={17} />
                        </button>
                        <button
                            title="Masa Birleştir"
                            style={{
                                padding: "10px",
                                background: "rgba(234,179,8,0.08)",
                                border: "1px solid rgba(234,179,8,0.18)",
                                borderRadius: "12px",
                                color: "#eab308",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(234,179,8,0.18)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(234,179,8,0.08)";
                            }}
                        >
                            <Users size={17} />
                        </button>
                        <button
                            title="Çıkış"
                            style={{
                                padding: "10px",
                                background: "rgba(239,68,68,0.08)",
                                border: "1px solid rgba(239,68,68,0.18)",
                                borderRadius: "12px",
                                color: "#ef4444",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.18)";
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
                            }}
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 24px 60px" }}>

                {/* ── Stats + Filter Row ── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px",
                    marginBottom: "28px",
                }}>
                    {/* Stat Pills */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "50px",
                            background: "rgba(234,179,8,0.08)",
                            border: "1px solid rgba(234,179,8,0.2)",
                        }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eab308" }} />
                            <span style={{ color: "#d1d5db", fontSize: "13px", fontWeight: 500 }}>
                                <span style={{ color: "#eab308", fontWeight: 700 }}>{filteredTables.length}</span>
                                {" "}Toplam Masa
                            </span>
                        </div>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "50px",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                        }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                            <span style={{ color: "#d1d5db", fontSize: "13px", fontWeight: 500 }}>
                                <span style={{ color: "#f87171", fontWeight: 700 }}>{occupiedCount}</span>
                                {" "}Dolu
                            </span>
                        </div>
                        <div style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 16px",
                            borderRadius: "50px",
                            background: "rgba(34,197,94,0.08)",
                            border: "1px solid rgba(34,197,94,0.2)",
                        }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                            <span style={{ color: "#d1d5db", fontSize: "13px", fontWeight: 500 }}>
                                <span style={{ color: "#4ade80", fontWeight: 700 }}>{emptyCount}</span>
                                {" "}Boş
                            </span>
                        </div>
                    </div>

                    {/* Floor Filter */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                            KAT:
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                            {floors.map(floor => (
                                <button
                                    key={floor}
                                    onClick={() => setSelectedFloor(floor)}
                                    style={{
                                        padding: "7px 14px",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        letterSpacing: "0.04em",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        border: selectedFloor === floor
                                            ? "1px solid #eab308"
                                            : "1px solid rgba(255,255,255,0.06)",
                                        background: selectedFloor === floor
                                            ? "linear-gradient(135deg, #eab308 0%, #ca8a04 100%)"
                                            : "rgba(255,255,255,0.04)",
                                        color: selectedFloor === floor ? "#000" : "#9ca3af",
                                        boxShadow: selectedFloor === floor ? "0 0 12px rgba(234,179,8,0.25)" : "none",
                                    }}
                                >
                                    {floor}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    marginBottom: "20px",
                }}>
                    <div style={{
                        height: "2px", flex: 1,
                        background: "linear-gradient(90deg, rgba(234,179,8,0.5) 0%, rgba(234,179,8,0.0) 100%)",
                        borderRadius: "2px",
                    }} />
                    <span style={{
                        color: "#eab308",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                    }}>
                        {selectedFloor === "Tümü" ? "Tüm Masalar" : selectedFloor}
                    </span>
                    <div style={{
                        height: "2px", flex: 1,
                        background: "linear-gradient(90deg, rgba(234,179,8,0.0) 0%, rgba(234,179,8,0.5) 100%)",
                        borderRadius: "2px",
                    }} />
                </div>

                {/* ── Table Grid ── */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "80px" }}>
                        <div style={{
                            width: "40px", height: "40px",
                            border: "3px solid rgba(234,179,8,0.15)",
                            borderTop: "3px solid #eab308",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                        gap: "12px",
                    }}>
                        {filteredTables.map(table => {
                            const isOccupied = table.status === "OCCUPIED";

                            return (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableClick(table.id)}
                                    style={{
                                        position: "relative",
                                        aspectRatio: "1/1",
                                        borderRadius: "18px",
                                        border: isOccupied
                                            ? "1.5px solid rgba(239,68,68,0.35)"
                                            : "1.5px solid rgba(34,197,94,0.3)",
                                        background: isOccupied
                                            ? "linear-gradient(145deg, rgba(60,10,10,0.85) 0%, rgba(40,6,6,0.95) 100%)"
                                            : "linear-gradient(145deg, rgba(6,38,12,0.85) 0%, rgba(4,28,10,0.95) 100%)",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        padding: "12px 8px",
                                        transition: "all 0.25s ease",
                                        boxShadow: isOccupied
                                            ? "0 4px 20px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
                                            : "0 4px 20px rgba(34,197,94,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                                    }}
                                    onMouseEnter={e => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.transform = "translateY(-3px) scale(1.02)";
                                        btn.style.boxShadow = isOccupied
                                            ? "0 8px 30px rgba(239,68,68,0.22), inset 0 1px 0 rgba(255,255,255,0.06)"
                                            : "0 8px 30px rgba(34,197,94,0.18), inset 0 1px 0 rgba(255,255,255,0.06)";
                                    }}
                                    onMouseLeave={e => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.transform = "translateY(0) scale(1)";
                                        btn.style.boxShadow = isOccupied
                                            ? "0 4px 20px rgba(239,68,68,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
                                            : "0 4px 20px rgba(34,197,94,0.08), inset 0 1px 0 rgba(255,255,255,0.04)";
                                    }}
                                >
                                    {/* Soft radial glow in background */}
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        background: isOccupied
                                            ? "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.12) 0%, transparent 70%)"
                                            : "radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.10) 0%, transparent 70%)",
                                        pointerEvents: "none",
                                    }} />

                                    {/* Status dot (top right) */}
                                    <div style={{
                                        position: "absolute",
                                        top: "8px", right: "8px",
                                        width: "7px", height: "7px",
                                        borderRadius: "50%",
                                        background: isOccupied ? "#ef4444" : "#22c55e",
                                        boxShadow: isOccupied
                                            ? "0 0 6px rgba(239,68,68,0.7)"
                                            : "0 0 6px rgba(34,197,94,0.7)",
                                    }} />

                                    {/* Table Name Badge */}
                                    <div style={{
                                        width: "44px", height: "44px",
                                        borderRadius: "12px",
                                        background: isOccupied
                                            ? "linear-gradient(135deg, rgba(239,68,68,0.25) 0%, rgba(185,28,28,0.35) 100%)"
                                            : "linear-gradient(135deg, rgba(234,179,8,0.20) 0%, rgba(161,121,5,0.30) 100%)",
                                        border: isOccupied
                                            ? "1px solid rgba(239,68,68,0.35)"
                                            : "1px solid rgba(234,179,8,0.3)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "14px",
                                        color: isOccupied ? "#fca5a5" : "#fde047",
                                        letterSpacing: "0.05em",
                                        flexShrink: 0,
                                        zIndex: 1,
                                    }}>
                                        {table.name}
                                    </div>

                                    {/* Capacity */}
                                    <span style={{
                                        color: "#6b7280",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        zIndex: 1,
                                    }}>
                                        {table.capacity} kişi
                                    </span>

                                    {/* Status / Amount */}
                                    {isOccupied ? (
                                        <span style={{
                                            fontWeight: 800,
                                            fontSize: "12px",
                                            color: "#fbbf24",
                                            letterSpacing: "0.03em",
                                            zIndex: 1,
                                        }}>
                                            ₺{table.current_total_amount.toLocaleString("tr-TR")}
                                        </span>
                                    ) : (
                                        <span style={{
                                            fontWeight: 700,
                                            fontSize: "10px",
                                            color: "#4ade80",
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                            zIndex: 1,
                                        }}>
                                            Boş
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredTables.length === 0 && (
                    <div style={{
                        textAlign: "center",
                        marginTop: "80px",
                        color: "#4b5563",
                    }}>
                        <Utensils size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                        <p style={{ fontSize: "16px", fontWeight: 500 }}>Bu katta masa bulunamadı.</p>
                    </div>
                )}

            </main>

            {/* Bottom Footer */}
            <div style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(0deg, #0d0d0d 60%, transparent 100%)",
                padding: "20px 24px 14px",
                display: "flex", justifyContent: "center",
                pointerEvents: "none",
            }}>
                <div style={{
                    width: "48px", height: "4px",
                    borderRadius: "2px",
                    background: "rgba(234,179,8,0.25)",
                }} />
            </div>

        </div>
    );
}
