revoke select on table public.product_website_content from anon;
grant select (product_id, published_content, is_published, published_at) on table public.product_website_content to anon;
