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

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return "Minimum 2 caractères requis";
  if (trimmed.length > 50) return "Maximum 50 caractères autorisés";
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(trimmed))
    return "Lettres, espaces, tirets et apostrophes uniquement";
  return null;
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

    const firstNameError = validateName(newFirstName);
    const lastNameError = validateName(newLastName);
    if (firstNameError || lastNameError) {
      setError(firstNameError ?? lastNameError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updated = await updateProfile(token, newFirstName.trim(), newLastName.trim());
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
      <main className="bg-[#dfe6ed] min-h-[calc(100vh-64px)] text-gray-900">
        <div className="flex flex-col items-center pt-12 px-4">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Welcome back
            {!editing && (
              <>
                <br />
                {firstName} {lastName}!
              </>
            )}
          </h1>

          {editing ? (
            <form onSubmit={handleSave} className="flex flex-col gap-3 w-full max-w-lg mb-8">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="flex-1 p-2 text-gray-900 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="First name"
                  required
                />
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="flex-1 p-2 text-gray-900 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500"
                  placeholder="Last name"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-4 justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="border border-indigo-500 text-indigo-500 bg-white px-8 py-1.5 hover:bg-indigo-500 hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-indigo-500 text-indigo-500 bg-white px-8 py-1.5 hover:bg-indigo-500 hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="border border-indigo-500 text-indigo-500 bg-white px-8 py-1.5 mb-8 hover:bg-indigo-500 hover:text-white cursor-pointer transition-colors"
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
                className="bg-white text-black flex flex-col md:flex-row items-center justify-between p-6 border border-gray-200"
              >
                <div>
                  <h2 className="font-bold text-lg">{account.title}</h2>
                  <p className="text-3xl font-bold">{account.amount}</p>
                  <p className="text-gray-600 text-sm">{account.type}</p>
                </div>
                <button className="mt-4 md:mt-0 bg-indigo-500 text-white px-8 py-2 font-bold rounded hover:bg-indigo-600 cursor-pointer transition-colors">
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
