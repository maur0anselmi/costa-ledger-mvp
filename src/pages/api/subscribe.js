export const prerender = false;

import { env as cfEnv } from "cloudflare:workers";

export async function POST({ request }) {
  try {
    const data = await request.json();
    const {
      email,
      name,
      source_page,
      form_used,
      utm_source,
      utm_medium,
      utm_campaign,
      primary_interest,
      interests,
      consent_version,
      subscriber_lifecycle_status
    } = data;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extracción de secretos desde el módulo oficial de Cloudflare Workers
    const apiKey = cfEnv?.KLAVIYO_PRIVATE_API_KEY || process.env.KLAVIYO_PRIVATE_API_KEY;
    const listGeneral = cfEnv?.KLAVIYO_LIST_GENERAL || process.env.KLAVIYO_LIST_GENERAL;
    const listReport = cfEnv?.KLAVIYO_LIST_REPORT || process.env.KLAVIYO_LIST_REPORT;

    const listId = source_page?.includes("report") ? listReport : listGeneral;
    const timestampNow = new Date().toISOString();

    const payload = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          custom_source: form_used || "Costa Ledger Web",
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email,
                  first_name: name || "",
                  properties: {
                    source_page: source_page || "",
                    form_used: form_used || "",
                    utm_source: utm_source || "direct",
                    utm_medium: utm_medium || "none",
                    utm_campaign: utm_campaign || "none",
                    primary_interest: primary_interest || "General",
                    interests: interests || [],
                    consent_timestamp: timestampNow,
                    consent_version: consent_version || "v1.0-2026",
                    subscriber_lifecycle_status: subscriber_lifecycle_status || "subscriber"
                  },
                  subscriptions: {
                    email: {
                      marketing: { consent: "SUBSCRIBED" }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: { type: "list", id: listId }
          }
        }
      }
    };

    const klaviyoResponse = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers: {
        "Authorization": `Klaviyo-API-Key ${apiKey}`,
        "revision": "2024-07-15",
        "content-type": "application/vnd.api+json"
      },
      body: JSON.stringify(payload)
    });

    if (!klaviyoResponse.ok) {
      const errorData = await klaviyoResponse.text();
      return new Response(JSON.stringify({ error: "Klaviyo sync failed", details: errorData }), {
        status: klaviyoResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}