-- Reference silos + Finance heatmap dimensions.
-- Applied automatically by `supabase db reset`. Safe to re-run after truncate
-- because slugs are unique (ON CONFLICT DO NOTHING).

INSERT INTO public.departments (slug, name) VALUES
  ('finance', 'Finance'),
  ('marketing', 'Marketing'),
  ('logistics', 'Logistics')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.skill_catalog (slug, name, category, sort_order) VALUES
  ('financial-modeling', 'Financial Modeling', 'Finance', 10),
  ('auditing', 'Auditing', 'Finance', 20),
  ('tax-compliance', 'Tax Compliance', 'Finance', 30),
  ('fp-and-a', 'FP&A', 'Finance', 40),
  ('treasury', 'Treasury', 'Finance', 50),
  ('internal-controls', 'Internal Controls', 'Finance', 60),
  ('erp-systems', 'ERP / Systems', 'Finance', 70),
  ('stakeholder-communication', 'Stakeholder Communication', 'Finance', 80)
ON CONFLICT (slug) DO NOTHING;
