// Attach the running `web` container to Docker's built-in `bridge` network, so
// a reverse proxy started with plain `docker run` (nginx-proxy style, which
// lives on `bridge`) can discover it through VIRTUAL_HOST and reach it.
//
// This cannot live in docker-compose.yaml: Compose always adds the service
// name as a DNS alias on every network it attaches, and Docker rejects
// aliases on the default `bridge` network ("network-scoped aliases are only
// supported for user-defined networks"). So we connect it after `up`.
//
// Idempotent. The connection survives container and daemon restarts, but is
// lost when Compose recreates the container: run this after every `up`
// (`pnpm start:docker` does it for you).
import { execFileSync } from 'node:child_process';

const NETWORK = 'bridge';
const SERVICE = 'web';

const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8' }).trim();

const envFileArgs = process.argv.includes('--no-env-file')
  ? []
  : ['--env-file=.env'];

const containerId = docker('compose', ...envFileArgs, 'ps', '-q', SERVICE);

if (!containerId) {
  console.error(
    `No running "${SERVICE}" container: start the stack first (pnpm start:docker).`,
  );
  process.exit(1);
}

const networks = JSON.parse(
  docker(
    'inspect',
    '--format',
    '{{json .NetworkSettings.Networks}}',
    containerId,
  ),
);

if (NETWORK in networks) {
  console.log(`"${SERVICE}" is already on the "${NETWORK}" network.`);
} else {
  docker('network', 'connect', NETWORK, containerId);
  console.log(`Connected "${SERVICE}" to the "${NETWORK}" network.`);
}
