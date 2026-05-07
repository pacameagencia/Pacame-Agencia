-- LSSI/RGPD compliance: do_not_contact + WhatsApp consent expreso

alter table public.prospect_leads
  add column if not exists do_not_contact boolean default false,
  add column if not exists do_not_contact_reason text,
  add column if not exists wa_consent boolean default false,
  add column if not exists wa_consent_at timestamptz,
  add column if not exists wa_consent_source text,
  add column if not exists reply_intent text,
  add column if not exists reply_received_at timestamptz;

create index if not exists idx_prospect_leads_dnc on public.prospect_leads(do_not_contact);
create index if not exists idx_prospect_leads_wa_consent on public.prospect_leads(wa_consent);

comment on column public.prospect_leads.do_not_contact is
  'Lista negra absoluta. Worker filtra estos leads. RGPD derecho de oposición.';
comment on column public.prospect_leads.wa_consent is
  'Consentimiento expreso WhatsApp. Solo true tras reply al email O click en CTA del demo.';
comment on column public.prospect_leads.wa_consent_source is
  'Origen consent: email_reply | demo_click_wa | demo_click_email | manual';
comment on column public.prospect_leads.reply_intent is
  'Intent detectado: yes | no | stop | info | auto_reply | reply_unclear | unknown';
