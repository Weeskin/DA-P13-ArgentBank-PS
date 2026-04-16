const BASE_URL = "http://localhost:3001/api/v1";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  userName: string;
}

export async function login(payload: LoginPayload): Promise<string> {
  const response = await fetch(`${BASE_URL}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Email ou mot de passe incorrect");
  }

  const data = await response.json();
  return data.body.token as string;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer le profil");
  }

  const data = await response.json();
  return {
    firstName: data.body.firstName ?? "",
    lastName: data.body.lastName ?? "",
    userName: data.body.userName ?? "",
  };
}

export async function updateProfile(
  token: string,
  firstName: string,
  lastName: string
): Promise<UserProfile> {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ firstName, lastName }),
  });

  if (!response.ok) {
    throw new Error("Impossible de mettre à jour le profil");
  }

  const data = await response.json();
  return {
    firstName: data.body.firstName ?? "",
    lastName: data.body.lastName ?? "",
    userName: data.body.userName ?? "",
  };
}
