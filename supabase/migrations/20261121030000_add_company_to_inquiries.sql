-- Keep the public inquiry API payload aligned with the database schema.
-- The inquiry form submits a company name; without this column PostgREST rejects
-- every otherwise-valid insert with PGRST204 (unknown column "company").
alter table public.inquiries
  add column if not exists company text;

comment on column public.inquiries.company is
  'Company name supplied in the public business enquiry form';
