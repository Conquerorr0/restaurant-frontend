"use client";

import React, { useState, useEffect } from "react";
import { Search, Pencil, Trash2, Package, Layers, X, Loader2, AlertCircle, Plus, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { menuService, Category, Product } from "@/services/menuService";

export default function MenuManagement() {
    const { token } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Data states
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Product form state
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productName, setProductName] = useState("");
    const [productCategoryId, setProductCategoryId] = useState("");
    const [productPrice, setProductPrice] = useState("");
    const [productDescription, setProductDescription] = useState("");

    // Category form state
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState("");

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                menuService.getCategories(token!),
                menuService.getProducts(token!)
            ]);
            if (catRes.success) setCategories(catRes.data);
            if (prodRes.success) setProducts(prodRes.data);
        } catch (err) {
            console.error(err);
            setError("Menü verileri yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductName(product.name);
        setProductCategoryId(product.category_id);
        setProductPrice(String(product.price));
        setProductDescription(product.description || "");
        setActiveTab("products");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelProductEdit = () => {
        setEditingProduct(null);
        setProductName("");
        setProductCategoryId("");
        setProductPrice("");
        setProductDescription("");
        setError("");
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setActiveTab("categories");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelCategoryEdit = () => {
        setEditingCategory(null);
        setCategoryName("");
        setError("");
    };

    const handleTabChange = (tab: "products" | "categories") => {
        setActiveTab(tab);
        if (tab === "products") {
            handleCancelCategoryEdit();
        } else {
            handleCancelProductEdit();
        }
    };

    const handleSubmitProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productName || !productCategoryId || !productPrice) {
            setError("Lütfen tüm alanları doldurun.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const payload = {
                name: productName,
                category_id: productCategoryId,
                price: parseFloat(productPrice),
                description: productDescription,
                is_active: true
            };

            if (editingProduct) {
                const res = await menuService.updateProduct(editingProduct.id, payload, token!);
                if (res.success) {
                    handleCancelProductEdit();
                    fetchData();
                }
            } else {
                const res = await menuService.createProduct(payload, token!);
                if (res.success) {
                    handleCancelProductEdit();
                    fetchData();
                }
            }
        } catch (err: any) {
            setError(err.message || "Ürün kaydedilirken hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryName) {
            setError("Lütfen kategori adını girin.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const payload = {
                name: categoryName,
                is_active: true,
                sort_order: categories.length + 1
            };

            if (editingCategory) {
                const res = await menuService.updateCategory(editingCategory.id, payload, token!);
                if (res.success) {
                    handleCancelCategoryEdit();
                    fetchData();
                }
            } else {
                const res = await menuService.createCategory(payload, token!);
                if (res.success) {
                    handleCancelCategoryEdit();
                    fetchData();
                }
            }
        } catch (err: any) {
            setError(err.message || "Kategori kaydedilirken hata oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!(await showConfirm("Bu ürünü silmek istediğinize emin misiniz?", "Ürün Silme Onayı"))) return;
        try {
            const res = await menuService.deleteProduct(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            await showAlert(err.message || "Silme işlemi başarısız", "error");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!(await showConfirm("Bu kategoriyi silmek istediğinize emin misiniz? Bu kategoriye ait ürünler category_id: null olabilir.", "Kategori Silme Onayı"))) return;
        try {
            const res = await menuService.deleteCategory(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            await showAlert(err.message || "Silme işlemi başarısız", "error");
        }
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1240px] mx-auto animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
                <div>
                    <h1 className="text-[28px] font-black text-[var(--foreground)] tracking-widest uppercase mb-1 drop-shadow-md italic leading-tight">
                        MENÜ YÖNETİMİ
                    </h1>
                    <p className="text-[var(--muted)] text-[14px] font-medium tracking-wide">
                        Kategori ve ürünlerinizi yönetin
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-[var(--card)] p-1 rounded-[16px] shadow-sm border border-[var(--border)]/30">
                    <button
                        onClick={() => handleTabChange("products")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] tracking-wide transition-all duration-300 ${activeTab === "products"
                            ? "bg-[#eab308] text-[var(--background)] shadow-[0_5px_15px_rgba(234,179,8,0.2)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        <Package size={16} className={activeTab === "products" ? "text-[var(--background)]" : ""} />
                        ÜRÜNLER
                    </button>
                    <button
                        onClick={() => handleTabChange("categories")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] font-bold text-[13px] tracking-wide transition-all duration-300 ${activeTab === "categories"
                            ? "bg-[#eab308] text-[var(--background)] shadow-[0_5px_15px_rgba(234,179,8,0.2)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                    >
                        <Layers size={16} className={activeTab === "categories" ? "text-[var(--background)]" : ""} />
                        KATEGORİLER
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">

                {/* Left Form Section */}
                <div className="w-full lg:w-[380px] flex-shrink-0 bg-[var(--card-alt)] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group border border-[var(--border)]/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-xs font-bold flex items-center gap-3 mb-6 relative z-20">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    {activeTab === "products" ? (
                        <form onSubmit={handleSubmitProduct} className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Package size={22} className="text-[#eab308]" />
                                    <h2 className="text-xl font-black text-[var(--foreground)] tracking-wide uppercase italic">
                                        {editingProduct ? "ÜRÜNÜ DÜZENLE" : "YENİ ÜRÜN EKLE"}
                                    </h2>
                                </div>
                                {editingProduct && (
                                    <button
                                        type="button"
                                        onClick={handleCancelProductEdit}
                                        className="w-8 h-8 rounded-[8px] bg-[var(--border)] text-[var(--muted)] flex items-center justify-center hover:bg-[var(--border-alt)] hover:text-[var(--foreground)] transition-colors"
                                        title="İptal"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em] ml-1">ÜRÜN ADI</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Adana Kebap"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--border-alt)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-[var(--border)]/30 hover:border-[var(--border-alt)]"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em] ml-1">KATEGORİ</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={productCategoryId}
                                        onChange={(e) => setProductCategoryId(e.target.value)}
                                        className="bg-[var(--background)] text-[var(--foreground)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold appearance-none border border-[var(--border)]/30 hover:border-[var(--border-alt)]"
                                    >
                                        <option value="" disabled className="text-[var(--border-alt)]">Kategori Seçin</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[var(--muted)]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em] ml-1">FİYAT (₺)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="Örn: 250"
                                    value={productPrice}
                                    onChange={(e) => setProductPrice(e.target.value)}
                                    className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--border-alt)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-black border border-[var(--border)]/30 hover:border-[var(--border-alt)]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#eab308] text-[var(--background)] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="animate-spin inline mr-2" /> : (editingProduct ? "ÜRÜNÜ GÜNCELLE" : "ÜRÜNÜ KAYDET")}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitCategory} className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Layers size={22} className="text-[#eab308]" />
                                    <h2 className="text-xl font-black text-[var(--foreground)] tracking-wide uppercase italic">
                                        {editingCategory ? "KATEGORİ DÜZENLE" : "YENİ KATEGORİ"}
                                    </h2>
                                </div>
                                {editingCategory && (
                                    <button
                                        type="button"
                                        onClick={handleCancelCategoryEdit}
                                        className="w-8 h-8 rounded-[8px] bg-[var(--border)] text-[var(--muted)] flex items-center justify-center hover:bg-[var(--border-alt)] hover:text-[var(--foreground)] transition-colors"
                                        title="İptal"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[var(--muted)] font-black uppercase tracking-[0.15em] ml-1">KATEGORİ ADI</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Tatlılar"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    className="bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--border-alt)] px-5 py-4 rounded-[16px] w-full focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold border border-[var(--border)]/30 hover:border-[var(--border-alt)]"
                                />
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#eab308] text-[var(--background)] font-black py-4 rounded-[16px] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 active:scale-95"
                                >
                                    {submitting ? <Loader2 className="animate-spin inline mr-2" /> : (editingCategory ? "KATEGORİYİ GÜNCELLE" : "KATEGORİYİ EKLE")}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right Grid Section */}
                <div className="flex-1 w-full flex flex-col gap-6">
                    {activeTab === "products" && (
                        <div className="relative text-[var(--muted)] focus-within:text-[var(--foreground)] transition-colors w-full">
                            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Ürünlerde ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--card)] border border-[var(--border)]/30 text-[var(--foreground)] placeholder-[var(--muted)] py-4 pl-14 pr-5 rounded-[16px] focus:outline-none focus:ring-1 focus:ring-[#eab308]/50 transition-all font-bold hover:border-[var(--border-alt)]"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="animate-spin text-[#eab308] mb-4" size={48} />
                            <p className="text-[var(--muted)] font-bold tracking-widest uppercase text-xs">Yükleniyor...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {activeTab === "products" ? (
                                filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className={`bg-[var(--card)] border rounded-[20px] p-4 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${editingProduct?.id === product.id
                                                ? "border-[#eab308]/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] bg-[var(--card)]"
                                                : "border-[var(--border)]/50 hover:border-[#eab308]/30"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className={`w-12 h-12 rounded-[14px] text-[#eab308] flex items-center justify-center font-bold text-lg shadow-inner flex-shrink-0 transition-colors ${editingProduct?.id === product.id ? "bg-[#eab308]/20" : "bg-[var(--border)] group-hover:bg-[#eab308]/10"}`}>
                                                    {product.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <h3 className={`font-bold text-[16px] leading-tight mb-1 transition-colors ${editingProduct?.id === product.id ? "text-[#eab308]" : "text-[var(--foreground)] group-hover:text-[#eab308]"}`}>
                                                        {product.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase opacity-60">
                                                        <span className="truncate max-w-[120px]">
                                                            {categories.find(c => c.id === product.category_id)?.name || "KATEGORİSİZ"}
                                                        </span>
                                                        <span className="text-[var(--border-alt)]">•</span>
                                                        <span className="text-[#eab308]">₺{product.price}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleEditProduct(product)}
                                                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${editingProduct?.id === product.id
                                                        ? "bg-[#eab308] text-[var(--background)]"
                                                        : "bg-[var(--border)] text-[var(--muted)] hover:bg-[var(--border-alt)] hover:text-[var(--foreground)]"
                                                        }`}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="w-9 h-9 rounded-[10px] bg-[#3f1515] text-[#ef4444] border border-[#ef4444]/10 flex items-center justify-center hover:bg-[#ef4444] hover:text-[var(--foreground)] transition-all shadow-sm"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border)] rounded-[32px] bg-[var(--card)]/30">
                                        <Search size={48} className="text-[var(--border)] mb-4" />
                                        <h3 className="text-xl font-black text-[var(--foreground)] mb-2 uppercase italic">Ürün bulunamadı</h3>
                                        <p className="text-[var(--muted)] font-bold text-sm">Arama kriterlerinize uygun ürün bulunmuyor.</p>
                                    </div>
                                )
                            ) : (
                                categories.length > 0 ? (
                                    categories.map((category) => {
                                        const prodCount = products.filter(p => p.category_id === category.id).length;
                                        return (
                                            <div
                                                key={category.id}
                                                className={`bg-[var(--card)] border rounded-[20px] p-5 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] ${editingCategory?.id === category.id
                                                    ? "border-[#eab308]/50 shadow-[0_0_15px_rgba(234,179,8,0.1)] bg-[var(--card)]"
                                                    : "border-[var(--border)]/50 hover:border-[#eab308]/30"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className={`w-12 h-12 rounded-[14px] text-[#eab308] flex items-center justify-center flex-shrink-0 shadow-inner transition-colors ${editingCategory?.id === category.id ? "bg-[#eab308]/20" : "bg-[var(--border)] group-hover:bg-[#eab308]/10"}`}>
                                                        <Layers size={20} />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <h3 className={`font-bold text-[17px] leading-tight mb-1 transition-colors ${editingCategory?.id === category.id ? "text-[#eab308]" : "text-[var(--foreground)] group-hover:text-[#eab308]"}`}>
                                                            {category.name}
                                                        </h3>
                                                        <p className="text-[11px] text-[var(--muted)] font-bold tracking-widest uppercase opacity-60">
                                                            {prodCount} ÜRÜN
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEditCategory(category)}
                                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all ${editingCategory?.id === category.id
                                                            ? "bg-[#eab308] text-[var(--background)]"
                                                            : "bg-[var(--border)] text-[var(--muted)] hover:bg-[var(--border-alt)] hover:text-[var(--foreground)]"
                                                            }`}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="w-9 h-9 rounded-[10px] bg-[#3f1515] text-[#ef4444] border border-[#ef4444]/10 flex items-center justify-center hover:bg-[#ef4444] hover:text-[var(--foreground)] transition-all shadow-sm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--border)] rounded-[32px] bg-[var(--card)]/30">
                                        <Layers size={48} className="text-[var(--border)] mb-4" />
                                        <h3 className="text-xl font-black text-[var(--foreground)] mb-2 uppercase italic">Kategori bulunamadı</h3>
                                        <p className="text-[var(--muted)] font-bold text-sm">Henüz hiç kategori oluşturulmamış.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
