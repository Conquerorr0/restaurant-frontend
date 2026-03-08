"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, Minus, ShoppingBag, CheckCircle2,
    ChevronRight, UtensilsCrossed, Trash2, Receipt, X, ChevronUp, MessageSquare
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { menuService } from "@/services/menuService";
import { orderService } from "@/services/orderService";
import { tableService } from "@/services/tableService";

interface Product { id: string; name: string; price: number; }
interface Category { id: string; name: string; emoji: string; products: Product[]; }

export default function OrderPage({ params }: { params: Promise<{ tableId: string }> | { tableId: string } }) {
    const router = useRouter();
    const { token } = useAuth();
    const { showAlert } = useModal();
    const resolvedParams = "then" in params ? use(params as any) : params;
    const tableId = (resolvedParams as any).tableId;

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [tableName, setTableName] = useState("");
    const [localCart, setLocalCart] = useState<{ product: Product; quantity: number }[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [orderNote, setOrderNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;

        const init = async () => {
            try {
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
                items,
                note: orderNote.trim()
            }, token);

            if (response.success) {
                const orderRes = await orderService.getActiveOrder(tableId, token);
                if (orderRes.success && orderRes.data) {
                    setOrder(orderRes.data);
                }
                setLocalCart([]);
                setOrderNote("");
                setCartOpen(false);
                await showAlert("Sipariş başarıyla gönderildi!", "success");
            }
        } catch (error: any) {
            await showAlert("Sipariş gönderilirken hata oluştu: " + (error.message || "Bilinmeyen hata"), "error");
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

    return (
        <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "sans-serif", color: "var(--foreground)" }}>
            <style>{`
                *, *::before, *::after { box-sizing: border-box; }
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .layout-grid      { display: grid; grid-template-columns: 1fr 300px; gap: 18px; }
                .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
                @media (max-width: 768px) {
                    .layout-grid      { grid-template-columns: 1fr !important; }
                    .desktop-sidebar  { display: none !important; }
                    .product-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
                }
            `}</style>

            <header style={{ background: "var(--card-alt)", borderBottom: "1px solid rgba(234,179,8,0.12)", position: "sticky", top: 0, zIndex: 30 }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "11px 16px", display: "flex", alignItems: "center", gap: "10px", paddingRight: "100px" }}>
                    <button onClick={() => router.push('/garson')} style={{ padding: "9px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "11px", color: "var(--muted)", cursor: "pointer" }}><ArrowLeft size={17} /></button>
                    <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "11px", padding: "7px 13px", display: "flex", alignItems: "center", gap: "7px" }}>
                        <UtensilsCrossed size={14} color="#eab308" />
                        <span style={{ color: "#eab308", fontWeight: 700, fontSize: "13px" }}>MASA {tableName || "..."}</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "10px", color: "var(--muted)" }}>TOPLAM</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#eab308" }}>₺{grandTotal.toLocaleString("tr-TR")}</div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}><div style={{ width: "34px", height: "34px", border: "3px solid rgba(234,179,8,0.15)", borderTop: "3px solid #eab308", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>
            ) : (
                <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 16px 120px", width: "100%" }}>
                    <div className="layout-grid">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", gap: "7px", overflowX: "auto", paddingBottom: "5px" }}>
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)} style={{ padding: "8px 13px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: activeCategoryId === cat.id ? "1px solid #eab308" : "1px solid rgba(255,255,255,0.07)", background: activeCategoryId === cat.id ? "#eab308" : "rgba(255,255,255,0.04)", color: activeCategoryId === cat.id ? "var(--background)" : "var(--muted)" }}>{cat.emoji} {cat.name}</button>
                                ))}
                            </div>
                            <div className="product-grid">
                                {currentCategory?.products.map(product => (
                                    <div key={product.id} style={{ padding: "11px 13px", borderRadius: "13px", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "14px" }}>{product.name}</div>
                                            <div style={{ color: "#eab308", fontWeight: 700 }}>₺{product.price}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {getQty(product.id) > 0 && (
                                                <>
                                                    <button
                                                        onClick={() => handleRemove(product.id)}
                                                        style={{
                                                            width: "32px", height: "32px",
                                                            background: "rgba(255,255,255,0.08)",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "8px", color: "var(--foreground)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span style={{ fontWeight: 800, color: "#eab308", minWidth: "16px", textAlign: "center" }}>{getQty(product.id)}</span>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleAdd(product)}
                                                style={{
                                                    width: "32px", height: "32px",
                                                    background: "#eab308",
                                                    border: "none", borderRadius: "8px", color: "var(--background)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 8px rgba(234,179,8,0.2)"
                                                }}
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {order && (
                                <div style={{ marginTop: "20px", padding: "15px", borderRadius: "13px", background: "var(--card-alt)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 700, marginBottom: "10px" }}>MASADA MEVCUT SİPARİŞ</div>
                                    {order.items.map((item: any) => (
                                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "14px" }}>
                                            <span>{item.quantity}x {item.product_name}</span>
                                            <span style={{ color: "#eab308" }}>₺{item.subtotal}</span>
                                        </div>
                                    ))}
                                    {order.note && (
                                        <div style={{ marginTop: "10px", padding: "8px", background: "rgba(234,179,8,0.05)", borderRadius: "8px", border: "1px dashed rgba(234,179,8,0.2)" }}>
                                            <div style={{ fontSize: "10px", color: "#eab308", fontWeight: 800 }}>NOT:</div>
                                            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{order.note}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <aside className="desktop-sidebar">
                            <CartContent
                                cartCount={cartCount}
                                localCart={localCart}
                                setLocalCart={setLocalCart}
                                orderNote={orderNote}
                                setOrderNote={setOrderNote}
                                localTotal={localTotal}
                                handleConfirmOrder={handleConfirmOrder}
                                isSubmitting={isSubmitting}
                            />
                        </aside>
                    </div>
                </main>
            )}

            {!loading && (
                <div style={{ position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", zIndex: 40 }} className="mobile-fab">
                    <button onClick={() => setCartOpen(true)} style={{ padding: "12px 24px", borderRadius: "50px", background: "#eab308", color: "var(--background)", fontWeight: 800, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                        SEPETİ GÖR ({cartCount})
                    </button>
                </div>
            )}

            {cartOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
                    <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--card-alt)", borderRadius: "20px 20px 0 0", padding: "20px", maxHeight: "80vh", overflowY: "auto", animation: "slideUp 0.3s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                            <span style={{ fontWeight: 800, color: "#eab308" }}>SEPET</span>
                            <button onClick={() => setCartOpen(false)}><X size={20} /></button>
                        </div>
                        <CartContent
                            cartCount={cartCount}
                            localCart={localCart}
                            setLocalCart={setLocalCart}
                            orderNote={orderNote}
                            setOrderNote={setOrderNote}
                            localTotal={localTotal}
                            handleConfirmOrder={handleConfirmOrder}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function CartContent({ cartCount, localCart, setLocalCart, orderNote, setOrderNote, localTotal, handleConfirmOrder, isSubmitting }: any) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {localCart.map((item: any) => (
                <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{item.product.name}</div>
                        <div style={{ fontSize: "11px", color: "#eab308" }}>{item.quantity} x ₺{item.product.price}</div>
                    </div>
                    <button onClick={() => setLocalCart((prev: any) => prev.filter((i: any) => i.product.id !== item.product.id))} style={{ color: "#ef4444" }}><Trash2 size={16} /></button>
                </div>
            ))}

            {localCart.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                    <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>SİPARİŞ NOTU</div>
                        <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Notunuz..."
                            style={{ width: "100%", height: "60px", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--foreground)", padding: "8px", fontSize: "12px", resize: "none" }}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span>Eklenecek</span>
                        <span style={{ color: "#eab308", fontWeight: 800 }}>₺{localTotal}</span>
                    </div>
                    <button onClick={handleConfirmOrder} disabled={isSubmitting} style={{ width: "100%", padding: "12px", background: "#eab308", color: "var(--background)", fontWeight: 800, borderRadius: "8px", cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                        {isSubmitting ? "GÖNDERİLİYOR..." : "SİPARİŞİ ONAYLA"}
                    </button>
                </div>
            )}
            {localCart.length === 0 && <div style={{ padding: "40px 0", textAlign: "center", color: "var(--muted)" }}>Sepet Boş</div>}
        </div>
    );
}
