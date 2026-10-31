import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, LockKeyhole, ShieldCheck, Ship } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { IMG } from "@/lib/content";
import { errMsg } from "@/lib/hooks";
import { queryClient } from "@/lib/queryClient";
import { beginSession } from "@/lib/session";
import type { MessageOut, UserPublic } from "@/lib/types";

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <motion.img src={IMG.cranes} alt="" initial={{ scale: 1.2 }} animate={{ scale: 1.05 }} transition={{ duration: 3 }} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <Ship className="h-10 w-10 text-sky-300" />
          <h2 className="mt-4 text-4xl font-extrabold leading-tight">Your enquiries, quotations & documents — in one secure place.</h2>
          <p className="mt-3 flex items-center gap-2 text-slate-300"><ShieldCheck className="h-4 w-4" /> Each customer can only see their own records.</p>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-sky-soft px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-md rounded-[28px] bg-white p-8 shadow-[0_40px_80px_-40px_rgba(11,29,58,0.45)]">
          <Link to="/" data-testid="auth-wordmark"><img src="/logo-wordmark.png" alt="ICONIC Shipping Services" className="h-14 w-auto" /></Link>
          <h1 className="mt-8 text-3xl font-extrabold text-navy">{title}</h1>
          <p className="mt-1 text-[14px] text-slate-600">{sub}</p>
          <div className="mt-6">{children}</div>
        </motion.div>
        <Link to="/" className="mx-auto mt-6 text-[13px] font-semibold text-ocean">← Back to website</Link>
      </div>
    </div>
  );
}

const fld = (id: string, label: string, el: React.ReactNode) => (
  <div className="space-y-1.5"><Label htmlFor={id} className="text-[12.5px] font-semibold text-navy">{label}</Label>{el}</div>
);

function useAuthDone() {
  const nav = useNavigate();
  return (u: UserPublic) => {
    beginSession();
    queryClient.setQueryData(["me"], u);
    nav(u.role === "customer" ? "/portal" : "/admin");
  };
}

export default function Login() {
  const done = useAuthDone();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const m = useMutation({ mutationFn: () => apiPost<UserPublic>("/auth/login", { email, password }), onSuccess: done, onError: (e) => toast.error(errMsg(e)) });
  return (
    <Shell title="Sign in" sub="Customer portal & staff console">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }} data-testid="login-form">
        {fld("le", "Email", <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" data-testid="login-email-input" />)}
        {fld("lp", "Password", <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" data-testid="login-password-input" />)}
        <div className="flex justify-end"><Link to="/forgot-password" className="text-[13px] font-semibold text-ocean" data-testid="login-forgot-link">Forgot password?</Link></div>
        <button type="submit" disabled={m.isPending} data-testid="login-submit-button" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ocean font-semibold text-white disabled:opacity-60">{m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Sign in</button>
      </form>
      <p className="mt-6 text-center text-[14px] text-slate-600">New customer? <Link to="/register" className="font-semibold text-ocean" data-testid="login-register-link">Create an account</Link></p>
    </Shell>
  );
}

export function Register() {
  const done = useAuthDone();
  const [f, setF] = useState({ name: "", email: "", password: "", company: "", phone: "", country: "India" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const m = useMutation({ mutationFn: () => apiPost<UserPublic>("/auth/register", f), onSuccess: done, onError: (e) => toast.error(errMsg(e)) });
  return (
    <Shell title="Create account" sub="Submit enquiries, track status and receive quotations.">
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); m.mutate(); }} data-testid="register-form">
        {fld("rn", "Full name", <Input id="rn" required minLength={2} value={f.name} onChange={set("name")} className="h-11 rounded-xl" data-testid="register-name-input" />)}
        {fld("rc", "Company", <Input id="rc" value={f.company} onChange={set("company")} className="h-11 rounded-xl" data-testid="register-company-input" />)}
        {fld("re", "Email", <Input id="re" type="email" required value={f.email} onChange={set("email")} className="h-11 rounded-xl" data-testid="register-email-input" />)}
        {fld("rph", "Phone", <Input id="rph" value={f.phone} onChange={set("phone")} className="h-11 rounded-xl" data-testid="register-phone-input" />)}
        <div className="sm:col-span-2">{fld("rp", "Password (min 8 characters)", <Input id="rp" type="password" required minLength={8} value={f.password} onChange={set("password")} className="h-11 rounded-xl" data-testid="register-password-input" />)}</div>
        <button type="submit" disabled={m.isPending} data-testid="register-submit-button" className="flex h-12 items-center justify-center gap-2 rounded-full bg-ocean font-semibold text-white disabled:opacity-60 sm:col-span-2">{m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create account</button>
      </form>
      <p className="mt-6 text-center text-[14px] text-slate-600">Already registered? <Link to="/login" className="font-semibold text-ocean">Sign in</Link></p>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const m = useMutation({ mutationFn: () => apiPost<MessageOut>("/auth/forgot-password", { email }), onError: (e) => toast.error(errMsg(e)) });
  return (
    <Shell title="Forgot password" sub="We'll issue a secure reset link to your email.">
      {m.isSuccess ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-[14px] text-emerald-800" data-testid="forgot-success">{m.data.message}</p>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }} data-testid="forgot-form">
          {fld("fe", "Email", <Input id="fe" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" data-testid="forgot-email-input" />)}
          <button type="submit" disabled={m.isPending} data-testid="forgot-submit-button" className="h-12 w-full rounded-full bg-ocean font-semibold text-white">Send reset link</button>
        </form>
      )}
      <p className="mt-6 text-center text-[14px]"><Link to="/login" className="font-semibold text-ocean">Back to sign in</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const m = useMutation({
    mutationFn: () => apiPost<MessageOut>("/auth/reset-password", { token: params.get("token") ?? "", password }),
    onSuccess: (r) => { toast.success(r.message); nav("/login"); },
    onError: (e) => toast.error(errMsg(e)),
  });
  return (
    <Shell title="Set a new password" sub="Choose a password with at least 8 characters.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }} data-testid="reset-form">
        {fld("np", "New password", <Input id="np" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" data-testid="reset-password-input" />)}
        <button type="submit" disabled={m.isPending} data-testid="reset-submit-button" className="h-12 w-full rounded-full bg-ocean font-semibold text-white">Update password</button>
      </form>
    </Shell>
  );
}
