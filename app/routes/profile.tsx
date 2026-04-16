import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { setUserData } from "../store/userSlice";
import { Navbar } from "../components/Navbar";
import { updateProfile } from "../services/api";

export function meta() {
  return [{ title: "Argent Bank — Profile" }];
}

export default function Profile() {
  const token = useSelector((state: RootState) => state.auth.token);
  const { firstName, lastName, userName } = useSelector(
    (state: RootState) => state.user.userData
  );

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [newFirstName, setNewFirstName] = useState(firstName ?? "");
  const [newLastName, setNewLastName] = useState(lastName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    setNewFirstName(firstName ?? "");
    setNewLastName(lastName ?? "");
  }, [firstName, lastName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);

    try {
      const updated = await updateProfile(token, newFirstName, newLastName);
      dispatch(setUserData(updated));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setNewFirstName(firstName ?? "");
    setNewLastName(lastName ?? "");
    setEditing(false);
    setError(null);
  }

  if (!token) return null;

  return (
    <>
      <Navbar />
      <main className="bg-blue-950 min-h-[calc(100vh-64px)] text-white">
        <div className="flex flex-col items-center pt-12 px-4">
          <h1 className="text-3xl font-bold mb-6">
            Welcome back
            <br />
            {firstName} {lastName}!
          </h1>

          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-3 w-full max-w-sm mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="flex-1 p-2 text-white bg-transparent border border-white placeholder:text-gray-400"
                  placeholder="First name"
                  required
                />
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="flex-1 p-2 text-white bg-transparent border border-white placeholder:text-gray-400"
                  placeholder="Last name"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2 justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="border border-green-500 text-green-500 px-6 py-1 hover:bg-green-500 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-green-500 text-green-500 px-6 py-1 hover:bg-green-500 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="border border-green-500 text-green-500 px-6 py-1 mb-8 hover:bg-green-500 hover:text-white cursor-pointer"
            >
              Edit Name
            </button>
          )}

          {/* Accounts placeholder */}
          <section className="w-full max-w-4xl flex flex-col gap-4">
            {[
              { title: "Argent Bank Checking (x8349)", amount: "$2,082.79", type: "Available Balance" },
              { title: "Argent Bank Savings (x6712)", amount: "$10,928.42", type: "Available Balance" },
              { title: "Argent Bank Credit Card (x8349)", amount: "$184.30", type: "Current Balance" },
            ].map((account) => (
              <div
                key={account.title}
                className="bg-white text-black flex flex-col md:flex-row items-center justify-between p-6"
              >
                <div>
                  <h2 className="font-bold text-lg">{account.title}</h2>
                  <p className="text-3xl font-bold">{account.amount}</p>
                  <p className="text-gray-600">{account.type}</p>
                </div>
                <button className="mt-4 md:mt-0 bg-green-600 text-white border-2 border-green-800 px-8 py-2 font-bold hover:bg-green-700 cursor-pointer">
                  View transactions
                </button>
              </div>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
