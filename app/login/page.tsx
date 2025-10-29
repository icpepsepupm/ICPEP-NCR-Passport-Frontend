import { redirect } from "next/navigation";

export default function LoginIndex() {
  redirect("/auth/login");
}
