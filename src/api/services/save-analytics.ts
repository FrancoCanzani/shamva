import { Context } from "hono";
import { createSupabaseClient } from "../lib/supabase/client";

// we need to hard test this as if it doesnt run we wont have analytics nor errors
export async function saveAnalytics(c: Context) {
  const supabase = createSupabaseClient(c.env);

  const url = new URL(c.req.url);
  const pathname = url.pathname;

  const slug = pathname.split("/")[1];

  const clickData = {
    request_url: c.req.url,
    shortened_path: pathname,
    slug: slug,
    user_agent: c.req.header("user-agent"),
    referer: c.req.header("referer"),
    country_code: c.req.raw.cf?.country,
    continent_code: c.req.raw.cf?.continent,
    city: c.req.raw.cf?.city,
    region_code: c.req.raw.cf?.regionCode,
    postal_code: c.req.raw.cf?.postalCode,
    latitude: c.req.raw.cf?.latitude,
    longitude: c.req.raw.cf?.longitude,
    colo: c.req.raw.cf?.colo,
    tls_version: c.req.raw.cf?.tlsVersion,
    asn: c.req.raw.cf?.asn,
    as_organization: c.req.raw.cf?.asOrganization,
    is_eu_country: c.req.raw.cf?.isEUCountry === "1",
    client_accept_encoding: c.req.raw.cf?.clientAcceptEncoding,
    http_protocol: c.req.raw.cf?.httpProtocol,
    // cache_status will be handled later if possible
    // user_id: ... (extract from cookie if authenticated)
  };

  const { error } = await supabase.from("link_analytics").insert([clickData]);

  if (error) {
    console.error("Error inserting click data:", error);
  }
}
