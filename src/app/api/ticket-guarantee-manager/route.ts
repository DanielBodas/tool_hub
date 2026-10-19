import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";
import { INITIAL_TICKETS } from "@/modules/ticket-guarantee-manager/initialData";

loadAllToolEnvs();

const TOOL_ID = "ticket-guarantee-manager";

async function isAuthorized(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session) {
    const isAllowed = isUserAllowedForTool(
      TOOL_ID,
      session.user?.email,
      session.user?.role
    );
    if (isAllowed) return true;
  }

  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get(`auth_tool_${TOOL_ID}`)?.value === "true" ||
    cookieStore.get("auth_dashboard")?.value === "true";

  return isUnlocked;
}

async function replaceCollectionData(db: any, collectionName: string, items: any[]) {
  try {
    const col = db.collection(collectionName);
    if (typeof col.deleteMany === "function") {
      await col.deleteMany({});
    } else if (typeof col.deleteOne === "function") {
      const existing = await col.find({}).toArray();
      for (const doc of existing) {
        if (doc._id) await col.deleteOne({ _id: doc._id });
        else if (doc.id) await col.deleteOne({ id: doc.id });
      }
    }

    if (items && items.length > 0) {
      if (typeof col.insertMany === "function") {
        await col.insertMany(items);
      } else if (typeof col.updateOne === "function") {
        for (const item of items) {
          const idKey = item._id || item.id || crypto.randomUUID();
          await col.updateOne({ id: idKey }, { $set: item }, { upsert: true });
        }
      }
    }
  } catch (err) {
    console.warn(`replaceCollectionData warning for ${collectionName}:`, err);
  }
}

export async function GET() {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.TICKET_GUARANTEE_MANAGER_DB_NAME || "ticket-guarantee-manager"
    );

    let tickets = await db.collection("tickets").find({}).toArray();

    // Auto-seed defaults if database is empty
    if (tickets.length === 0) {
      await replaceCollectionData(db, "tickets", INITIAL_TICKETS);
      tickets = INITIAL_TICKETS as any[];
    }

    // Sanitize MongoDB _id objects
    const cleanTickets = tickets.map((doc: any) => {
      const { _id, ...rest } = doc;
      return rest;
    });

    return NextResponse.json({ tickets: cleanTickets });
  } catch (e) {
    console.error("GET ticket-guarantee-manager error:", e);
    return NextResponse.json({
      tickets: INITIAL_TICKETS,
      isFallback: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const client = await clientPromise;
    const db = client.db(
      process.env.TICKET_GUARANTEE_MANAGER_DB_NAME || "ticket-guarantee-manager"
    );

    const { type, payload, ticket } = body;

    if (type === "sync_all" && Array.isArray(payload)) {
      await replaceCollectionData(db, "tickets", payload);
      return NextResponse.json({ success: true });
    }

    if (type === "save_ticket" && ticket) {
      const col = db.collection("tickets");
      const ticketId = ticket.id || crypto.randomUUID();
      const updatedTicket = { ...ticket, id: ticketId, updatedAt: new Date().toISOString() };

      await col.updateOne({ id: ticketId }, { $set: updatedTicket }, { upsert: true });
      return NextResponse.json({ success: true, ticket: updatedTicket });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("POST ticket-guarantee-manager error:", e);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isAuthorized();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("id");

    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(
      process.env.TICKET_GUARANTEE_MANAGER_DB_NAME || "ticket-guarantee-manager"
    );

    await db.collection("tickets").deleteOne({ id: ticketId });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE ticket-guarantee-manager error:", e);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
