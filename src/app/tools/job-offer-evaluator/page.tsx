import { ToolBaseLayout } from "@/components/ToolBaseLayout";
import { JobOfferEvaluatorModule } from "@/modules/job-offer-evaluator/JobOfferEvaluatorModule";
import { ToolSecurityGate } from "@/components/ToolSecurityGate";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadAllToolEnvs } from "@/lib/env";
import { isUserAllowedForTool } from "@/lib/toolAccess";

loadAllToolEnvs();

export default async function JobOfferEvaluatorPage() {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const isUnlocked =
    cookieStore.get("auth_tool_job-offer-evaluator")?.value === "true";
  const isAllowed = isUserAllowedForTool(
    "job-offer-evaluator",
    session?.user?.email,
    session?.user?.role,
  );

  if (!isUnlocked && !isAllowed) {
    const userBlocked = !!session && !isAllowed;
    return (
      <ToolSecurityGate
        toolId="job-offer-evaluator"
        toolName="Evaluador de Ofertas de Empleo"
        userBlocked={userBlocked}
      />
    );
  }

  return (
    <ToolBaseLayout toolName="Evaluador de Ofertas de Empleo">
      <JobOfferEvaluatorModule />
    </ToolBaseLayout>
  );
}
