import { redirect } from "next/navigation";

export default function DashboardIndex() {
  // Redirect the base dashboard to a default passport id.
  redirect("/dashboard/passport/1");
}
