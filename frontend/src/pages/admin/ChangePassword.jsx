import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";
import { useAuthStore } from "../../store/authStore.js";

export function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  async function handleSubmit(event) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { const { data } = await authApi.changePassword(form); setSession(data.data); navigate("/admin/dashboard", { replace: true }); }
    catch (requestError) { setError(requestError.response?.data?.message ?? "Password change failed"); }
    finally { setSubmitting(false); }
  }
  return <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><LockKeyhole size={22} /></span><h1 className="mt-5 text-2xl font-bold">Secure your admin account</h1><p className="mt-2 text-sm leading-6 text-slate-600">Replace the seeded password before accessing administrator features.</p><form className="mt-7 space-y-4" onSubmit={handleSubmit}><Input id="currentPassword" label="Current password" onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required type="password" value={form.currentPassword} /><Input id="newPassword" label="New password" minLength={8} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} required type="password" value={form.newPassword} />{error && <Alert>{error}</Alert>}<Button className="w-full" disabled={submitting} type="submit">{submitting ? "Updating..." : "Change password"}</Button></form></div>;
}
