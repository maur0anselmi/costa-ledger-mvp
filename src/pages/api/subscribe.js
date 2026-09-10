export const prerender = false;

export async function POST(context) {
  try {
    const { request, locals } = context;
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
      subscriber_lifecycle_status,
      general_briefing_opt_in
    } = data;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const cfEnv = locals?.cloudflare?.env || {};
    const apiKey = cfEnv.KLAVIYO_PRIVATE_API_KEY || process.env.KLAVIYO_PRIVATE_API_KEY || "pk_V9tnGA_84600ba0fc04a3a017b9c57b610d5e5c7e";
    const listGeneral = cfEnv.KLAVIYO_LIST_GENERAL || process.env.KLAVIYO_LIST_GENERAL || "RkLAuk";
    const listReport = cfEnv.KLAVIYO_LIST_REPORT || process.env.KLAVIYO_LIST_REPORT || "VFDECK";

    const listId = source_page?.includes("report") ? listReport : listGeneral;
    const timestampNow = new Date().toISOString();

    const headers = {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "revision": "2024-07-15",
      "content-type": "application/vnd.api+json"
    };

    // 1. Crear o actualizar Perfil (Guarda first_name, UTMs, Opt-in opcional y Custom Properties)
    const profilePayload = {
      data: {
        type: "profile",
        attributes: {
          email: email,
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
            subscriber_lifecycle_status: subscriber_lifecycle_status || "subscriber",
            general_briefing_opt_in: general_briefing_opt_in || false
          }
        }
      }
    };

    const profileRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers,
      body: JSON.stringify(profilePayload)
    });

    // Si el perfil ya existía (HTTP 409 Conflict), actualizamos sus propiedades vía PATCH
    if (!profileRes.ok && profileRes.status === 409) {
      const conflictData = await profileRes.json();
      const existingId = conflictData?.errors?.[0]?.meta?.duplicate_profile_id;
      if (existingId) {
        await fetch(`https://a.klaviyo.com/api/profiles/${existingId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(profilePayload)
        });
      }
    }

    // 2. Disparar suscripción y Double Opt-in
    const subPayload = {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          custom_source: form_used || "Costa Ledger Web",
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: email,
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

    const subRes = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST",
      headers,
      body: JSON.stringify(subPayload)
    });

    if (!subRes.ok) {
      const errorData = await subRes.text();
      return new Response(JSON.stringify({ 
        error: "Klaviyo subscription failed", 
        details: errorData 
      }), {
        status: subRes.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, details: err.stack }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}