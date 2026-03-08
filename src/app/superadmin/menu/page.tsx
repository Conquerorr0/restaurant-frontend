"use client";

import React, { useState, useEffect } from "react";
import {
    Plus, Search, Edit2, Trash2, X, Check,
    Loader2, AlertCircle, Package, Layers, Pencil, Tag
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { menuService, Category, Product } from "@/services/menuService";

export default function MenuManagement() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
    const [searchTerm, setSearchTerm] = useState("");

    // Form states
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [productForm, setProductForm] = useState({
        name: "",
        price: 0,
        cost_price: 0,
        category_id: "",
        description: "",
        is_active: true
    });

    const [categoryForm, setCategoryForm] = useState({
        name: "",
        sort_order: 0,
        is_active: true
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes] = await Promise.all([
                menuService.getCategories(token!),
                menuService.getProducts(token!)
            ]);
            if (catRes.success) {
                setCategories(catRes.data);
                if (catRes.data.length > 0 && !productForm.category_id) {
                    setProductForm(prev => ({ ...prev, category_id: catRes.data[0].id }));
                }
            }
            if (prodRes.success) setProducts(prodRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price,
            cost_price: (product as any).cost_price || 0,
            category_id: product.category_id,
            description: product.description || "",
            is_active: product.is_active
        });
        setError("");
        setActiveTab('products');
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelProductEdit = () => {
        setEditingProduct(null);
        setProductForm({
            name: "",
            price: 0,
            cost_price: 0,
            category_id: categories[0]?.id || "",
            description: "",
            is_active: true
        });
        setError("");
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            sort_order: category.sort_order,
            is_active: category.is_active
        });
        setError("");
        setActiveTab('categories');
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancelCategoryEdit = () => {
        setEditingCategory(null);
        setCategoryForm({ name: "", sort_order: categories.length + 1, is_active: true });
        setError("");
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.name || !productForm.category_id) {
            setError("Lütfen gerekli alanları doldurun.");
            return;
        }

        setError("");
        setSubmitting(true);
        try {
            if (editingProduct) {
                await menuService.updateProduct(editingProduct.id, productForm, token!);
            } else {
                await menuService.createProduct(productForm, token!);
            }
            handleCancelProductEdit();
            fetchData();
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryForm.name) {
            setError("Kategori adı gereklidir.");
            return;
        }

        setError("");
        setSubmitting(true);
        try {
            if (editingCategory) {
                await menuService.updateCategory(editingCategory.id, categoryForm, token!);
            } else {
                await menuService.createCategory(categoryForm, token!);
            }
            handleCancelCategoryEdit();
            fetchData();
        } catch (err: any) {
            setError(err.message || "İşlem başarısız");
        } finally {
            setSubmitting(false);
        }
    };

    const handleProductDelete = async (id: string) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
        try {
            const res = await menuService.deleteProduct(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    const handleCategoryDelete = async (id: string) => {
        if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
        try {
            const res = await menuService.deleteCategory(id, token!);
            if (res.success) fetchData();
        } catch (err: any) {
            alert(err.message || "Silme işlemi başarısız");
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getInitial = (name: string) => name.charAt(0).toUpperCase();
    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || "Kategorisiz";

    return (
        <div className="flex flex-col gap-10 w-full max-w-[1200px] mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-1 drop-shadow-md italic">
                        MENÜ YÖNETİMİ
                    </h1>
                    <p className="text-[#808080] text-[15px] font-medium tracking-wide">
                        Kategori ve ürünlerinizi yönetin
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-[#1c1c1c] p-1.5 rounded-[20px] shadow-sm self-start md:self-auto border border-[#27272a]">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`flex items-center gap-2 px-8 py-3 rounded-[16px] font-black text-[12px] tracking-widest transition-all duration-300 ${activeTab === "products"
                            ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                            : "text-[#a1a1aa] hover:text-white"
                            }`}
                    >
                        <Package size={16} />
                        ÜRÜNLER
                    </button>
                    <button
                        onClick={() => setActiveTab("categories")}
                        className={`flex items-center gap-2 px-8 py-3 rounded-[16px] font-black text-[12px] tracking-widest transition-all duration-300 ${activeTab === "categories"
                            ? "bg-[#eab308] text-[#0d0d0d] shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                            : "text-[#a1a1aa] hover:text-white"
                            }`}
                    >
                        <Layers size={16} />
                        KATEGORİLER
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Form Section */}
                <div className="w-full lg:w-[400px] flex-shrink-0 bg-[#1c1c1c] border border-[#27272a] rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#eab308]/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none transition-all duration-500 group-hover:bg-[#eab308]/10" />

                    {activeTab === "products" ? (
                        <form onSubmit={handleProductSubmit} className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center text-[#eab308]">
                                        <Package size={22} />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-wide italic">
                                        {editingProduct ? "ÜRÜNÜ DÜZENLE" : "YENİ ÜRÜN EKLE"}
                                    </h2>
                                </div>
                                {editingProduct && (
                                    <button
                                        type="button"
                                        onClick={handleCancelProductEdit}
                                        className="w-8 h-8 rounded-full bg-[#27272a] text-[#a1a1aa] flex items-center justify-center hover:bg-[#3f3f46] hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-[12px] font-bold flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">ÜRÜN ADI</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Kebap, Çorba, Meze"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-bold"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">KATEGORİ</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={productForm.category_id}
                                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                        className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] appearance-none font-bold transition-all"
                                    >
                                        <option value="" disabled>Seçiniz</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#71717a]"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">FİYAT (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={productForm.price || ""}
                                        onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                                        className="bg-[#0d0d0d] border border-[#27272a] text-[#eab308] px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] font-black"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">MALİYET (₺)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={productForm.cost_price || ""}
                                        onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
                                        className="bg-[#0d0d0d] border border-red-500/20 text-red-500 px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-red-500/50 font-black"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">AÇIKLAMA</label>
                                <textarea
                                    placeholder="Ürün içeriği, hazırlanışı..."
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] h-28 resize-none font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-5 rounded-[20px] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : (editingProduct ? 'DEĞİŞİKLİKLERİ KAYDET' : 'ÜRÜNÜ MENÜYE EKLE')}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleCategorySubmit} className="relative z-10 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 flex items-center justify-center text-[#eab308]">
                                        <Layers size={22} />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-wide italic">
                                        {editingCategory ? "KATEGORİYİ DÜZENLE" : "YENİ KATEGORİ"}
                                    </h2>
                                </div>
                                {editingCategory && (
                                    <button
                                        type="button"
                                        onClick={handleCancelCategoryEdit}
                                        className="w-8 h-8 rounded-full bg-[#27272a] text-[#a1a1aa] flex items-center justify-center hover:bg-[#3f3f46] hover:text-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-[16px] text-[12px] font-bold flex items-center gap-3">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">KATEGORİ ADI</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Ana Yemekler, Tatlılar"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] transition-all font-bold"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] text-[#71717a] font-black uppercase tracking-[0.2em] ml-2">SIRALAMA</label>
                                <input
                                    type="number"
                                    required
                                    value={categoryForm.sort_order}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                                    className="bg-[#0d0d0d] border border-[#27272a] text-white px-5 py-4 rounded-[18px] w-full focus:outline-none focus:border-[#eab308] font-black"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-[#facc15] to-[#eab308] text-[#0d0d0d] font-black py-5 rounded-[20px] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={24} /> : (editingCategory ? 'DEĞİŞİKLİKLERİ KAYDET' : 'KATEGORİYİ EKLE')}
                            </button>
                        </form>
                    )}
                </div>

                {/* Right Grid Section */}
                <div className="flex-1 w-full flex flex-col gap-8">
                    {activeTab === "products" && (
                        <div className="relative text-[#a1a1aa] focus-within:text-white transition-colors w-full group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-[#eab308]" />
                            <input
                                type="text"
                                placeholder="Menüde ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1c1c1c] border border-[#27272a] text-white placeholder-[#52525b] py-5 pl-16 pr-6 rounded-[24px] focus:outline-none focus:border-[#eab308] transition-all font-bold shadow-lg"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="w-full h-[400px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-[#eab308]" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeTab === "products" ? (
                                filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className={`bg-[#1c1c1c] border rounded-[28px] p-5 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${editingProduct?.id === product.id
                                            ? "border-[#eab308] shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                            : "border-[#27272a] hover:border-[#eab308]/30"
                                            }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-14 h-14 rounded-[18px] text-[#eab308] flex items-center justify-center font-black text-xl shadow-inner transition-all ${editingProduct?.id === product.id ? "bg-[#eab308]/20" : "bg-[#27272a] group-hover:bg-[#eab308]/10"}`}>
                                                {getInitial(product.name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className={`font-black text-lg leading-tight mb-1 transition-colors uppercase ${editingProduct?.id === product.id ? "text-[#eab308]" : "text-white group-hover:text-[#eab308]"}`}>
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-[#71717a]">{getCategoryName(product.category_id)}</span>
                                                    <span className="text-[#3f3f46]">•</span>
                                                    <span className="text-[#eab308] font-black text-sm">₺{product.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${editingProduct?.id === product.id
                                                    ? "bg-[#eab308] text-[#0d0d0d]"
                                                    : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white"
                                                    }`}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleProductDelete(product.id)}
                                                className="w-10 h-10 rounded-xl bg-[#3f1515] text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className={`bg-[#1c1c1c] border rounded-[28px] p-6 flex items-center justify-between group transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)] ${editingCategory?.id === category.id
                                            ? "border-[#eab308] shadow-[0_0_30px_rgba(234,179,8,0.1)]"
                                            : "border-[#27272a] hover:border-[#eab308]/30"
                                            }`}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-[18px] text-[#eab308] flex items-center justify-center shadow-inner transition-all ${editingCategory?.id === category.id ? "bg-[#eab308]/20" : "bg-[#27272a] group-hover:bg-[#eab308]/10"}`}>
                                                <Layers size={26} />
                                            </div>
                                            <div className="flex flex-col">
                                                <h3 className={`font-black text-lg leading-tight mb-1 transition-colors uppercase ${editingCategory?.id === category.id ? "text-[#eab308]" : "text-white group-hover:text-[#eab308]"}`}>
                                                    {category.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Tag size={12} className="text-[#71717a]" />
                                                    <p className="text-[11px] text-[#a1a1aa] font-black tracking-widest uppercase">
                                                        Sıra: {category.sort_order}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditCategory(category)}
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${editingCategory?.id === category.id
                                                    ? "bg-[#eab308] text-[#0d0d0d]"
                                                    : "bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46] hover:text-white"
                                                    }`}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleCategoryDelete(category.id)}
                                                className="w-10 h-10 rounded-xl bg-[#3f1515] text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}

                            {((activeTab === "products" && filteredProducts.length === 0) || (activeTab === "categories" && categories.length === 0)) && (
                                <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-20 text-center bg-[#18181b] rounded-[40px] border border-[#27272a] border-dashed">
                                    <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center mb-6 opacity-40">
                                        <Search size={32} className="text-[#a1a1aa]" />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-widest">Kayıt Bulunamadı</h3>
                                    <p className="text-[#71717a] font-bold">Lütfen arama kriterlerinizi değiştirin veya yeni bir kayıt ekleyin.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
