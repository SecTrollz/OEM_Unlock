# OEM_UNLOCK — Project Blueprint

This is a map of what exists today: where the real logic lives, how the
copy-pasteable scripts get produced from it, and how the pieces connect.

## 1. System shape

The tool is a **response-mutating MITM proxy script**: it sits between an
Android device and Google's provisioning/AFW endpoints, rewrites JSON
responses to say "unlock is allowed," and (in some variants) rewrites
outgoing requests too.

The scripts you actually paste into a proxy tool (Burp/MITMproxy/Proxy
Pin) have no module system available where they run — you paste one file's
full text into a script box, nothing more. That constraint used to force
the same detection/modification logic to be hand-written from scratch in
every script. It no longer does: there's one real implementation in
`src/core/`, thin per-runtime wrappers in `src/adapters/`, and a build step
(`build.js`) that inlines the two into the same self-contained root-level
files users have always copy-pasted — so the files you paste stay exactly
where they were, but nothing is hand-duplicated anymore.

## 2. File-by-file

### `src/core/` — the one implementation

Pure functions, no proxy-runtime globals, fully unit-testable.

| File | Role |
|---|---|
| `detectors.js` | `hasOemLockStatus`, `hasProvisioningStatus`, `hasCarrierLockStatus`, `hasBootloaderStatus`, `hasPolicyRestrictions`, `isUnlockRelatedRequest`. |
| `modifiers.js` | `modifyOemLockStatus`, `modifyProvisioningStatus`, `modifyCarrierLockStatus`, `modifyBootloaderStatus`, `modifyPolicyRestrictions`, `forceUnlockSuccess`, `addAntiRelockMeasures`. Each takes a `{ permanent }` option — `true` adds the anti-relock fields the Proxy Pin Android variant needs, `false` matches the plain-unlock behavior of the generic script. |
| `pipeline.js` | `runPipeline(body, path, { permanent })` — the single ordered detect→modify waterfall every adapter runs. Also `shouldIntercept(hostname, targetHosts)`, the host-scoping check every adapter (including the broad-fallback one) now uses. |
| `utils.js` | `getNested`/`setNested`, `byteLength` (Buffer-or-TextEncoder-safe), `decompressGzip` (warns explicitly if no `Zlib` is available instead of silently leaving the body compressed), `safeParseJson` (tries strict JSON, then a wrapper-extraction fallback), `generateUnlockToken`. |
| `config.js` | `TARGET_HOSTS` (the canonical hostname allowlist), `LOCK_FIELDS` (field-name keywords for the broad-fallback sweep), `REQUEST_GUARD_KEYWORDS` (shared by the two request-side guards). **The one place to edit any of these.** |

### `src/adapters/` — per-runtime templates

Each one is a thin driver over `src/core` for a specific proxy runtime.
These are the *source*; the generated files below are the *output*.

| Template | Runtime | Generates |
|---|---|---|
| `generic-proxy.template.js` | Generic scripting proxy (`proxy.onResponse`, optional `Buffer`/`Zlib`) | `oem_unlock.js` |
| `proxypin-extension.template.js` | Proxy Pin browser extension / `window.proxyPin` / Node | `oem_unlock_proxy_pin.js` |
| `proxypin-android.template.js` | Proxy Pin Android app, `permanent: true` | `proxypin-oem-unlock.js` |
| `broad-fallback.template.js` | Any of the above, wider field-name sweep + regex fallback | `nuclear_unlock.js` |
| `anti-relock.template.js` | Proxy Pin Android app, `proxy.onRequest` | `anti-relock.js` |
| `pre-unlock.template.js` | Generic scripting proxy, `proxy.onRequest` | `pre_unlock.js` |

### `build.js` — regenerates the root files

Reads a template plus whatever `src/core` modules it requires, inlines
them (in dependency order) into one self-contained file with no
`require`/`module.exports` left in it, and writes it back to the existing
root-level filename. Run `npm run build` after editing anything in `src/`.
**Do not hand-edit the generated root files** — each one has an
`AUTO-GENERATED` banner and gets overwritten on the next build.

### Root-level generated files

`oem_unlock.js`, `oem_unlock_proxy_pin.js`, `proxypin-oem-unlock.js`,
`nuclear_unlock.js`, `anti-relock.js`, `pre_unlock.js` — same filenames and
same copy-paste-into-your-proxy-tool workflow as before, now produced by
`build.js` instead of hand-maintained.

### `test/`

`detectors.test.js`, `modifiers.test.js`, `pipeline.test.js`, `utils.test.js`
— run via `npm test` (Node's built-in `node:test`, no dependency to add).
Possible now because `src/core` doesn't touch any proxy-runtime globals.

### `scripts/` — one guided entry point

| File | Role |
|---|---|
| `lib.js` | Shared helpers used by both scripts below: `buildScripts()`, `ensureCert()`, `getLocalIp()` (for telling the phone what address to proxy through), `hasBinary()`. One implementation, not duplicated between the two commands. |
| `start.js` (`npm start`) | The one command most people need. Builds everything, then walks through the rest as a numbered, plain-language wizard — pausing after each step (via `readline`) until you press Enter, so you can go do it on your phone first. Branches between two paths depending on whether `mitmproxy` is installed: a desktop-proxy path (shows your LAN IP + port, waits for the cert to be installed, then launches `mitmproxy -s oem_unlock.js` in the foreground) or a Proxy Pin path (phone-only, no desktop process to launch, so it prints the in-app steps instead). Ends both paths at the same instruction: dial the carrier's SIM-unlock USSD code. Falls back to a non-interactive mode automatically (no hanging on `Press ENTER`) when there's no TTY attached — e.g. run from CI or a script. `--offline` skips straight to the mock server, no phone required. |
| `setup.js` (`npm run setup`) | The non-interactive version of `start.js`'s first step only: build + cert, then exit. For scripting, CI, or anyone who wants the prep without the wizard. |

The wizard framing exists because the previous two-command version
(`npm run setup && npm start`) still assumed you knew what a LAN IP,
a certificate, or a USSD trigger code were. `npm start` now explains each
one inline, one at a time, and never dumps the whole checklist at once.

The USSD dial itself is never visible to the interceptor — only the actual
HTTPS provisioning request it triggers is, which is what every path above
converges on watching for.

### Offline/local tooling

| File | Role |
|---|---|
| `mock-server.js` | Node `http` server on port 3000 serving canned JSON for `/v1/device/provisioning` and `/v1/device/unlock`, for testing without hitting real Google endpoints. Run via `npm run start-offline` (or `npm start` when `mitmproxy` isn't found). |

### Documentation

| File | Role |
|---|---|
| `README.md` | Top-level pitch, disclaimer, setup, troubleshooting summary. |
| `HOW-TO-WITH-PROXYPIN-OFFLINE.md` | Offline/local walkthrough. Links to `oem_unlock_proxy_pin.js` and `mock-server.js` rather than pasting a second copy of either. |
| `Nuke-unlock-doc.md` | Walkthrough for the broad-fallback script. Links to `nuclear_unlock.js`. |
| `proxypinondevice.md` | Proxy Pin Android app walkthrough, phase-by-phase unlock procedure. Links to `proxypin-oem-unlock.js` and `anti-relock.js`. |
| `commonissues.md` | Troubleshooting/FAQ. Points at `src/core/config.js` as the one place to add a newly-discovered hostname, instead of keeping its own separate list. |
| `BRANDING.md` | Logo/visual identity design system. |

## 3. What changed and why

This structure replaced one where four interceptor scripts and two
request-guard scripts each hand-reimplemented the same detection/
modification logic independently, with the target-hostname list duplicated
in five disagreeing versions, three `.md` docs pasting a full second copy
of a script inline, no unit tests possible (everything lived inside
`proxy.onResponse` closures), and a broad-fallback script that intercepted
*every* HTTPS request on the device rather than just provisioning traffic.
Concretely:

- **One implementation, six generated outputs.** A bug fix or new field
  now goes into `src/core` once and reaches all six scripts via
  `npm run build`, instead of needing to be copy-pasted into four files by
  hand (and kept in sync with three docs on top of that).
- **One hostname list.** `src/core/config.js`'s `TARGET_HOSTS` is the only
  place it's defined; `commonissues.md` and the broad-fallback script both
  reference it instead of keeping independent copies.
- **`nuclear_unlock.js` is host-scoped.** It now runs `shouldIntercept()`
  like every other adapter — it no longer processes every HTTPS request
  the device makes regardless of domain.
- **Docs link to code instead of duplicating it.** The three walkthroughs
  that used to paste a full script inline now link to the generated file,
  so there's exactly one copy to go stale.
- **Real bugs fixed in `src/core/utils.js`:** gzip decompression now warns
  explicitly when it can't run instead of silently returning a still-
  compressed body; content-length calculation no longer depends on which
  of `Buffer`/`TextEncoder` happens to exist in a given script.
- **`README.md`'s quick-start now runs.** `package.json` declares the
  `build`/`test`/`start-offline` scripts the docs already referenced.
