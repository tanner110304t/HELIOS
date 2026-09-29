import { redirect } from "next/navigation";

/** /demo is the same meeting page as / — keep one source of truth. */
export default function DemoIndex() {
  redirect("/");
}
