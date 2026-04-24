import { useState } from "react";
import { useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { setToken } from "../store/authSlice";
import { setUserData } from "../store/userSlice";
import { Navbar } from "../components/Navbar";
import { login, getProfile } from "../services/api";

export function meta() {
  return [{ title: "Argent Bank — Sign In" }];
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await login({ email, password });
      dispatch(setToken(token));

      const profile = await getProfile(token);
      dispatch(setUserData(profile));

      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100">
        <section className="bg-white p-8 w-full max-w-sm shadow">
          <i className="fa fa-user-circle text-4xl block text-center mb-4" aria-hidden="true"></i>
          <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="font-bold">
                Username
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 p-2 text-lg"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="font-bold">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 p-2 text-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me">Remember me</label>
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white font-bold py-2 px-4 border-2 border-green-800 hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Connexion..." : "Sign In"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
