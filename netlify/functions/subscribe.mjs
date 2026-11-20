/**
 * Red Thread Labs — mail list subscribe endpoint
 * POST /api/subscribe   { email, first_name?, last_name?, source?, "bot-field"? }
 *
 * Creates (or upserts) the subscriber in Kit, then adds them to the Kit form
 * so any form-triggered automation or welcome sequence fires.
 *
 * Required environment variables (set in Netlify → Site configuration → Environment variables):
 *   KIT_API_KEY   — Kit → Settings → Developer → API Key  (v4 key)
 *   KIT_FORM_ID   — the numeric ID of the Kit form (see the deploy checklist)
 *
 * The API key is read server-side only. It is never exposed to the browser.
 */

const KIT_API = 'https://api.kit.com/v4';

// Deliberately permissive — real validation is Kit's job. This only catches typos
// and obvious junk before we spend an API call on it.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Find the Kit custom field for last name (label "Last name" or key "last_name"),
// creating it if it doesn't exist yet. Returns { key, label } or null.
async function lastNameField(headers) {
  const match = (f) => /^last[\s_-]?name$/i.test(String(f.label || '')) || /^last[\s_-]?name$/i.test(String(f.key || ''));
  try {
    const res = await fetch(`${KIT_API}/custom_fields?per_page=100`, { headers });
    if (res.ok) {
      const found = ((await res.json()).custom_fields || []).find(match);
      if (found) return { key: found.key, label: found.label };
    }
    const made = await fetch(`${KIT_API}/custom_fields`, { method: 'POST', headers, body: JSON.stringify({ label: 'Last name' }) });
    if (made.ok) {
      const f = (await made.json()).custom_field || {};
      return { key: f.key || 'last_name', label: f.label || 'Last name' };
    }
    console.warn('Could not find or create the Kit "Last name" field', made.status, await made.text());
  } catch (err) {
    console.warn('Last name field lookup failed', err);
  }
  return null;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.KIT_API_KEY;
  const formId = process.env.KIT_FORM_ID;

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID environment variable.');
    return json(500, { error: 'Mail list is not configured yet.' });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Expected JSON.' });
  }

  // Honeypot: real people leave this empty; bots fill every field they find.
  // Return 200 so the bot believes it succeeded and doesn't retry.
  if (payload['bot-field']) {
    return json(200, { ok: true });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const firstName = String(payload.first_name || '').trim().slice(0, 100);
  // Kit has no built-in last name; it's stored in a custom field labelled "Last name"
  // (create it in Kit → Subscribers → Custom fields for it to show up there).
  const lastName = String(payload.last_name || '').trim().slice(0, 100);

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json(400, { error: 'That email address does not look right.' });
  }

  const headers = {
    'X-Kit-Api-Key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  try {
    // 0. Is this person already in Kit? New people are created as "inactive" so the
    //    form's confirmation (double opt-in) email goes out when they're added to the
    //    form. People already on the list keep their current status.
    let existing = null;
    try {
      const lookup = await fetch(`${KIT_API}/subscribers?status=all&email_address=${encodeURIComponent(email)}`, { headers });
      if (lookup.ok) existing = ((await lookup.json()).subscribers || [])[0] || null;
    } catch {}
    const isNew = !existing;
    const lnField = lastName ? await lastNameField(headers) : null;

    // 1. Create the subscriber (or update their name if they already exist).
    const createBody = {
      email_address: email,
      ...(isNew ? { state: 'inactive' } : {}),
      ...(firstName ? { first_name: firstName } : {}),
      ...(lnField ? { fields: { [lnField.key]: lastName } } : {}),
    };
    let createRes = await fetch(`${KIT_API}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createBody),
    });
    // If Kit rejects the custom field (e.g. it doesn't exist yet), try again without it.
    if (!createRes.ok && lnField) {
      console.warn('Kit rejected subscriber with last name; retrying without it', createRes.status, await createRes.text());
      delete createBody.fields;
      createRes = await fetch(`${KIT_API}/subscribers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(createBody),
      });
    }

    if (!createRes.ok) {
      const detail = await createRes.text();
      console.error('Kit create-subscriber failed', createRes.status, detail);
      return json(502, { error: 'Could not reach the mail list right now.' });
    }

    // 1b. Make sure the last name actually saved; if not, try again using the field's label.
    let lastNameSaved = !lastName;
    if (lnField) {
      try {
        const sub = (await createRes.clone().json()).subscriber || {};
        const vals = Object.values(sub.fields || {});
        lastNameSaved = vals.includes(lastName);
        if (!lastNameSaved && sub.id) {
          const upd = await fetch(`${KIT_API}/subscribers/${sub.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ email_address: email, fields: { [lnField.label]: lastName } }),
          });
          const updSub = upd.ok ? ((await upd.json()).subscriber || {}) : {};
          lastNameSaved = Object.values(updSub.fields || {}).includes(lastName);
          if (!lastNameSaved) console.warn('Kit did not store the last name', upd.status);
        }
      } catch (err) {
        console.warn('Last name check failed', err);
      }
    }

    // 2. Add them to the form. This is what fires the form's opt-in email
    //    and any automation you've wired to it. Kit requires the subscriber
    //    to already exist, which is why step 1 comes first.
    const formRes = await fetch(`${KIT_API}/forms/${formId}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email_address: email,
        referrer: String(payload.source || req.headers.get('referer') || '').slice(0, 500),
      }),
    });

    if (!formRes.ok) {
      const detail = await formRes.text();
      // The subscriber exists at this point, so this is a partial success —
      // log loudly but don't make the visitor think they failed.
      console.error('Kit add-to-form failed', formRes.status, detail);
    }

    // added_to_form tells you (and Claude, when testing) whether the form step worked.
    return json(200, { ok: true, added_to_form: formRes.ok, needs_confirmation: isNew, last_name_saved: lastNameSaved });
  } catch (err) {
    console.error('Subscribe handler threw', err);
    return json(502, { error: 'Could not reach the mail list right now.' });
  }
};

export const config = {
  path: '/api/subscribe',
};
