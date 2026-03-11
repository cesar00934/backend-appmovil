import dotenv from "dotenv";

dotenv.config();

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SERVICE_ROLE_KEY"
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
}