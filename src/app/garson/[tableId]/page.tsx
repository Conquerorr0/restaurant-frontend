"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, Minus, ShoppingBag, CheckCircle2,
    ChevronRight, UtensilsCrossed, Trash2, Receipt, X, ChevronUp, MessageSquare
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { menuService } from "@/services/menuService";
import { orderService } from "@/services/orderService";
import { tableService } from "@/services/tableService";

import { Category as ServiceCategory, Product as ServiceProduct } from "@/services/menuService";
import { Order, OrderItem } from "@/services/orderService";

/* ─── Types ─── */
interface Product { id: string; name: string; price: number; }
interface Category { id: string; name: string; emoji: string; products: Product[]; }

// Mock data functions removed

/* ─── Page ─── */
export default function OrderPage({ params }: { params: Promise<{ tableId: string }> | { tableId: string } }) {
    const router = useRouter();
    const { token } = useAuth();
    const resolvedParams = "then" in params ? use(params as any) : params;
    const tableId = (resolvedParams as any).tableId;

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const [tableName, setTableName] = useState("");
    const [localCart, setLocalCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [orderNote, setOrderNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;

        const init = async () => {
            try {
                // Fetch everything in parallel for better speed and no UI flicker
                const [catRes, prodRes, tableRes] = await Promise.all([
                    menuService.getCategories(token),
                    menuService.getProducts(token),
                    tableService.getTableById(tableId, token).catch(() => null)
                ]);

                if (catRes.success && prodRes.success) {
                    const grouped: Category[] = catRes.data.map(cat => ({
                        id: cat.id,
                        name: cat.name,
                        emoji: "🍴",
                        products: prodRes.data
                            .filter(p => p.category_id === cat.id)
                            .map(p => ({ id: p.id, name: p.name, price: p.price }))
                    })).filter(cat => cat.products.length > 0);

                    setCategories(grouped);
                    if (grouped.length > 0) setActiveCategoryId(grouped[0].id);
                }

                if (tableRes && tableRes.success) {
                    setTableName(tableRes.data.name);
                }

                // Fetch active order separately or in parallel
                try {
                    const orderRes = await orderService.getActiveOrder(tableId, token);
                    if (orderRes.success && orderRes.data) {
                        setOrder(orderRes.data);
                    }
                } catch (e) {
                    setOrder(null);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error initializing order page:", error);
                setLoading(false);
            }
        };
        init();
    }, [tableId, token]);

    const handleConfirmOrder = async () => {
        if (localCart.length === 0 || !token) return;

        setIsSubmitting(true);
        try {
            const items = localCart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity
            }));

            const response = await orderService.createOrUpdateOrder({
                tableId,
                items
            }, token);

            if (response.success) {
                // Refresh order data
                const orderRes = await orderService.getActiveOrder(tableId, token);
                if (orderRes.success && orderRes.data) {
                    setOrder(orderRes.data);
                }
                setLocalCart([]);
                setOrderNote("");
                setCartOpen(false);
                alert("Sipariş başarıyla gönderildi!");
            }
        } catch (error: any) {
            alert("Sipariş gönderilirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdd = (product: Product) =>
        setLocalCart(prev => {
            const ex = prev.find(i => i.product.id === product.id);
            return ex
                ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
                : [...prev, { product, quantity: 1 }];
        });

    const handleRemove = (productId: string) =>
        setLocalCart(prev =>
            prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i)
                .filter(i => i.quantity > 0)
        );

    const getQty = (pid: string) => localCart.find(i => i.product.id === pid)?.quantity || 0;
    const localTotal = localCart.reduce((a, i) => a + i.product.price * i.quantity, 0);
    const grandTotal = (order?.total_amount || 0) + localTotal;
    const cartCount = localCart.reduce((a, i) => a + i.quantity, 0);
    const currentCategory = categories.find(c => c.id === activeCategoryId);

    /* ─── Cart content (reused in sidebar & bottom sheet) ─── */
    const CartContent = ({ onClose }: { onClose?: () => void }) => (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Sepet */}
            <div style={{
                borderRadius: "16px",
                border: "1px solid rgba(234,179,8,0.18)",
                background: "linear-gradient(145deg,rgba(20,18,10,0.98),rgba(15,14,10,1))",
                overflow: "hidden",
            }}>
                <div style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid rgba(234,179,8,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <Receipt size={13} color="#eab308" />
                        <span style={{ fontWeight: 700, fontSize: "12px", color: "#eab308", letterSpacing: "0.1em" }}>SEPET</span>
                    </div>
                    {cartCount > 0 && (
                        <span style={{
                            background: "#eab308", color: "#000",
                            fontSize: "10px", fontWeight: 800,
                            padding: "2px 7px", borderRadius: "20px",
                        }}>{cartCount}</span>
                    )}
                </div>
                <div style={{ padding: "6px" }}>
                    {localCart.length === 0 ? (
                        <div style={{ padding: "18px", textAlign: "center", color: "#4b5563", fontSize: "13px" }}>
                            <ShoppingBag size={24} style={{ margin: "0 auto 6px", opacity: 0.3 }} />
                            Henüz ürün eklenmedi
                        </div>
                    ) : (
                        localCart.map(({ product, quantity }) => (
                            <div key={product.id} style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "7px 8px", borderRadius: "9px",
                            }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {product.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#eab308", fontWeight: 700, marginTop: "1px" }}>
                                        {quantity} × ₺{product.price} = ₺{(quantity * product.price).toLocaleString("tr-TR")}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setLocalCart(prev => prev.filter(i => i.product.id !== product.id))}
                                    style={{
                                        padding: "5px", background: "rgba(239,68,68,0.08)",
                                        border: "none", borderRadius: "7px", color: "#ef4444",
                                        cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
                                    }}
                                ><Trash2 size={12} /></button>
                            </div>
                        ))
                    )}
                </div>
                {localCart.length > 0 && (
                    <div style={{ padding: "12px", borderTop: "1px solid rgba(234,179,8,0.1)" }}>
                        {/* Sipariş Notu */}
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                                <MessageSquare size={13} color="#9ca3af" />
                                <span style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>SİPARİŞ NOTU</span>
                            </div>
                            <textarea
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                placeholder="Örn: Acısız olsun, ekstra malzeme..."
                                style={{
                                    width: "100%", height: "54px", padding: "8px 10px",
                                    borderRadius: "8px", background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb",
                                    fontSize: "12px", outline: "none", resize: "none",
                                    fontFamily: "inherit",
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Eklenecek</span>
                            <span style={{ fontSize: "15px", fontWeight: 800, color: "#fde047" }}>₺{localTotal.toLocaleString("tr-TR")}</span>
                        </div>
                        <button
                            onClick={handleConfirmOrder}
                            disabled={isSubmitting}
                            style={{
                                width: "100%", padding: "11px",
                                borderRadius: "11px",
                                background: isSubmitting ? "#6b7280" : "linear-gradient(135deg,#eab308,#ca8a04)",
                                border: "none", color: "#000", fontWeight: 800, fontSize: "13px",
                                letterSpacing: "0.06em", cursor: isSubmitting ? "not-allowed" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                                boxShadow: isSubmitting ? "none" : "0 4px 18px rgba(234,179,8,0.3)",
                            }}>
                            {isSubmitting ? (
                                <div style={{
                                    width: "14px", height: "14px",
                                    border: "2px solid rgba(0,0,0,0.1)",
                                    borderTop: "2px solid #000",
                                    borderRadius: "50%", animation: "spin 0.6s linear infinite",
                                }} />
                            ) : (
                                <ShoppingBag size={14} strokeWidth={2.5} />
                            )}
                            {isSubmitting ? "GÖNDERİLİYOR..." : "SİPARİŞİ ONAYLA"}
                            {!isSubmitting && <ChevronRight size={13} strokeWidth={2.5} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Mevcut Sipariş Özeti */}
            {order && (
                <div style={{
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                    overflow: "hidden",
                }}>
                    <div style={{
                        padding: "9px 13px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>Masa Toplamı</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#f87171" }}>₺{order.total_amount.toLocaleString("tr-TR")}</span>
                    </div>
                    <div style={{ padding: "4px 6px" }}>
                        {order.items.map(item => (
                            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 7px" }}>
                                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                                    <span style={{ color: "#4ade80", fontWeight: 700 }}>{item.quantity}×</span>{" "}{item.product_name}
                                </span>
                                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 600 }}>₺{item.subtotal}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        padding: "9px 13px",
                        borderTop: "1px solid rgba(234,179,8,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>Genel Toplam</span>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#eab308" }}>₺{grandTotal.toLocaleString("tr-TR")}</span>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#0d0d0d", fontFamily: "sans-serif", color: "#e5e7eb" }}>

            {/* ─── Global styles ─── */}
            <style>{`
                *, *::before, *::after { box-sizing: border-box; }
                html, body { overflow-x: hidden; max-width: 100vw; }

                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

                /* ── Desktop (>768px): two-column grid, sidebar visible ── */
                .layout-grid      { display: grid; grid-template-columns: 1fr 300px; gap: 18px; }
                .desktop-sidebar  { display: block; }
                .mobile-fab       { display: none !important; }

                /* Desktop product grid */
                .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }

                /* ── Mobile (≤768px): single column, bottom sheet ── */
                @media (max-width: 768px) {
                    .layout-grid      { grid-template-columns: 1fr !important; }
                    .desktop-sidebar  { display: none !important; }
                    .mobile-fab       { display: flex !important; }
                    .header-total     { display: none !important; }

                    /* On mobile, each product card is a single full-width row */
                    .product-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
                    .product-card-inner { flex-direction: row !important; align-items: center !important; }
                }
            `}</style>

            {/* ─── Header ─── */}
            <header style={{
                background: "linear-gradient(180deg,#111 0%,#0d0d0d 100%)",
                borderBottom: "1px solid rgba(234,179,8,0.12)",
                position: "sticky", top: 0, zIndex: 30,
            }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "11px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={() => router.push('/garson')}
                        style={{
                            padding: "9px", background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)", borderRadius: "11px",
                            color: "#9ca3af", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                    ><ArrowLeft size={17} /></button>

                    <div style={{
                        display: "flex", alignItems: "center", gap: "7px",
                        padding: "7px 13px",
                        background: "rgba(234,179,8,0.10)",
                        border: "1px solid rgba(234,179,8,0.25)",
                        borderRadius: "11px", flexShrink: 0,
                    }}>
                        <UtensilsCrossed size={14} color="#eab308" />
                        <span style={{ color: "#eab308", fontWeight: 700, fontSize: "13px", letterSpacing: "0.1em" }}>MASA {tableName || "..."}</span>
                    </div>

                    <div style={{
                        padding: "5px 10px", borderRadius: "8px",
                        fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0,
                        background: order ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                        border: `1px solid ${order ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`,
                        color: order ? "#f87171" : "#4ade80",
                    }}>{order ? "Açık Sipariş" : "Yeni Sipariş"}</div>

                    <div style={{ flex: 1 }} />

                    <div className="header-total" style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "0.08em", fontWeight: 600 }}>TOPLAM</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#eab308" }}>₺{grandTotal.toLocaleString("tr-TR")}</div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                    <div style={{
                        width: "34px", height: "34px",
                        border: "3px solid rgba(234,179,8,0.15)",
                        borderTop: "3px solid #eab308",
                        borderRadius: "50%", animation: "spin 0.8s linear infinite",
                    }} />
                </div>
            ) : (
                <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 16px 120px", width: "100%" }}>
                    <div className="layout-grid">

                        {/* ══ LEFT: Menu ══ */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>

                            {/* Category tabs */}
                            <div className="scrollbar-hide" style={{ display: "flex", gap: "7px", overflowX: "auto" }}>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategoryId(cat.id)}
                                        style={{
                                            padding: "8px 13px", borderRadius: "10px",
                                            fontSize: "13px", fontWeight: 700, cursor: "pointer",
                                            transition: "all 0.18s", whiteSpace: "nowrap", flexShrink: 0,
                                            border: activeCategoryId === cat.id ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.07)",
                                            background: activeCategoryId === cat.id ? "linear-gradient(135deg,#eab308,#ca8a04)" : "rgba(255,255,255,0.04)",
                                            color: activeCategoryId === cat.id ? "#000" : "#9ca3af",
                                            boxShadow: activeCategoryId === cat.id ? "0 0 12px rgba(234,179,8,0.22)" : "none",
                                        }}
                                    >{cat.emoji} {cat.name}</button>
                                ))}
                            </div>

                            {/* Section divider */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg,rgba(234,179,8,0.4),transparent)" }} />
                                <span style={{ color: "#eab308", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                                    {currentCategory?.name}
                                </span>
                                <div style={{ height: "1px", flex: 1, background: "linear-gradient(90deg,transparent,rgba(234,179,8,0.4))" }} />
                            </div>

                            {/* ── Product Grid ── */}
                            <div className="product-grid">
                                {currentCategory?.products.map(product => {
                                    const qty = getQty(product.id);
                                    const selected = qty > 0;
                                    return (
                                        <div
                                            key={product.id}
                                            style={{
                                                padding: "11px 13px",
                                                borderRadius: "13px",
                                                border: selected ? "1px solid rgba(234,179,8,0.4)" : "1px solid rgba(255,255,255,0.07)",
                                                background: selected ? "rgba(234,179,8,0.06)" : "rgba(255,255,255,0.03)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "10px",
                                                /* Critical: prevent card from overflowing */
                                                minWidth: 0,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: 600, fontSize: "14px", color: "#e5e7eb",
                                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {product.name}
                                                </div>
                                                <div style={{ color: "#eab308", fontWeight: 700, fontSize: "13px", marginTop: "3px" }}>
                                                    ₺{product.price}
                                                </div>
                                            </div>

                                            {/* Controls — fixed width, never shrinks */}
                                            <div style={{ flexShrink: 0 }}>
                                                {selected ? (
                                                    <div style={{
                                                        display: "flex", alignItems: "center", gap: "5px",
                                                        background: "rgba(234,179,8,0.08)",
                                                        border: "1px solid rgba(234,179,8,0.25)",
                                                        borderRadius: "9px", padding: "4px",
                                                    }}>
                                                        <button
                                                            onClick={() => handleRemove(product.id)}
                                                            style={{
                                                                width: "30px", height: "30px", borderRadius: "6px",
                                                                background: "rgba(255,255,255,0.07)", border: "none",
                                                                color: "#fff", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                            }}
                                                        ><Minus size={13} strokeWidth={2.5} /></button>
                                                        <span style={{ fontWeight: 800, fontSize: "14px", minWidth: "18px", textAlign: "center", color: "#eab308" }}>{qty}</span>
                                                        <button
                                                            onClick={() => handleAdd(product)}
                                                            style={{
                                                                width: "30px", height: "30px", borderRadius: "6px",
                                                                background: "#eab308", border: "none",
                                                                color: "#000", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                            }}
                                                        ><Plus size={13} strokeWidth={2.5} /></button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAdd(product)}
                                                        style={{
                                                            width: "36px", height: "36px", borderRadius: "10px",
                                                            background: "rgba(234,179,8,0.10)",
                                                            border: "1px solid rgba(234,179,8,0.25)",
                                                            color: "#eab308", cursor: "pointer",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}
                                                    ><Plus size={16} strokeWidth={2.5} /></button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Existing order items on table */}
                            {order && order.items.length > 0 && (
                                <div style={{
                                    borderRadius: "13px",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                    background: "rgba(255,255,255,0.02)",
                                    overflow: "hidden",
                                }}>
                                    <div style={{
                                        padding: "9px 13px",
                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                        display: "flex", alignItems: "center", gap: "7px",
                                    }}>
                                        <CheckCircle2 size={13} color="#22c55e" />
                                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase" }}>
                                            Masada Mevcut Sipariş
                                        </span>
                                    </div>
                                    <div style={{ padding: "4px 6px" }}>
                                        {order.items.map(item => (
                                            <div key={item.id} style={{
                                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                                padding: "6px 7px", gap: "8px",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "7px", minWidth: 0 }}>
                                                    <span style={{
                                                        background: "rgba(34,197,94,0.12)", color: "#4ade80",
                                                        fontSize: "11px", fontWeight: 700,
                                                        padding: "2px 6px", borderRadius: "5px",
                                                        border: "1px solid rgba(34,197,94,0.2)", flexShrink: 0,
                                                    }}>{item.quantity}x</span>
                                                    <span style={{ color: "#9ca3af", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {item.product_name}
                                                    </span>
                                                </div>
                                                <span style={{ color: "#eab308", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>₺{item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══ RIGHT: Desktop Sidebar ══ */}
                        <div className="desktop-sidebar" style={{ position: "sticky", top: "68px", alignSelf: "start" }}>
                            <CartContent />
                        </div>

                    </div>
                </main>
            )}

            {/* ══ Mobile: Floating Cart Button ══ */}
            <div
                className="mobile-fab"
                style={{
                    position: "fixed", bottom: "18px", left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 40,
                    alignItems: "center",
                }}
            >
                <button
                    onClick={() => setCartOpen(true)}
                    style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "13px 22px", borderRadius: "50px",
                        background: "linear-gradient(135deg,#eab308,#ca8a04)",
                        border: "none", color: "#000",
                        fontWeight: 800, fontSize: "14px",
                        cursor: "pointer",
                        boxShadow: "0 6px 26px rgba(234,179,8,0.45)",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                    }}
                >
                    <ShoppingBag size={16} strokeWidth={2.5} />
                    {cartCount > 0 ? `SEPETİ GÖR  (${cartCount})` : `TOPLAM  ₺${grandTotal.toLocaleString("tr-TR")}`}
                </button>
            </div>

            {/* ══ Mobile: Bottom Sheet ══ */}
            {cartOpen && (
                <>
                    <div
                        onClick={() => setCartOpen(false)}
                        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 45 }}
                    />
                    <div style={{
                        position: "fixed", bottom: 0, left: 0, right: 0,
                        zIndex: 50,
                        background: "#141414",
                        borderTop: "1px solid rgba(234,179,8,0.2)",
                        borderRadius: "22px 22px 0 0",
                        padding: "0 14px 28px",
                        maxHeight: "85vh", overflowY: "auto",
                        animation: "slideUp 0.25s ease",
                    }}>
                        {/* Handle row */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "13px 2px 10px",
                            position: "sticky", top: 0,
                            background: "#141414",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            marginBottom: "10px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                <ChevronUp size={15} color="#eab308" />
                                <span style={{ color: "#eab308", fontWeight: 700, fontSize: "13px", letterSpacing: "0.08em" }}>
                                    SEPET & SİPARİŞ
                                </span>
                            </div>
                            <button
                                onClick={() => setCartOpen(false)}
                                style={{
                                    padding: "6px", background: "rgba(255,255,255,0.06)",
                                    border: "none", borderRadius: "8px", color: "#6b7280", cursor: "pointer",
                                    display: "flex", alignItems: "center",
                                }}
                            ><X size={15} /></button>
                        </div>
                        <CartContent onClose={() => setCartOpen(false)} />
                    </div>
                </>
            )}
        </div>
    );
}
