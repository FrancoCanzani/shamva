

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."monitors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "url" "text",
    "method" "text",
    "headers" "jsonb" DEFAULT '{}'::"jsonb",
    "last_check_at" timestamp with time zone,
    "last_success_at" timestamp with time zone,
    "last_failure_at" timestamp with time zone,
    "body" "jsonb",
    "interval" integer,
    "status" "text",
    "error_message" "text",
    "name" "text",
    "regions" "jsonb",
    "workspace_id" "uuid",
    "slack_webhook_url" "text",
    "check_type" "text" DEFAULT 'http'::"text",
    "tcp_host_port" "text",
    CONSTRAINT "monitors_check_type_check" CHECK (("check_type" = ANY (ARRAY['http'::"text", 'tcp'::"text"])))
);


ALTER TABLE "public"."monitors" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_monitors_due_for_check"() RETURNS SETOF "public"."monitors"
    LANGUAGE "sql"
    AS $$
  SELECT m.*
  FROM monitors m
  WHERE m.status NOT IN ('paused', 'maintenance')
    AND (
      m.last_check_at IS NULL
      OR EXTRACT(EPOCH FROM (NOW() - m.last_check_at)) * 1000 >= m."interval"
    );
$$;


ALTER FUNCTION "public"."get_monitors_due_for_check"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "incident_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_name" "text",
    "author_email" "text",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."incident_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incidents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "monitor_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "notified_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "screenshot_url" "text",
    "post_mortem" "text",
    "downtime_duration_ms" bigint,
    "regions_affected" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "monitor_id" "uuid" NOT NULL,
    "url" "text",
    "status_code" integer,
    "latency" double precision NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "headers" "jsonb",
    "body_content" "jsonb",
    "error" "text",
    "method" "text",
    "region" "text",
    "colo" "text",
    "check_type" "text",
    "tcp_host" "text",
    "tcp_port" integer,
    "ok" boolean,
    CONSTRAINT "logs_check_type_check" CHECK (("check_type" = ANY (ARRAY['http'::"text", 'tcp'::"text"]))),
    CONSTRAINT "logs_tcp_port_check" CHECK ((("tcp_port" >= 1) AND ("tcp_port" <= 65535)))
);


ALTER TABLE "public"."logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "workspace_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "show_values" boolean DEFAULT true,
    "password" "text",
    "is_public" boolean DEFAULT true,
    "monitors" "text"[] DEFAULT '{}'::"text"[]
);


ALTER TABLE "public"."status_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "role" character varying(20) NOT NULL,
    "invitation_email" "text",
    "invitation_status" character varying(20) DEFAULT 'pending'::character varying,
    "invited_by" "uuid",
    CONSTRAINT "user_id_or_invitation_email_required" CHECK ((("user_id" IS NOT NULL) OR ("invitation_email" IS NOT NULL))),
    CONSTRAINT "workspace_members_invitation_status_check" CHECK ((("invitation_status")::"text" = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying])::"text"[]))),
    CONSTRAINT "workspace_members_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'member'::character varying, 'viewer'::character varying])::"text"[])))
);


ALTER TABLE "public"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" character varying(100) NOT NULL,
    "description" character varying(500),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."incident_updates"
    ADD CONSTRAINT "incident_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitors"
    ADD CONSTRAINT "monitors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_pages"
    ADD CONSTRAINT "status_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_pages"
    ADD CONSTRAINT "status_pages_workspace_id_slug_key" UNIQUE ("workspace_id", "slug");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_invitation_email_key" UNIQUE ("workspace_id", "invitation_email");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_user_id_key" UNIQUE ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_updates"
    ADD CONSTRAINT "incident_updates_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."logs"
    ADD CONSTRAINT "logs_monitor_id_fkey" FOREIGN KEY ("monitor_id") REFERENCES "public"."monitors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitors"
    ADD CONSTRAINT "monitors_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."status_pages"
    ADD CONSTRAINT "status_pages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON TABLE "public"."monitors" TO "anon";
GRANT ALL ON TABLE "public"."monitors" TO "authenticated";
GRANT ALL ON TABLE "public"."monitors" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_monitors_due_for_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_monitors_due_for_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_monitors_due_for_check"() TO "service_role";


















GRANT ALL ON TABLE "public"."incident_updates" TO "anon";
GRANT ALL ON TABLE "public"."incident_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_updates" TO "service_role";



GRANT ALL ON TABLE "public"."incidents" TO "anon";
GRANT ALL ON TABLE "public"."incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."incidents" TO "service_role";



GRANT ALL ON TABLE "public"."logs" TO "anon";
GRANT ALL ON TABLE "public"."logs" TO "authenticated";
GRANT ALL ON TABLE "public"."logs" TO "service_role";



GRANT ALL ON TABLE "public"."status_pages" TO "anon";
GRANT ALL ON TABLE "public"."status_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."status_pages" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_members" TO "anon";
GRANT ALL ON TABLE "public"."workspace_members" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_members" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
