# Keep the 0.11 image's toolset (Ubuntu 22.04, Node, Bun, git, ...) so commands
# behave as before, and add the 1.x `sandbox-shim` that `Files` runs. The shim
# is statically linked; its tag must match the installed @cloudflare/sandbox.
FROM docker.io/cloudflare/sandbox:0.11.0

COPY --from=docker.io/cloudflare/sandbox:1.0.1 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim

# The 0.x control server is no longer used; the Durable Object runs commands
# through the Container API instead.
WORKDIR /workspace
ENTRYPOINT []
CMD ["sleep", "infinity"]
