create policy "allow all 1ym93gt_0"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'screenshots'::text));


create policy "allow all 1ym93gt_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((bucket_id = 'screenshots'::text));


create policy "allow all 1ym93gt_2"
on "storage"."objects"
as permissive
for update
to public
using ((bucket_id = 'screenshots'::text));



