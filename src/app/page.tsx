"use client";

import { useState } from "react";
import {
  Utensils,
  Key,
  ShieldCheck,
  User,
  Lock,
  ChevronRight,
  Delete,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

export default function LoginPage() {
  const { login: setAuth } = useAuth();
  const [role, setRole] = useState<"GARSON" | "YONETIM">("YONETIM");

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [pin, setPin] = useState<string>("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handlePinInput = (num: number) => {
    if (errorMsg) setErrorMsg(null);
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setErrorMsg("Lütfen 4 haneli PIN girin.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await authService.pinLogin(pin);
      if (response.success) {
        setAuth(response);
      } else {
        setErrorMsg(response.message || "Hatalı PIN.");
        setPin("");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Bağlantı hatası oluştu.");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Kullanıcı adı ve şifre zorunludur.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await authService.login({ username, password });
      if (response.success) {
        setAuth(response);
      } else {
        setErrorMsg(response.message || "Hatalı kullanıcı adı veya şifre.");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Bağlantı hatası oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 font-sans text-gray-200">

      {/* Header / Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-[#eab308] rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
          <Utensils className="w-8 h-8 text-[var(--background)]" strokeWidth={2} />
        </div>
        <h1 className="text-[#eab308] text-2xl font-bold tracking-widest uppercase shadow-black drop-shadow-lg">
          Premium Resto
        </h1>
      </div>

      {/* Role Toggle */}
      <div className="bg-[var(--card)] p-1.5 rounded-full flex gap-1 mb-8 shadow-inner border border-white/5 w-[340px] z-10">
        <button
          onClick={() => {
            setRole("GARSON");
            setErrorMsg(null);
            setPin("");
          }}
          className={`relative flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${role === "GARSON"
            ? "bg-[#eab308] text-[var(--background)] shadow-md"
            : "text-gray-400 hover:text-[var(--foreground)]"
            }`}
        >
          <Key className="w-4 h-4" />
          GARSON
        </button>
        <button
          onClick={() => {
            setRole("YONETIM");
            setErrorMsg(null);
            setUsername("");
            setPassword("");
          }}
          className={`relative flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${role === "YONETIM"
            ? "bg-[#eab308] text-[var(--background)] shadow-md"
            : "text-gray-400 hover:text-[var(--foreground)]"
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          YÖNETİM
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-[var(--card)] w-full max-w-[400px] rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/5 relative min-h-[460px] flex flex-col justify-center">

        {role === "YONETIM" ? (
          /* Admin / Cashier Login Form */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-[#eab308] text-xl font-bold mb-1 tracking-wide">KASA / ADMİN</h2>
            <p className="text-gray-500 text-xs italic mb-6">Kurumsal kullanıcı girişi</p>

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-medium ml-1">Kullanıcı Adı</label>
                <div className="relative flex items-center">
                  <User className={`absolute left-4 w-5 h-5 ${errorMsg ? 'text-red-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`w-full bg-[#121212] border ${errorMsg ? 'border-red-500/50' : 'border-white/5'} text-[var(--foreground)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#eab308] transition-colors shadow-inner`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs font-medium ml-1">Şifre</label>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-4 w-5 h-5 ${errorMsg ? 'text-red-400' : 'text-gray-500'}`} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className={`w-full bg-[#121212] border ${errorMsg ? 'border-red-500/50' : 'border-white/5'} text-[var(--foreground)] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#eab308] transition-colors shadow-inner`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-red-400 text-xs font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#eab308] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#dca500] text-[var(--background)] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-2 transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>SİSTEME GİRİŞ YAP <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Waiter PIN Login */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <h2 className="text-[#eab308] text-xl font-bold mb-1 tracking-wide uppercase">Pin Girişi</h2>
            <p className="text-gray-500 text-xs italic mb-8">4 haneli kodunuzu girin</p>

            {/* Pin Display */}
            <div className="flex gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-14 h-16 rounded-xl border flex items-center justify-center text-2xl font-bold transition-all ${pin[index]
                    ? 'border-[#eab308] bg-[#eab308]/10 text-[var(--foreground)] shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                    : errorMsg
                      ? 'border-red-500/50 bg-red-500/10 text-transparent'
                      : 'border-white/10 bg-[#121212] text-transparent'
                    }`}
                >
                  {pin[index] ? '•' : ''}
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="text-red-400 text-xs font-medium text-center bg-red-400/10 w-full py-2 mb-4 rounded-lg border border-red-400/20">
                {errorMsg}
              </div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinInput(num)}
                  disabled={isLoading}
                  className="bg-[#121212] disabled:opacity-50 hover:bg-[#202020] active:scale-95 text-xl font-semibold text-[var(--foreground)] aspect-square rounded-2xl flex items-center justify-center transition-all border border-white/5"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handlePinDelete}
                disabled={isLoading}
                className="bg-[#121212] disabled:opacity-50 hover:bg-red-900/20 active:scale-95 text-xl font-semibold text-red-400 aspect-square rounded-2xl flex items-center justify-center transition-all border border-white/5"
              >
                <Delete className="w-6 h-6" />
              </button>
              <button
                onClick={() => handlePinInput(0)}
                disabled={isLoading}
                className="bg-[#121212] disabled:opacity-50 hover:bg-[#202020] active:scale-95 text-xl font-semibold text-[var(--foreground)] aspect-square rounded-2xl flex items-center justify-center transition-all border border-white/5"
              >
                0
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={isLoading}
                className="bg-[#eab308] disabled:opacity-50 hover:bg-[#dca500] active:scale-95 text-xl font-semibold text-[var(--background)] aspect-square rounded-2xl flex items-center justify-center transition-all border border-[#eab308]/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                {isLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <ChevronRight className="w-8 h-8" />}
              </button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
