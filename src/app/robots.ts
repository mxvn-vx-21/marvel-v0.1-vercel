import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/settings", "/onboarding", "/login", "/signup", "/logout", "/reset-password"] }], host: appUrl() };
}
