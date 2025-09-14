-- Enable RLS on all tables
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- =========================
-- MONITORS
-- =========================
-- Public SELECT allowed (no policy)
-- INSERT / UPDATE / DELETE restricted

-- Create monitors
create policy "Admins and members can create monitors"
on monitors
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = monitors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
);

-- Update monitors
create policy "Admins and members can edit monitors"
on monitors
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = monitors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = monitors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
);

-- Delete monitors
create policy "Only admins can delete monitors"
on monitors
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = monitors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

-- =========================
-- COLLECTORS
-- =========================
-- SELECT / INSERT / UPDATE / DELETE restricted to workspace members/admins

create policy "Admins and members can select collectors"
on collectors
for select
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = collectors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
);

create policy "Admins and members can create collectors"
on collectors
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = collectors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
);

create policy "Admins and members can edit collectors"
on collectors
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = collectors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = collectors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
  )
);

create policy "Only admins can delete collectors"
on collectors
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = collectors.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

-- =========================
-- INCIDENTS
-- =========================
create policy "Admins and members can create incidents"
on incidents
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    join monitors m on m.workspace_id = wm.workspace_id
    where m.id = incidents.monitor_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Admins and members can edit incidents"
on incidents
for update
using (
  exists (
    select 1
    from workspace_members wm
    join monitors m on m.workspace_id = wm.workspace_id
    where m.id = incidents.monitor_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    join monitors m on m.workspace_id = wm.workspace_id
    where m.id = incidents.monitor_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Only admins can delete incidents"
on incidents
for delete
using (
  exists (
    select 1
    from workspace_members wm
    join monitors m on m.workspace_id = wm.workspace_id
    where m.id = incidents.monitor_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
      and wm.invitation_status = 'accepted'
  )
);

-- =========================
-- INCIDENT UPDATES
-- =========================
-- Users can only manage their own updates
create policy "Users can create their own incident updates"
on incident_updates
for insert
to authenticated
with check (auth.uid() = author_id);

create policy "Users can update their own incident updates"
on incident_updates
for update
to authenticated
using (auth.uid() = author_id)
with check (auth.uid() = author_id);

create policy "Users can delete their own incident updates"
on incident_updates
for delete
to authenticated
using (auth.uid() = author_id);

-- =========================
-- WORKSPACE MEMBERS
-- =========================
-- Only admins can manage members
create policy "Admins can manage workspace members"
on workspace_members
for insert
with check (
  -- Allow workspace creator to add themselves as first admin
  (
    workspace_id IN (
      SELECT id FROM workspaces WHERE created_by = auth.uid()
    )
  )
  OR
  -- Allow existing admins to add members
  exists (
    select 1
    from workspace_members wm2
    where wm2.workspace_id = workspace_members.workspace_id
      and wm2.user_id = auth.uid()
      and wm2.role = 'admin'
      and wm2.invitation_status = 'accepted'
  )
);

create policy "Admins can update workspace members"
on workspace_members
for update
using (
  exists (
    select 1
    from workspace_members wm2
    where wm2.workspace_id = workspace_members.workspace_id
      and wm2.user_id = auth.uid()
      and wm2.role = 'admin'
      and wm2.invitation_status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm2
    where wm2.workspace_id = workspace_members.workspace_id
      and wm2.user_id = auth.uid()
      and wm2.role = 'admin'
      and wm2.invitation_status = 'accepted'
  )
);

create policy "Admins can delete workspace members"
on workspace_members
for delete
using (
  exists (
    select 1
    from workspace_members wm2
    where wm2.workspace_id = workspace_members.workspace_id
      and wm2.user_id = auth.uid()
      and wm2.role = 'admin'
      and wm2.invitation_status = 'accepted'
  )
);

-- =========================
-- WORKSPACES
-- =========================
-- Only admins can create/update/delete
create policy "Admins can create workspaces"
on workspaces
for insert
with check (auth.uid() = created_by);

create policy "Admins can update workspaces"
on workspaces
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

create policy "Admins can delete workspaces"
on workspaces
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = workspaces.id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

-- =========================
-- STATUS PAGES
-- =========================
-- Public SELECT, members can create, only admins can update/delete
create policy "Members can create status pages"
on status_pages
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = status_pages.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member', 'admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Admins can update status pages"
on status_pages
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = status_pages.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = status_pages.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

create policy "Admins can delete status pages"
on status_pages
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = status_pages.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
  )
);

-- =========================
-- HEARTBEATS
-- =========================
create policy "Admins and members can create heartbeats"
on heartbeats
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = heartbeats.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Admins and members can edit heartbeats"
on heartbeats
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = heartbeats.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = heartbeats.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Only admins can delete heartbeats"
on heartbeats
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = heartbeats.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
      and wm.invitation_status = 'accepted'
  )
);

-- =========================
-- NOTIFICATIONS
-- =========================
create policy "Admins and members can create notifications"
on notifications
for insert
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = notifications.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Admins and members can edit notifications"
on notifications
for update
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = notifications.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
)
with check (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = notifications.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('member','admin')
      and wm.invitation_status = 'accepted'
  )
);

create policy "Only admins can delete notifications"
on notifications
for delete
using (
  exists (
    select 1
    from workspace_members wm
    where wm.workspace_id = notifications.workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'admin'
      and wm.invitation_status = 'accepted'
  )
);

-- =========================
-- FEEDBACKS
-- =========================
create policy "Users can create their own feedback"
on feedbacks
for insert
to authenticated
with check (auth.uid() = user_id);
