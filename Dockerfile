# Plain Ubuntu 26.04 with the same toolset the old sandbox:0.11.0 image had
# (Node, Bun, git, ...) so commands behave as before, plus the 1.x
# `sandbox-shim` that `Files` runs. The shim is statically linked; its tag must
# match the installed @cloudflare/sandbox.
FROM docker.io/ubuntu:26.04

ARG TARGETARCH
ARG NODE_VERSION=24.22.0
ARG BUN_VERSION=1.3.12

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates curl file git jq procps tzdata unzip wget xz-utils zip \
    && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETARCH:-amd64}" in \
        amd64) NODE_ARCH=x64; BUN_ARCH=x64 ;; \
        arm64) NODE_ARCH=arm64; BUN_ARCH=aarch64 ;; \
        *) echo "unsupported arch: ${TARGETARCH}" >&2; exit 1 ;; \
    esac \
    && curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz" \
        | tar -xJ --strip-components=1 -C /usr/local --exclude='*.md' --exclude=LICENSE \
    && curl -fsSL -o /tmp/bun.zip "https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}/bun-linux-${BUN_ARCH}.zip" \
    && unzip -j /tmp/bun.zip "bun-linux-${BUN_ARCH}/bun" -d /usr/local/bin \
    && rm /tmp/bun.zip

COPY --from=docker.io/cloudflare/sandbox:1.0.1 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim

# The Durable Object runs commands through the Container API, so the container
# only needs to stay alive.
WORKDIR /workspace
ENTRYPOINT []
CMD ["sleep", "infinity"]
