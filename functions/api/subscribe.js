export async function onRequestPost(context) {
  try {
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
      // Metadatos comerciales / partners opcionales
      requested_service,
      partner_consent,
      provider_routed,
      disclosure_version,
      handoff_timestamp
    } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = context.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = source_page?.includes("report") 
      ? context.env.KLAVIYO_LIST_REPORT 
      : context.env.KLAVIYO_LIST_GENERAL;

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
                  email: email,
                  first_name: name || "",
                  properties: {
                    // Atribución y Origen
                    source_page: source_page || "",
                    form_used: form_used || "",
                    utm_source: utm_source || "direct",
                    utm_medium: utm_medium || "none",
                    utm_campaign: utm_campaign || "none",

                    // Editorial y Preferencias
                    primary_interest: primary_interest || "General",
                    interests: interests || [],

                    // Consentimiento y Cumplimiento Legal
                    consent_timestamp: timestampNow,
                    consent_version: consent_version || "v1.0-2026",
                    subscriber_lifecycle_status: subscriber_lifecycle_status || "subscriber",

                    // Campos de Intención Comercial / Partners (Si aplican)
                    ...(requested_service && { requested_service }),
                    ...(partner_consent !== undefined && { partner_transfer_consent: partner_consent }),
                    ...(provider_routed && { provider_routed_to: provider_routed }),
                    ...(disclosure_version && { disclosure_version }),
                    ...(handoff_timestamp && { handoff_timestamp })
                  },
                  subscriptions: {
                    email: {
                      marketing: {
                        consent: "SUBSCRIBED"
                      }
                    }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: "list",
              id: listId
            }
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