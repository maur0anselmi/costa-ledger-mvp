export const prerender = false;

// Función de ayuda para encriptar en SHA-256 (Requisito estricto de Meta para CAPI)
async function hashData(string) {
  if (!string) return undefined;
  const encoder = new TextEncoder();
  const data = encoder.encode(string.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(context) {
  try {
    const { request, locals } = context;
    const data = await request.json();
    const {
      email,
      name,
      phone_number,
      source_page,
      form_used,
      list_type,
      utm_source,
      utm_medium,
      utm_campaign,
      primary_interest,
      interests,
      consent_version,
      subscriber_lifecycle_status,
      general_briefing_opt_in,
      partner_consent_granted,
      contact_consent_granted
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
    const listAdvisory = cfEnv.KLAVIYO_LIST_ADVISORY || process.env.KLAVIYO_LIST_ADVISORY || "T6saqJ";

    let listId = listGeneral;
    if (list_type === "advisory" || source_page?.includes("apply") || form_used?.includes("ConsultationForm")) {
      listId = listAdvisory;
    } else if (list_type === "report" || source_page?.includes("report")) {
      listId = listReport;
    }

    const timestampNow = new Date().toISOString();

    const headers = {
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "revision": "2024-07-15",
      "content-type": "application/vnd.api+json"
    };

    const profileAttributes = {
      email: email,
      first_name: name || "",
      ...(phone_number ? { phone_number: phone_number } : {}),
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
        general_briefing_opt_in: general_briefing_opt_in || false,
        ...(partner_consent_granted !== undefined ? { partner_consent_granted } : {}),
        ...(contact_consent_granted !== undefined ? { contact_consent_granted } : {})
      }
    };

    const createPayload = {
      data: { type: "profile", attributes: profileAttributes }
    };

    const profileRes = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST", headers, body: JSON.stringify(createPayload)
    });

    if (!profileRes.ok && profileRes.status === 409) {
      const conflictData = await profileRes.json();
      const existingId = conflictData?.errors?.[0]?.meta?.duplicate_profile_id;
      if (existingId) {
        const patchPayload = {
          data: { type: "profile", id: existingId, attributes: profileAttributes }
        };
        await fetch(`https://a.klaviyo.com/api/profiles/${existingId}/`, {
          method: "PATCH", headers, body: JSON.stringify(patchPayload)
        });
      }
    }

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
                    email: { marketing: { consent: "SUBSCRIBED" } }
                  }
                }
              }
            ]
          }
        },
        relationships: {
          list: { data: { type: "list", id: listId } }
        }
      }
    };

    const subRes = await fetch("https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/", {
      method: "POST", headers, body: JSON.stringify(subPayload)
    });

    if (!subRes.ok) {
      const errorData = await subRes.text();
      return new Response(JSON.stringify({ error: "Klaviyo subscription failed", details: errorData }), {
        status: subRes.status, headers: { "Content-Type": "application/json" }
      });
    }

    // 3. INTEGRACIÓN META CONVERSIONS API
    try {
      const metaPixelId = "1107377358470069";
      const metaToken = cfEnv.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

      let eventName = "Subscribe";
      let contentName = "Vault Newsletter";

      if (list_type === "advisory" || source_page?.includes("apply")) {
        eventName = "Lead";
        contentName = "Partner Advisory";
      } else if (list_type === "report" || source_page?.includes("report")) {
        eventName = "Lead";
        contentName = "Intelligence Report";
      }

      const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "";
      const userAgent = request.headers.get("user-agent") || "";
      const requestUrl = new URL(request.url);
      
      const hashedEmail = await hashData(email);
      const hashedName = await hashData(name?.split(" ")[0]);

      const metaPayload = {
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: requestUrl.origin + (source_page || ""),
            user_data: {
              em: [hashedEmail],
              ...(hashedName ? { fn: [hashedName] } : {}),
              client_ip_address: clientIp,
              client_user_agent: userAgent
            },
            custom_data: {
              content_name: contentName
            }
          }
        ],
        // CÓDIGO DE PRUEBA AÑADIDO AQUÍ:
        test_event_code: "TEST68699"
      };

      await fetch(`https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metaPayload)
      });

    } catch (metaErr) {
      console.error("Meta CAPI Error:", metaErr);
    }

    return new Response(JSON.stringify({ success: true, list_used: listId }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, details: err.stack }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}