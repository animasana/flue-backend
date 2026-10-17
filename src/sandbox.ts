// Minimal Sandbox Durable Object for @cloudflare/sandbox 1.x: implements the
// RPC methods that `cloudflareSandbox()` from `@flue/runtime/cloudflare` calls.

import { DurableObject } from "cloudflare:workers";
import { Files } from "@cloudflare/sandbox";

export class Sandbox extends DurableObject<unknown> {
    private get container(): Container {
        return this.ctx.container!;
    }

    private get files(): Files {
        return new Files(this.container);
    }

    private async ensureRunning(): Promise<void> {
        if (this.container.running) return;
        this.container.start({ image: this.container.images.sandbox, enableInternet: true });
        await this.container.setInactivityTimeout(10 * 60 * 1000);
    }

    async exec(command: string, options?: { cwd?: string; env?: Record<string, string>; timeout?: number }): Promise<{ success: boolean; exitCode: number; stdout: string; stderr: string }> {
        await this.ensureRunning();
        let argv = ["bash", "-c", command];
        if (options?.timeout !== undefined) {
            argv = ["timeout", `${options.timeout / 1000}`, ...argv];
        }
        const process = await this.container.exec(argv, {
            cwd: options?.cwd ?? "/workspace",
            env: options?.env,
        });
        const result = await process.output();
        const decoder = new TextDecoder();
        return {
            success: result.exitCode === 0,
            exitCode: result.exitCode,
            stdout: decoder.decode(result.stdout),
            stderr: decoder.decode(result.stderr),
        };
    }

    async readFile(path: string, options?: { encoding?: string }): Promise<{ content: string }> {
        await this.ensureRunning();
        const response = await this.files.readFile(path);
        if (options?.encoding === "base64") {
            return { content: Buffer.from(await response.arrayBuffer()).toString("base64") };
        }
        return { content: await response.text() };
    }

    async writeFile(path: string, content: string, options?: { encoding?: string }): Promise<{ success: true }> {
        await this.ensureRunning();
        const data = options?.encoding === "base64" ? Buffer.from(content, "base64") : content;
        await this.files.writeFile(path, data);
        return { success: true };
    }

    async exists(path: string): Promise<{ exists: boolean }> {
        await this.ensureRunning();
        try {
            await this.files.stat(path);
            return { exists: true };
        } catch {
            return { exists: false };
        }
    }

    async mkdir(path: string, options?: { recursive?: boolean }): Promise<{ success: true }> {
        await this.ensureRunning();
        await this.files.mkdir(path, { recursive: options?.recursive });
        return { success: true };
    }

    async deleteFile(path: string): Promise<{ success: true }> {
        await this.ensureRunning();
        await this.files.remove(path);
        return { success: true };
    }

    async getState(): Promise<{ status: string }> {
        return { status: this.ctx.container?.running ? "running" : "stopped" };
    }
}
