-- One read-only connection; fixed metadata checks precede the privileged call.
begin read only;
set local statement_timeout='5s';
set local search_path='';
do $guard$
begin
  if current_user <> 'offtracker_ops_reader' then
    raise exception 'monitor_identity_changed';
  end if;
  if not exists(select 1 from pg_catalog.pg_proc p where
    p.oid='offtracker_contact_private.read_operational_snapshot()'::pg_catalog.regprocedure
    and p.proowner='postgres'::pg_catalog.regrole and p.prosecdef and p.pronargs=0
    and p.prorettype='pg_catalog.jsonb'::pg_catalog.regtype
    and p.proconfig=array['search_path=""']::text[]
    and pg_catalog.md5(pg_catalog.btrim(p.prosrc,E' \n\r\t'))='d08e502f0c6cfce19ae1d522313849ed') then
    raise exception 'monitor_projection_definition_changed';
  end if;
  if exists(select 1 from pg_catalog.pg_proc p cross join lateral
      pg_catalog.aclexplode(coalesce(p.proacl,pg_catalog.acldefault('f',p.proowner))) a
      where p.oid='offtracker_contact_private.read_operational_snapshot()'::pg_catalog.regprocedure
      and a.grantee not in ('postgres'::pg_catalog.regrole,'offtracker_ops_reader'::pg_catalog.regrole))
    or exists(select 1 from pg_catalog.pg_auth_members where member='offtracker_ops_reader'::pg_catalog.regrole)
    or exists(select 1 from pg_catalog.pg_roles where rolname='offtracker_ops_reader'
      and (rolsuper or rolinherit or rolcreatedb or rolcreaterole or rolreplication or rolbypassrls)) then
    raise exception 'monitor_privilege_boundary_changed';
  end if;
  if exists(select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
      where n.nspname='offtracker_contact_private'
      and p.oid<>'offtracker_contact_private.read_operational_snapshot()'::pg_catalog.regprocedure
      and pg_catalog.has_function_privilege(current_user,p.oid,'EXECUTE'))
    or exists(select 1 from pg_catalog.pg_attribute a join pg_catalog.pg_class c on c.oid=a.attrelid
      join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='offtracker_contact_private' and c.relkind in ('r','p','v','m','f')
      and a.attnum>0 and not a.attisdropped and
        (pg_catalog.has_column_privilege(current_user,c.oid,a.attnum,'SELECT') or
         pg_catalog.has_column_privilege(current_user,c.oid,a.attnum,'INSERT') or
         pg_catalog.has_column_privilege(current_user,c.oid,a.attnum,'UPDATE')))
    or exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='offtracker_contact_private' and c.relkind in ('r','p','v','m','f')
      and (pg_catalog.has_table_privilege(current_user,c.oid,'DELETE') or
           pg_catalog.has_table_privilege(current_user,c.oid,'TRUNCATE') or
           pg_catalog.has_table_privilege(current_user,c.oid,'REFERENCES') or
           pg_catalog.has_table_privilege(current_user,c.oid,'TRIGGER'))) then
    raise exception 'monitor_private_access_expanded';
  end if;
end;
$guard$;
select offtracker_contact_private.read_operational_snapshot();
commit;
