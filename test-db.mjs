import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Mock WebSocket for Node.js environment (so @supabase/supabase-js doesn't fail on initialization)
global.WebSocket = class {};

// Simple env parser
const envContent = fs.readFileSync(".env", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim();
    if (key && !key.startsWith("#")) {
      env[key] = val;
    }
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", url);
console.log("Supabase Key:", key ? "configured (length: " + key.length + ")" : "undefined");

const supabase = createClient(url, key);

async function test() {
  console.log("Attempting to query active_users...");
  const { data, error } = await supabase.from("active_users").select("*");
  if (error) {
    console.error("Error querying active_users:", error);
  } else {
    console.log("Success! Active users rows:", data);
  }
}

test();
