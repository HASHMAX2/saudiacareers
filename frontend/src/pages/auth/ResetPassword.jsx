import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { authApi } from "../../api/auth.js";
import { AuthShell } from "../../components/auth/AuthShell.jsx";
import { Alert } from "../../components/common/Alert.jsx";
import { Button } from "../../components/common/Button.jsx";
import { Input } from "../../components/common/Input.jsx";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Reset failed");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <AuthShell title="Choose a new password" subtitle="Your reset link is valid for one hour. Choose a strong password you have not used before.">
      <form className="space-y-4" onSubmit={submit}>
        <Input autoComplete="new-password" id="password" label="New password" placeholder="Enter a strong password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        {error && <Alert>{error}</Alert>}
        <Button className="w-full" disabled={submitting} type="submit">{submitting ? "Updating..." : "Reset password"}</Button>
      </form>
    </AuthShell>
  );
}
