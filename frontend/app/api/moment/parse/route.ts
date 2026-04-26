import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Stub for sprint 1. Later this will call Claude.
  // We can pretend to read the request body, but for now we just return a canned response.
  
  return NextResponse.json({
    recipient: "Mom",
    occasion: "Birthday",
    when: "Tomorrow",
    tone: "Warm",
  });
}
