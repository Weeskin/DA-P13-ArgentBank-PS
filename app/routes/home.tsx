import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { Navbar } from "../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Argent Bank" },
    { name: "description", content: "Welcome to Argent Bank!" },
  ];
}

export default function Home() {
  return (
    <>
      <Navbar />
      <Welcome />
    </>
  );
}
