"use agent";

import { env } from "cloudflare:workers";
import { cloudflareSandbox } from "@flue/runtime/cloudflare";
import { useModel, useSandbox, type AgentProps } from "@flue/runtime";
import type { Sandbox as SandboxDO } from "../sandbox";

interface Env {
    Sandbox: DurableObjectNamespace<SandboxDO>;
}

export function CustomerSupport({ id }: AgentProps) {
    useModel("openai/gpt-6-luna");
    const { Sandbox } = env as unknown as Env;
    useSandbox(cloudflareSandbox(Sandbox.getByName(id)));

    return `You are a helper agent that helps the user with files and accounting`;
}
