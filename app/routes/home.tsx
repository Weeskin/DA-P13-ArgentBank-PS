import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Argent Bank App" },
    { name: "description", content: "Welcome to Argent Bank App!" },
  ];
}

export default function Home() {
  return <Welcome />;
}
