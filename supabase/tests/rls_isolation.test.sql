begin;
select plan(8);

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'owner-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'owner-b@example.test');
insert into public.profiles (id, full_name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Owner A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'Owner B');
insert into public.companies (id, name, created_by) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Company A', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Company B', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2');
insert into public.company_members (company_id, user_id, role_key) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'owner');
insert into public.stores (id, company_id, name) values
  ('aaaaaaaa-1000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Store A'),
  ('bbbbbbbb-1000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'Store B');
insert into public.branches (id, company_id, store_id, name, code) values
  ('aaaaaaaa-2000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'aaaaaaaa-1000-4000-8000-000000000001', 'Branch A', 'A'),
  ('bbbbbbbb-2000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-1000-4000-8000-000000000002', 'Branch B', 'B');

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
select results_eq($$select name from public.companies order by name$$, array['Company A'], 'Owner A reads Company A only');
select results_eq($$select name from public.branches order by name$$, array['Branch A'], 'Owner A reads Branch A only');
select lives_ok($$insert into public.stores(company_id,name) values ('aaaaaaaa-0000-4000-8000-000000000001','Allowed A')$$, 'Owner A inserts in Company A');
select throws_ok($$insert into public.stores(company_id,name) values ('bbbbbbbb-0000-4000-8000-000000000002','Denied A')$$, '42501', null, 'Owner A cannot insert in Company B');
select lives_ok($$update public.stores set name='Updated A' where id='aaaaaaaa-1000-4000-8000-000000000001'$$, 'Owner A updates Company A');
select is_empty($$update public.stores set name='Stolen B' where id='bbbbbbbb-1000-4000-8000-000000000002' returning id$$, 'Owner A cannot update Company B');

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
select results_eq($$select name from public.companies order by name$$, array['Company B'], 'Owner B reads Company B only');
select throws_ok($$delete from public.stores where company_id='bbbbbbbb-0000-4000-8000-000000000002'$$, '42501', null, 'Direct delete is not granted');

select * from finish();
rollback;
