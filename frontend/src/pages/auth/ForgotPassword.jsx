import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      setMessage(data.message);
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send a secure reset link." footer={<p className="mt-6 text-center text-sm"><Link className="font-semibold text-brand-700 hover:underline" to="/login">Back to login</Link></p>}>
      <form className="space-y-4" onSubmit={submit}>
        <Input id="email" label="Email address" placeholder="you@example.com" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        {message && <Alert tone="success">{message}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Sending..." : "Send reset link"}</Button>
      </form>
    </AuthShell>
  );
}
