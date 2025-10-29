import { redirect } from "next/navigation";

export default function DashboardIndex() {
  // Redirect the base dashboard to a default activity slug to enforce slugged routes.
  redirect("/dashboard/event/kickoff-2025");
}
