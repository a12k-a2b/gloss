import type { Article, Term } from "@/lib/types";

function t(
  partial: Omit<Term, "diagram"> & { diagram?: Term["diagram"] },
): Term {
  return {
    ...partial,
    diagram: partial.diagram ?? {
      title: partial.term,
      caption: partial.gloss,
      lanes: [
        {
          nodes: [
            { id: "a", label: partial.term, kind: "box" },
            { id: "b", label: "in this\npassage", kind: "note" },
          ],
          edges: [{ from: "a", to: "b" }],
        },
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  I'm a Happy engineer now — default sample                                 */
/* -------------------------------------------------------------------------- */

const happyTerms: Term[] = [
  t({
    id: "happy",
    term: "Happy",
    aliases: ["Happy app", "Happy’s", "Happy's"],
    gloss: "A remote control for Claude Code — phone, tablet, or browser instead of a terminal.",
    explanation:
      "Happy is an open-source mobile and web client for Claude Code. It is not an IDE and not a chatbot bolted onto a laptop. It is a client that talks to a daemon sitting next to your actual coding environment, so you can steer the same session from a phone or a Daylight tablet. Three pieces: the app (happy), a CLI bridge (happy-cli), and a server that keeps sessions and devices in sync (happy-server).",
    analogy:
      "You used to have to sit at the piano to play it. Happy is the practice-room intercom: you speak from the hallway, the pianist (Claude Code) is still at the keys, and the room is still your room.",
    context:
      "This whole essay is a love letter to that intercom. Denys is not writing code on a phone. He is reclaiming dead time — a grocery-store walk, a commute — to steer work that still happens in a real workspace.",
    excerpt: "Think of it as a remote control for your coding environment",
    related: ["claude-code", "happy-daemon", "micro-sessions"],
    diagram: {
      title: "Happy is the remote, not the piano",
      caption: "The app on the tablet talks to a daemon in the workspace. Claude Code still does the playing.",
      lanes: [
        {
          nodes: [
            { id: "app", label: "Happy app\n(DC-1 / phone)", kind: "actor" },
            { id: "srv", label: "happy-server", kind: "box" },
            { id: "ws", label: "workspace +\nClaude Code", kind: "box" },
          ],
          edges: [
            { from: "app", to: "srv", label: "session" },
            { from: "srv", to: "ws", label: "steer" },
          ],
        },
      ],
    },
  }),
  t({
    id: "claude-code",
    term: "Claude Code",
    aliases: [],
    gloss: "An AI that lives in a terminal and can actually touch your repo — not just chat about it.",
    explanation:
      "Claude Code is Anthropic’s agentic coding tool. It runs next to your files, can read and edit them, run commands, and keep a long conversation about a real codebase. Happy does not replace it. Happy is how you reach it when you are not at a keyboard.",
    analogy:
      "A very fast junior engineer who already has a checkout of your repo and is waiting on Slack. Happy is just a nicer Slack client.",
    context:
      "When Denys says he deployed Jellyfin from the grocery store, Claude Code is who wrote the Helm chart. Happy is who he talked to while walking.",
    excerpt: "Happy is an open-source mobile and web client for Claude Code",
    related: ["happy", "yolo", "mcp"],
  }),
  t({
    id: "micro-sessions",
    term: "micro-sessions",
    aliases: ["micro-session"],
    gloss: "Two-minute visits to a project, stolen from a line or a commute — not a day at the desk.",
    explanation:
      "A micro-session is a short, real unit of work done away from the workstation. Not ‘check Slack.’ Ship something: open a PR, nudge a deploy, answer Claude’s question so it can keep going. The point of Happy, in this essay, is that those slices add up.",
    analogy:
      "Folding one shirt every time you walk past the laundry pile. You never ‘do laundry.’ The drawer still fills.",
    context:
      "This is Denys’s answer to the docs’ joke that writing code on a phone would be miserable. He agrees. He is not writing code. He is closing loops.",
    excerpt:
      "I’ve found a different use case that’s equally valuable: micro-sessions throughout the day.",
    related: ["happy", "claude-code"],
    diagram: {
      title: "Dead time, reclaimed",
      caption: "Desk is still the desk. The line at the store is no longer empty.",
      lanes: [
        {
          nodes: [
            { id: "line", label: "waiting\nin line", kind: "actor" },
            { id: "happy", label: "Happy\nmicro-session", kind: "box" },
            { id: "pr", label: "PR / deploy", kind: "box" },
          ],
          edges: [
            { from: "line", to: "happy" },
            { from: "happy", to: "pr" },
          ],
        },
      ],
    },
  }),
  t({
    id: "gitops",
    term: "GitOps",
    aliases: [],
    gloss: "The computers only change when a shared notebook changes. Saying yes to a suggested edit is how you deploy.",
    explanation:
      "GitOps means the description of what should be running lives in a shared notebook (git). A watcher reads the notebook and makes the machines match. You do not log into the machines and type commands. You propose an edit. When someone accepts it, the machines catch up.",
    analogy:
      "The kitchen only cooks what’s on the posted menu. To change dinner, you edit the menu and pin it back on the wall. Nobody yells new orders through the pass.",
    context:
      "The grocery-store story: ‘Set up Jellyfin using Helm via GitOps’ is not ‘log into the cluster.’ It is ‘write the menu change, open the PR, let the kitchen catch up.’",
    excerpt: "Set up Jellyfin in my cluster using Helm via GitOps",
    related: ["helm", "kubernetes", "happy"],
  }),
  t({
    id: "helm",
    term: "Helm",
    aliases: ["Helm chart"],
    gloss: "A recipe card for installing an app on the cluster — fill in a few blanks, get a running service.",
    explanation:
      "Helm is a recipe book for the cluster. A chart is a known recipe plus a short list of your choices (which port, how much memory). ‘Install Jellyfin via Helm’ means: don’t write the whole kitchen plan by hand; use a recipe someone already tested.",
    analogy:
      "A cake mix. You still choose chocolate or vanilla (the values). You do not mill the flour.",
    context:
      "Happy + Claude Code wrote the chart and the GitOps PR. Helm is why that sentence is one sentence instead of an afternoon.",
    excerpt: "generated the Helm chart configuration, created the pull request",
    related: ["gitops", "kubernetes"],
  }),
  t({
    id: "kubernetes",
    term: "Kubernetes",
    aliases: ["K8s"],
    gloss: "A city planner for containers: rooms (pods), streets (networks), and a front desk that keeps the hotel full.",
    explanation:
      "Kubernetes runs containers across a fleet of machines. It gives every workload an address, restarts what dies, and (if you ask) exposes it. Almost everything in this post — Happy server, Postgres, Redis, the workspace — is a citizen of one cluster.",
    analogy:
      "A hotel that can spin up a new room when a guest arrives and quietly recycle it when they leave. You talk to the front desk, not to the carpenter.",
    context:
      "Self-hosting Happy, for Denys, means ‘run it on my cluster,’ not ‘rent a Heroku button.’ The rest of the essay is the furniture of that hotel.",
    excerpt: "To self-host Happy like I do, you’ll need a Kubernetes cluster",
    related: ["helm", "tailscale", "hostnetwork"],
    diagram: {
      title: "Everything in this post lives here",
      caption: "Happy server, database, cache, and the workspace pod are all guests of the same hotel.",
      lanes: [
        {
          nodes: [
            { id: "app", label: "Happy\nserver", kind: "box" },
            { id: "k8s", label: "Kubernetes\ncluster", kind: "box" },
            { id: "ws", label: "workspace\npod", kind: "box" },
          ],
          edges: [
            { from: "app", to: "k8s" },
            { from: "k8s", to: "ws" },
          ],
        },
      ],
    },
  }),
  t({
    id: "tailscale",
    term: "Tailscale",
    aliases: ["tailnet"],
    gloss: "A private wire between your machines that tries to be a handshake and, failing that, a relay.",
    explanation:
      "Tailscale is a mesh VPN built on WireGuard. Every device in your tailnet gets an identity and a stable address. It first tries a direct path. If NAT is in the way it falls back to relays (DERP). In this post it is how a phone reaches a cluster that has no ports open on the public internet.",
    analogy:
      "A set of walkie-talkies that first try the park, then call a dispatcher if the trees are too thick. The nametag on the radio is your identity. The radio link is just the path.",
    context:
      "‘All traffic is encrypted at the network layer via Tailscale’s WireGuard protocol.’ The Happy app never needs a public IP. It needs to be on the same tailnet as the cluster.",
    excerpt:
      "Your Happy app connects through Tailscale, creating a secure peer-to-peer tunnel to your cluster.",
    related: ["wireguard", "hostnetwork", "private-ca"],
    diagram: {
      title: "Phone to cluster, no public door",
      caption: "The Happy app dials the tailnet. The cluster never opens a port on the street.",
      lanes: [
        {
          nodes: [
            { id: "phone", label: "Happy app", kind: "actor" },
            { id: "ts", label: "Tailscale\ntunnel", kind: "cloud" },
            { id: "k8s", label: "cluster", kind: "box" },
          ],
          edges: [
            { from: "phone", to: "ts" },
            { from: "ts", to: "k8s" },
          ],
        },
      ],
    },
  }),
  t({
    id: "self-host",
    term: "self-host",
    aliases: ["self-hosted", "self-hosting"],
    gloss: "Running the server in your house (or your cluster) instead of borrowing someone else’s.",
    explanation:
      "Self-hosting means you operate the software. You get the reliability and the keys; you also get the pages and the 3 a.m. The public Happy server was fine until it started timing out. Then ‘I rely on this daily’ became ‘I will run it.’",
    analogy:
      "Eating at a restaurant until the kitchen keeps closing mid-meal. Then you buy a stove.",
    context:
      "The note at the top of that section is honest: most people should not do this. He did it because the public API died and Claude Code is how he works.",
    excerpt:
      "If the public Happy server works well for you, there’s no need to run your own infrastructure.",
    related: ["happy", "kubernetes"],
  }),
  t({
    id: "e2e",
    term: "end-to-end encryption",
    aliases: ["End-to-End Encryption", "zero-trust"],
    gloss: "The server can shuffle the sealed envelopes. It cannot read the letters.",
    explanation:
      "End-to-end encryption means only the endpoints — your devices — can read the session. The relay in the middle (happy-server) is not in the club. ‘Zero-trust’ here is the matching posture: do not assume the network or the server is a friend; prove it with keys.",
    analogy:
      "A post office that is legally forbidden to steam open the mail. They can lose a letter. They cannot gossip about it.",
    context:
      "Listed as a core Happy feature. It is why handing sessions through a server you don’t own is still, in principle, safe — and why he still self-hosted when that server got flaky.",
    excerpt: "Zero-trust architecture with secure key exchange keeps your code private",
    related: ["happy", "tailscale"],
  }),
  t({
    id: "happy-daemon",
    term: "happy-daemon",
    aliases: ["happy daemon", "daemon"],
    gloss: "The process in the workspace that sits up and waits for you to start a session.",
    explanation:
      "The daemon is the bridge inside the workspace pod. It is started with whatever LLM provider you exported (MiniMax, Z.AI, Anthropic). New Happy sessions attach to it. You cannot switch providers from the phone; you switch by restarting this process with different environment variables.",
    analogy:
      "The night clerk in the workspace. You call the front desk (the app). The clerk already decided, when their shift started, which kitchen they will order from.",
    context:
      "The annoying-but-honest limitation: provider is locked at daemon start. The shell scripts later in the post exist only because of this process.",
    excerpt:
      "The happy-daemon running inside the workspace waits for new sessions.",
    related: ["happy", "claude-code"],
  }),
  t({
    id: "traefik",
    term: "Traefik",
    aliases: [],
    gloss: "The doorman: it takes the public-facing knock and walks it to the right room, certificates in hand.",
    explanation:
      "Traefik is a reverse proxy. It terminates TLS, looks at the hostname, and forwards the request to the right Kubernetes service. In this setup it sits next to Tailscale inside the cluster. You never expose Happy on the raw internet; you expose Traefik on the tailnet.",
    analogy:
      "The restaurant has one number. A host answers, checks the reservation (the certificate), and walks you to table 12. You never dial the kitchen.",
    context:
      "He points at a whole other post — Tailscale + Traefik + Private CA — for the networking. If the margin on this essay feels thin, that companion is where the NAT and DERP live.",
    excerpt:
      "Traffic routes through Traefik to the Happy Server service.",
    related: ["tailscale", "private-ca", "hostnetwork"],
  }),
  t({
    id: "private-ca",
    term: "private CA",
    aliases: ["certificate authority", "private certificate authority"],
    gloss: "A notary only your household trusts — stamps that this shop is this shop, without telling the whole city the shop’s name.",
    explanation:
      "A certificate authority signs ‘this key belongs to this name.’ A public CA (Let’s Encrypt) publishes those names in Certificate Transparency logs. A private CA — here via OpenBao — signs names that only your devices know how to trust. No public log of happy.internal.",
    analogy:
      "Anyone can print a card that says First National Bank. A notary stamp from a notary your teller already knows is what makes the card mean something. Your household hired its own notary so the newspaper never prints the address.",
    context:
      "He wants HTTPS even inside Tailscale (defense in depth). Android’s Happy app didn’t trust his household notary until he patched it. That patch is PR #278.",
    excerpt:
      "without exposing my internal hostnames to public Certificate Transparency logs",
    related: ["traefik", "openbao", "tailscale"],
    diagram: {
      title: "A notary the newspaper never meets",
      caption: "OpenBao signs the cert. Your devices trust OpenBao. The public internet never sees the name.",
      lanes: [
        {
          nodes: [
            { id: "bao", label: "OpenBao\n(private CA)", kind: "box" },
            { id: "svc", label: "Happy\nvia Traefik", kind: "box" },
            { id: "phone", label: "your phone", kind: "actor" },
          ],
          edges: [
            { from: "bao", to: "svc", label: "signs" },
            { from: "svc", to: "phone", label: "HTTPS" },
          ],
        },
      ],
    },
  }),
  t({
    id: "openbao",
    term: "OpenBao",
    aliases: [],
    gloss: "A locked filing cabinet for secrets — and a desk that can issue those private certificates.",
    explanation:
      "OpenBao is an open-source fork of HashiCorp Vault. It stores secrets (API keys, database passwords) and can run a PKI engine: a private certificate authority. Happy server fetches credentials from it at runtime so they are not baked into images.",
    analogy:
      "The office safe. The app does not keep the combination in a sticky note on the monitor. It asks the safe when it needs a key, and the safe can also stamp official letterhead.",
    context:
      "Shows up twice: secrets for the server, and the private CA that makes Android HTTPS work. Same cabinet, two drawers.",
    excerpt:
      "It fetches sensitive credentials (API keys, database passwords) from OpenBao at runtime.",
    related: ["private-ca", "traefik"],
  }),
  t({
    id: "wireguard",
    term: "WireGuard",
    aliases: ["WireGuard protocol"],
    gloss: "A very small, very fast tunnel. Tailscale is a nametag service built on top of it.",
    explanation:
      "WireGuard is a modern VPN protocol: short, auditable, fast. Tailscale uses it as the actual tube and then adds identity, NAT traversal, and key distribution on top. When the post says ‘encrypted at the network layer via Tailscale’s WireGuard protocol,’ it means the tube, not the nametag.",
    analogy:
      "The cardboard tube between two ships. Tailscale is the customs officer who decides who is allowed to speak into it.",
    context:
      "He still wants HTTPS on top. WireGuard encrypts the path. A stolen or disabled Tailscale session should not leave Happy talking HTTP in the clear.",
    excerpt:
      "All traffic is encrypted at the network layer via Tailscale’s WireGuard protocol.",
    related: ["tailscale", "private-ca"],
  }),
  t({
    id: "hostnetwork",
    term: "hostNetwork",
    aliases: ["hostNetwork: true", "host networking"],
    gloss: "Skip the hotel hallway. The pod uses the building’s own front door.",
    explanation:
      "In Kubernetes a pod normally gets its own network namespace and a ClusterIP. hostNetwork: true puts the pod on the node’s network instead. It can bind the node’s ports and, crucially, be reached on the node’s Tailscale IP. That is how Traefik avoids an extra layer of NAT.",
    analogy:
      "Most guests get a room number. This guest is allowed to sit at the reception desk and answer the street door directly.",
    context:
      "Tailscale uses hostNetwork so it can punch out of the cluster. The companion post is almost entirely about why that matters.",
    excerpt:
      "Tailscale uses hostNetwork: true to expose itself directly on the host network",
    related: ["kubernetes", "tailscale", "traefik"],
    diagram: {
      title: "Room number vs street door",
      caption: "A normal pod is room 412. hostNetwork sits at reception and takes the street.",
      lanes: [
        {
          label: "Normal pod",
          nodes: [
            { id: "pod", label: "pod\nClusterIP", kind: "box" },
            { id: "nat", label: "node NAT", kind: "box" },
            { id: "net", label: "outside", kind: "cloud" },
          ],
          edges: [
            { from: "pod", to: "nat" },
            { from: "nat", to: "net" },
          ],
        },
        {
          label: "hostNetwork",
          nodes: [
            { id: "h", label: "Traefik /\nTailscale", kind: "box" },
            { id: "door", label: "node's\nstreet door", kind: "box" },
          ],
          edges: [{ from: "h", to: "door", label: "same network" }],
        },
      ],
    },
  }),
  t({
    id: "mcp",
    term: "MCP",
    aliases: ["Model Context Protocol"],
    gloss: "A USB standard for giving an AI extra hands — GitHub, ArgoCD, search — without teaching it each one from scratch.",
    explanation:
      "The Model Context Protocol is a common way to plug tools into an LLM. An MCP server exposes actions (list workflows, sync an app, search the web). Claude Code reads a config file and suddenly has those hands. Denys runs several: GitHub Actions, ArgoCD, Woodpecker, and a self-hosted SearXNG.",
    analogy:
      "Before USB, every printer had its own cable. MCP is USB: one shape of plug, many peripherals.",
    context:
      "This is how ‘I use Happy as my primary development environment’ is not bluster. The agent in the workspace can deploy and debug because someone handed it tools.",
    excerpt:
      "I have several Model Context Protocol (MCP) servers configured",
    related: ["claude-code", "yolo"],
  }),
  t({
    id: "yolo",
    term: "YOLO mode",
    aliases: ["bypass permissions"],
    gloss: "Let the agent work without asking permission every time — because you already locked the doors it must not open.",
    explanation:
      "YOLO mode (his name for ‘bypass permissions’) means the agent can read files, run commands, and call tools without a human click on each one. That is only sane if the blast radius is small. His bet: isolate the workspace from the home network and from production, then let it run.",
    analogy:
      "You don’t stand over the sous-chef with a ‘may I chop?’ sign. You do lock the walk-in that holds the good wine, and you don’t give them the keys to the other restaurant.",
    context:
      "The most human paragraph in the post. The NetworkPolicy is not paranoia. It is what makes autonomy feel adult instead of reckless.",
    excerpt:
      "I run my agents in what some might call “bypass permissions” mode—or as I like to think of it, “YOLO mode.”",
    related: ["networkpolicy", "mcp", "claude-code"],
    diagram: {
      title: "Autonomy inside a locked room",
      caption: "The agent may do almost anything. The room has no door to the house or to production.",
      lanes: [
        {
          nodes: [
            { id: "agent", label: "agent\n(YOLO)", kind: "actor" },
            { id: "ws", label: "workspace\nsandbox", kind: "box" },
            { id: "house", label: "home net /\nproduction", kind: "cloud" },
          ],
          edges: [
            { from: "agent", to: "ws", label: "free" },
            { from: "ws", to: "house", dashed: true, label: "blocked" },
          ],
        },
      ],
    },
  }),
  t({
    id: "networkpolicy",
    term: "NetworkPolicy",
    aliases: ["network isolation"],
    gloss: "A guest list for packets: who this pod may call, and who may call it.",
    explanation:
      "A Kubernetes NetworkPolicy is a firewall for a pod. Denys’s workspace may reach the public internet (LLM APIs, packages), DNS, the Happy server, and Tailscale. It may not reach the rest of the private network. Inbound, only SSH from Tailscale on 2222. That is the lock on the YOLO room.",
    analogy:
      "A hotel room whose phone can only dial the front desk and 911. It cannot dial other rooms, and nobody in the hallway can knock except the night clerk you already know.",
    context:
      "Read this section next to YOLO mode. One without the other is either babysitting or negligence.",
    excerpt:
      "even if a workspace pod is compromised, it cannot access other services in the cluster or private networks.",
    related: ["yolo", "kubernetes"],
  }),
  t({
    id: "llm",
    term: "LLM",
    aliases: ["LLMs", "LLM provider", "LLM providers", "LLM APIs"],
    gloss: "A very well-read intern you type to. It drafts; it does not know your house.",
    explanation:
      "A large language model is the kind of AI Denys is talking to. You write in ordinary language. It writes code, plans, and replies. An ‘LLM provider’ is just the company whose intern you hired this hour — MiniMax, GLM, Anthropic, and the rest.",
    analogy:
      "A freelance writer you can text. Brilliant on the page. Has never been inside your apartment.",
    context:
      "The whole post is about steering one of these from a phone, and swapping which company you hire without sitting at a desk.",
    excerpt: "I’ve configured Happy to use different LLM providers depending on the task.",
    related: ["claude-code", "happy"],
  }),
  t({
    id: "ide",
    term: "IDE",
    aliases: ["traditional IDE"],
    gloss: "The big app programmers live in — a word processor that also runs the program.",
    explanation:
      "An IDE is the usual all-in-one writing desk for software: editor, debugger, file tree. Denys is saying Happy plus Claude Code has replaced that desk for most of his day.",
    analogy:
      "A carpenter’s full workshop. He still owns one. He now does a surprising amount of work by phone, talking to someone who is already in the workshop.",
    context:
      "‘I rarely need a traditional IDE setup anymore’ is the thesis, not a flex.",
    excerpt: "I rarely need a traditional IDE setup anymore.",
    related: ["claude-code", "happy"],
  }),
  t({
    id: "ssh",
    term: "SSH",
    aliases: ["SSH-ing", "SSH connection", "SSH keys"],
    gloss: "A locked phone call into another computer’s keyboard.",
    explanation:
      "SSH is how you sit at a computer that is somewhere else and type as if you were there. Fine on a laptop. Miserable on a phone: tiny text, broken shortcuts, flickering screens. Happy exists because that phone call is a bad remote control.",
    analogy:
      "Borrowing someone’s desk by staring through a mail slot and shouting keystrokes.",
    context:
      "The whole ‘Why not Claude Code via SSH?’ section is him listing why the mail slot failed him.",
    excerpt: "I used Claude Code directly in a terminal by SSH-ing into my container.",
    related: ["terminal", "tmux", "happy"],
  }),
  t({
    id: "terminal",
    term: "terminal",
    aliases: ["terminal UI", "TUI"],
    gloss: "A text-only window where you type orders to the computer, no buttons.",
    explanation:
      "A terminal is a blank page that only understands typed commands. A TUI is a program that still lives in that page — menus drawn with characters, not with tap targets. On a phone it flickers and fights you.",
    analogy:
      "A restaurant where the only way to order is to write the kitchen a telegram.",
    context:
      "Happy is the opposite: a proper app, with a real text box, talking to the same kitchen.",
    excerpt: "Claude Code’s terminal UI flickers and behaves erratically over SSH",
    related: ["ssh", "tmux", "happy"],
  }),
  t({
    id: "tmux",
    term: "tmux",
    aliases: ["tmux session"],
    gloss: "A way to leave a terminal window running after you hang up.",
    explanation:
      "tmux keeps a typing session alive on the other computer so you can disconnect and come back. It is what people used before they had a real remote-control app. Denys is done with it.",
    analogy:
      "Leaving the TV on pause in a hotel room so the movie is still there after dinner.",
    context:
      "Happy is offered as the thing you use instead of locking yourself into a tmux session.",
    excerpt: "instead of locking you into a tmux session or SSH connection",
    related: ["ssh", "terminal"],
  }),
  t({
    id: "cli",
    term: "CLI",
    aliases: ["Happy CLI", "command line"],
    gloss: "A program you talk to by typing, not by tapping buttons.",
    explanation:
      "A command-line interface is software with no pictures — you type a line, it answers. happy-cli is the small typed tool that introduces your real computer to the Happy app on your phone.",
    analogy:
      "The intercom in the lobby. You say a sentence. The building does something.",
    context:
      "‘npm install -g happy-coder && happy’ is him handing you that intercom.",
    excerpt: "This will install the Happy CLI and launch the setup wizard",
    related: ["npm", "happy"],
  }),
  t({
    id: "npm",
    term: "npm",
    aliases: ["Node.js"],
    gloss: "A store and a toolbox for installing little programs written in JavaScript.",
    explanation:
      "Node.js is a way to run JavaScript on a computer, not just in a browser. npm is the shop that fetches those programs. The one-liner in the post is: install the Happy tool from that shop, then run it.",
    analogy:
      "An app store you operate with a typed sentence instead of a tap.",
    context:
      "The getting-started path for everyone who is not self-hosting.",
    excerpt: "npm install -g happy-coder && happy",
    related: ["cli", "happy"],
  }),
  t({
    id: "pull-request",
    term: "pull request",
    aliases: ["PR", "pull requests"],
    gloss: "A suggested edit to a shared notebook. Merge is ‘yes, write it in.’",
    explanation:
      "A pull request is a proposed change sitting in a waiting room. Other people can read it, comment, and accept it. Once accepted (merged), it becomes the official text — and in Denys’s world, the official text is what the cluster runs.",
    analogy:
      "A suggested revision in the margin of a shared cookbook. When the household says yes, tomorrow’s dinner changes.",
    context:
      "The grocery-store story: Happy wrote the suggestion. Accepting it is what turned Jellyfin on.",
    excerpt: "created the pull request to my GitOps repository",
    related: ["gitops", "happy"],
  }),
  t({
    id: "jellyfin",
    term: "Jellyfin",
    aliases: [],
    gloss: "A homemade Netflix: your movies, your computer, no monthly bill.",
    explanation:
      "Jellyfin is software that plays the films and shows you already own, from a computer in your house, to the rest of your devices. The grocery-store anecdote is not about movies. It is about installing that server from a phone.",
    analogy:
      "A family screening room in the basement, with a remote that works from the supermarket.",
    context:
      "The one concrete ‘I did this while walking’ story in the essay.",
    excerpt: "deploy Jellyfin to my home Kubernetes cluster while I was out running errands",
    related: ["helm", "gitops", "micro-sessions"],
  }),
  t({
    id: "postgres",
    term: "PostgreSQL",
    aliases: ["Postgres"],
    gloss: "The filing cabinet the server writes facts into and can find again tomorrow.",
    explanation:
      "PostgreSQL is a database: a careful, long-lived set of tables. Happy’s server stores accounts, sessions, and the like here so a restart does not give everyone amnesia.",
    analogy:
      "The parish register. Not a sticky note. A bound book.",
    context:
      "Listed next to Redis. Redis is the sticky notes. Postgres is the register.",
    excerpt: "PostgreSQL — Happy server database",
    related: ["redis", "longhorn"],
  }),
  t({
    id: "redis",
    term: "Redis",
    aliases: [],
    gloss: "A pad of sticky notes the server uses for things it needs in a hurry.",
    explanation:
      "Redis keeps small facts in memory so the server can grab them fast — who is logged in right now, a cached reply. If the pad is thrown away, the filing cabinet (Postgres) still has the real record.",
    analogy:
      "The tickets on the kitchen pass. Dinner is still in the book if they fall.",
    context:
      "Part of the Happy server stack table, next to Postgres and the file closet.",
    excerpt: "Redis — Caching and session management",
    related: ["postgres"],
  }),
  t({
    id: "longhorn",
    term: "Longhorn",
    aliases: ["Persistent Storage", "PVC"],
    gloss: "A hard drive that survives even if the app is torn down and rebuilt.",
    explanation:
      "Programs in a cluster are disposable. Persistent storage is the closet that is not. Longhorn is one way to give that closet to a program. A PVC is just the reservation slip for a shelf in it.",
    analogy:
      "The apartment can be gutted. The storage unit down the street still has your boxes.",
    context:
      "Why the database and the workspace files are not lost every time he updates Happy.",
    excerpt: "Persistent Storage — Database & files — Longhorn, Ceph, Rook, or cloud",
    related: ["postgres", "kubernetes"],
  }),
  t({
    id: "talos",
    term: "Talos Linux",
    aliases: ["Talos"],
    gloss: "An operating system that only knows how to be a Kubernetes machine — no desktop, no extras.",
    explanation:
      "Talos is a stripped-down computer OS built only to run a cluster. You do not browse the web on it. You do not install random apps. That boredom is the security feature.",
    analogy:
      "A kitchen that has no living room. You cannot flop on the sofa because there isn’t one.",
    context:
      "How his particular cluster is built. He tells beginners to try a smaller kitchen first (k3s).",
    excerpt: "My cluster runs on Talos Linux, a purpose-built OS for Kubernetes",
    related: ["k3s", "kubernetes"],
  }),
  t({
    id: "k3s",
    term: "k3s",
    aliases: ["microk8s"],
    gloss: "Kubernetes in a lunchbox — same idea, much smaller kitchen.",
    explanation:
      "k3s and microk8s are smaller, friendlier ways to run the same kind of cluster on one machine. Same vocabulary. Less ceremony. His advice: practice here before you copy the full house.",
    analogy:
      "A camping stove before you install a restaurant range.",
    context:
      "The closing advice, twice: start with k3s or microk8s.",
    excerpt: "consider lighter alternatives like k3s or microk8s for testing",
    related: ["kubernetes", "talos"],
  }),
  t({
    id: "https",
    term: "HTTPS",
    aliases: ["TLS", "SSL termination"],
    gloss: "The lock on a website: the talk is sealed, and the shop proves it is the shop.",
    explanation:
      "HTTPS (the lock) is HTTP — ordinary web talk — wrapped in TLS, a handshake that encrypts the conversation and shows a certificate. ‘SSL termination’ means the doorman (Traefik) unwraps that lock and walks the now-plain request inside.",
    analogy:
      "A wax-sealed letter the butler opens at the door, then carries the note to the kitchen.",
    context:
      "He wants this lock even inside Tailscale. Belt and suspenders. The Android app had to be taught to trust his household seal.",
    excerpt: "I always want HTTPS enabled—even though Tailscale’s WireGuard tunnel encrypts traffic",
    related: ["private-ca", "traefik"],
  }),
  t({
    id: "lets-encrypt",
    term: "Let's Encrypt",
    aliases: ["Let’s Encrypt", "Certificate Transparency"],
    gloss: "A free public notary for websites — and a newspaper that prints every name it stamps.",
    explanation:
      "Let’s Encrypt is a public certificate authority: it will vouch, for free, that this name belongs to this shop. The catch is Certificate Transparency, a public log of every name it has stamped. Fine for a bakery. Not fine if the name is happy.internal.",
    analogy:
      "A city notary who also takes out a classified ad every time they stamp something.",
    context:
      "Why he hired a household notary (OpenBao) instead of the free public one.",
    excerpt: "without exposing my internal hostnames to public Certificate Transparency logs",
    related: ["private-ca", "openbao"],
  }),
  t({
    id: "react-native",
    term: "React Native",
    aliases: [],
    gloss: "A way to write one app that becomes both iPhone and Android.",
    explanation:
      "React Native lets someone write the Happy app once and ship it to phones. You do not need to know this to use Happy. It is why there is one client instead of two separate science projects.",
    analogy:
      "One sewing pattern, two sizes of shirt.",
    context:
      "A single bullet in the architecture list. Harmless. Included so it does not stay a mysterious proper noun.",
    excerpt: "happy — The mobile and web client (built with React Native)",
    related: ["happy"],
  }),
  t({
    id: "open-source",
    term: "open-source",
    aliases: ["open source"],
    gloss: "The recipe is public. Anyone can cook it, copy it, or improve it.",
    explanation:
      "Open-source software publishes its own instructions. You can run it yourself, read how it works, and send back a better page. Happy is this. So is OpenBao. So is Jellyfin.",
    analogy:
      "A family cookbook left on the porch, with a pencil tied to the spine.",
    context:
      "The first fact about Happy, and the reason he can patch the Android app (PR #278).",
    excerpt: "Happy is an open-source mobile and web client for Claude Code",
    related: ["happy"],
  }),
  t({
    id: "api",
    term: "API",
    aliases: ["API endpoint", "API keys"],
    gloss: "The doorbell a program rings to ask another program for something.",
    explanation:
      "An API is a published way for one piece of software to request work from another. An endpoint is a specific doorbell. An API key is the house key you show when you ring. When the public Happy doorbell started timing out, he built his own.",
    analogy:
      "The take-out window. You do not walk into the kitchen. You use the window they designed.",
    context:
      "The reason he self-hosted: the public window stopped answering.",
    excerpt: "the API endpoint started timing out frequently",
    related: ["self-host", "happy"],
  }),
  t({
    id: "pod",
    term: "pod",
    aliases: ["pods", "workspace pod"],
    gloss: "One running guest in the cluster hotel — a small sealed room with a job.",
    explanation:
      "A pod is the smallest unit Kubernetes will run for you: usually one program in a little room. It can be replaced. The workspace pod is the room where Claude Code actually sits and types.",
    analogy:
      "A hotel room rented by the hour for one task. If it gets messy, they give you a new room and throw the old one out.",
    context:
      "YOLO mode is only sane because this room has no door to the rest of the house.",
    excerpt: "even if a workspace pod is compromised, it cannot access other services",
    related: ["kubernetes", "yolo", "networkpolicy"],
  }),
  t({
    id: "container",
    term: "container",
    aliases: ["containers"],
    gloss: "A sealed lunchbox with a program and everything it needs to run, and nothing else.",
    explanation:
      "A container is a packed-up program: the app plus its tools, isolated from the rest of the machine. Kubernetes’s job is to place and replace these lunchboxes. A pod is usually one lunchbox on a tray.",
    analogy:
      "A bento box. The sandwich cannot wander off and eat the rest of the fridge.",
    context:
      "When he says ‘SSH-ing into my container,’ he means climbing into that lunchbox with a keyboard.",
    excerpt: "I used Claude Code directly in a terminal by SSH-ing into my container.",
    related: ["pod", "kubernetes"],
  }),
  t({
    id: "workspace",
    term: "workspace",
    aliases: ["dev-workspace", "workspace setup"],
    gloss: "The room where the work actually happens — files, tools, and the daemon waiting for you.",
    explanation:
      "The workspace is not the Happy app. It is the place Claude Code sits: your files, your tools, the happy-daemon. The phone is only the intercom into that room.",
    analogy:
      "The studio. Happy is the walkie-talkie you take to the store.",
    context:
      "A whole section. Isolation, YOLO, MCP tools — all of it is furniture in this room.",
    excerpt: "All sessions run in a shared dev-workspace container",
    related: ["happy-daemon", "claude-code", "yolo"],
  }),
  t({
    id: "argocd",
    term: "ArgoCD",
    aliases: ["GitOps repository"],
    gloss: "The clerk who watches the shared notebook and updates the cluster when the notebook changes.",
    explanation:
      "ArgoCD is software that practices GitOps for you. It watches a repository and keeps the cluster looking like the latest accepted page. Denys hands Claude Code an ArgoCD tool so a phone conversation can become a real deploy.",
    analogy:
      "A stage manager with the current script. Change the script, the set changes.",
    context:
      "One of the MCP tools, and the silent partner of the grocery-store Helm chart.",
    excerpt: "GitHub Actions, ArgoCD, Woodpecker CI, and a self-hosted SearXNG",
    related: ["gitops", "mcp"],
  }),
  t({
    id: "ingress",
    term: "ingress",
    aliases: ["Ingress routing"],
    gloss: "The front door of the cluster: which name goes to which room.",
    explanation:
      "Ingress is the rule sheet for incoming visits. Traefik reads the name you asked for (happy.something) and walks you to the right service. Without it, every program would need its own street door.",
    analogy:
      "The directory in a lobby. You say a name. The concierge points.",
    context:
      "Step two of ‘How it works’: traffic comes in through Tailscale, then ingress (Traefik) picks the room.",
    excerpt: "Ingress routing: traffic routes through Traefik to the Happy Server service.",
    related: ["traefik", "tailscale"],
  }),
  t({
    id: "pat",
    term: "personal access token",
    aliases: ["Personal Access Token", "GitHub PAT", "PAT"],
    gloss: "A password with a job description: this key may only do these few things.",
    explanation:
      "A personal access token is a spare key you mint for a program. You can limit which doors it opens and throw it away if it leaks. Denys gives Claude Code a GitHub token that only reaches the repos he chose.",
    analogy:
      "A hotel keycard coded for the gym and room 412 — not the penthouse, not the safe.",
    context:
      "The warning at the end of MCP tools: one workspace, one token, is convenient and a little sloppy.",
    excerpt: "A single workspace is convenient. For stronger isolation, run one workspace per repository with its own GitHub PAT",
    related: ["mcp", "yolo"],
  }),
  t({
    id: "peer-to-peer",
    term: "peer-to-peer",
    aliases: ["peer-to-peer tunnel"],
    gloss: "Two devices talking directly, like two cups and a string — no town square in the middle.",
    explanation:
      "Peer-to-peer means your phone and the cluster try to speak to each other without parking the conversation on someone else’s computer. Tailscale’s job is to set up that string, and to call a relay only if the string will not stretch.",
    analogy:
      "A tin-can telephone. The dispatcher is only called if the string snags on a tree.",
    context:
      "How the Happy app reaches a cluster that has no public front door.",
    excerpt: "creating a secure peer-to-peer tunnel to your cluster",
    related: ["tailscale", "wireguard"],
  }),
];

const happyArticle: Article = {
  id: "happy-engineer",
  title: "I'm a Happy engineer now",
  dek: "A remote control for Claude Code, a Daylight in the bag, and a cluster that never opens a street door.",
  source: "Denys Vitali · Jan 12, 2026",
  url: "https://blog.denv.it/posts/im-happy-engineer-now/",
  field: "software",
  minutes: 20,
  blocks: [
    {
      type: "p",
      text: "I’m now officially a Happy engineer! In this post, I’ll explain what Happy is, why I decided to self-host it, and how my setup works. I’ll also share practical details about my LLM provider strategy, workspace configuration, and the lessons I learned along the way.",
    },
    {
      type: "p",
      text: "Happy is becoming more than just a tool—it’s evolving into my primary development environment. With MCP tool integration and remote development capabilities, I rarely need a traditional IDE setup anymore.",
    },
    { type: "h2", text: "Why I’m Happy" },
    {
      type: "p",
      text: "The title of this post isn’t just a clever play on words. I genuinely am a happier engineer thanks to AI-assisted coding.",
    },
    {
      type: "p",
      text: "Like many developers, I struggled with the gap between having ideas and having time to implement them. The frustration wasn’t programming itself—I love writing code. The problem was scale: I had countless side project ideas and far too few hours to make them reality. As I wrote on Hacker News:",
    },
    {
      type: "quote",
      text: "I truly enjoy programming, but the most frustrating part for me was that I had many ideas and too little time to work on everything. Thanks to AI I can now work on many side projects at a time, and most importantly just get things done quickly and most of the time in good enough (or sometimes excellent) results.",
    },
    {
      type: "p",
      text: "AI assistance has transformed my development workflow. I can now tackle multiple projects simultaneously, ship features faster, and spend less time on repetitive tasks. The productivity boost is substantial—not because I’m writing more code, but because I’m focusing on the right problems: architecture, design, and creative solutions rather than boilerplate and debugging.",
    },
    {
      type: "p",
      text: "What makes this truly powerful is mobility. Happy + Claude Code means I’m no longer tethered to my desk. I can review pull requests during my commute, debug issues while waiting in line, or deploy updates from my couch. The ability to make progress from anywhere—on a tablet, a phone, or a laptop—has fundamentally changed how I approach software development.",
    },
    { type: "h2", text: "What is Happy?" },
    {
      type: "p",
      text: "Happy is an open-source mobile and web client for Claude Code, built by the community to untether your AI-assisted development from a traditional terminal. Think of it as a remote control for your coding environment—one that works from your phone, tablet, or browser instead of locking you into a tmux session or SSH connection.",
    },
    { type: "h3", text: "Core features" },
    {
      type: "list",
      ordered: false,
      items: [
        "Mobile & Web Access — Use Claude Code from iPhone, Android, or any modern browser",
        "Real-Time Voice — Speak commands naturally and watch them execute live (not simple dictation—actual command parsing and execution)",
        "End-to-End Encryption — Zero-trust architecture with secure key exchange keeps your code private",
        "Session Sync — Start a conversation on your phone, continue on your laptop—everything stays in sync",
        "Push Notifications — Get alerted when Claude needs your input, so you never miss a beat",
      ],
    },
    { type: "h3", text: "How I actually use it" },
    {
      type: "p",
      text: "I primarily use Happy on mobile devices—specifically my Daylight DC-1 tablet and smartphone—leveraging the real-time sync feature to maintain continuity across devices. I haven’t deeply explored the voice features yet; the text interface has proven more than sufficient for my workflow.",
    },
    {
      type: "p",
      text: "The official documentation asks rhetorically:",
    },
    {
      type: "quote",
      text: "Are you actually trying to write code on your phone? No. Absolutely not. That would be miserable to spend all day on my phone.",
    },
    {
      type: "p",
      text: "But I’ve found a different use case that’s equally valuable: micro-sessions throughout the day. When I’m commuting, waiting in line, or just away from my workstation, Happy lets me make progress in bite-sized chunks. It’s not about replacing my desk—it’s about reclaiming dead time.",
    },
    { type: "h3", text: "A real example" },
    {
      type: "p",
      text: "Here’s how this works in practice: I recently needed to deploy Jellyfin to my home Kubernetes cluster while I was out running errands. Instead of waiting until I got home, I opened Happy on my phone and had a conversation:",
    },
    { type: "code", text: "Set up Jellyfin in my cluster using Helm via GitOps" },
    {
      type: "p",
      text: "Happy connected to my workspace, generated the Helm chart configuration, created the pull request to my GitOps repository, and handled the deployment—all while I was walking to the grocery store. By the time I got home, Jellyfin was running. No laptop required, no SSH pain, just a quick conversation from my phone.",
    },
    {
      type: "p",
      text: "This is the real power of Happy: it transforms those “I’ll handle this later” tasks into “I’ll handle this now” moments.",
    },
    { type: "h3", text: "Getting started" },
    {
      type: "p",
      text: "If you want to try Happy with the public server, installation is straightforward. First, ensure you have the latest LTS version of Node.js installed, then run:",
    },
    { type: "code", text: "npm install -g happy-coder && happy" },
    {
      type: "p",
      text: "This will install the Happy CLI and launch the setup wizard, which will guide you through connecting to the public Happy server or configuring your own.",
    },
    { type: "h3", text: "Project architecture" },
    {
      type: "p",
      text: "Happy is modular by design, consisting of three main components:",
    },
    {
      type: "list",
      ordered: false,
      items: [
        "happy — The mobile and web client (built with React Native)",
        "happy-cli — CLI tool that bridges your local Claude Code installation to mobile devices",
        "happy-server — Backend server that handles authentication, session management, and device synchronization",
      ],
    },
    { type: "h2", text: "Why I self-hosted" },
    {
      type: "note",
      kind: "note",
      text: "Not everyone needs to self-host! If the public Happy server works well for you, there’s no need to run your own infrastructure. Self-hosting is only necessary if you encounter reliability issues or want full control over your setup.",
    },
    {
      type: "p",
      text: "I started using the public Happy server a while ago. However, over time, the API endpoint started timing out frequently, and eventually, it stopped working altogether. Since I rely on Claude Code for my daily work, I needed a reliable solution. The answer was clear: self-host the Happy server.",
    },
    { type: "h3", text: "Prerequisites" },
    {
      type: "p",
      text: "To self-host Happy like I do, you’ll need a Kubernetes cluster with the following components:",
    },
    {
      type: "table",
      headers: ["Component", "Purpose", "Recommended"],
      rows: [
        ["Kubernetes cluster", "Container orchestration", "Any K8s, v1.27+"],
        ["Tailscale Operator", "Secure network access", "Tailscale Kubernetes Operator"],
        ["Persistent Storage", "Database & files", "Longhorn, Ceph, Rook, or cloud"],
        ["PostgreSQL", "Happy server database", "CloudNativePG operator"],
        ["Secrets Management", "API keys, credentials", "OpenBao, Vault, or K8s Secrets"],
        ["Object Storage", "File uploads", "Backblaze B2, MinIO, or S3"],
      ],
    },
    {
      type: "p",
      text: "My cluster runs on Talos Linux, a purpose-built OS for Kubernetes that simplifies cluster management and provides enhanced security through its immutable infrastructure approach. If you’re just getting started with Kubernetes, consider lighter alternatives like k3s or microk8s for testing before deploying to production.",
    },
    { type: "h2", text: "Why not Claude Code via SSH?" },
    {
      type: "p",
      text: "In the past, I used Claude Code directly in a terminal by SSH-ing into my container. This worked, but it was inconvenient for several reasons:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "TUI flickering: Claude Code’s terminal UI flickers and behaves erratically over SSH",
        "Key combination problems: mobile SSH clients struggle with Ctrl+A, Ctrl+E, Shift+Tab",
        "No text correction or autocomplete: every character must be typed perfectly",
        "Copy/paste is painful: multi-line prompts into a mobile SSH session are clunky",
        "Readability: terminal text renders too small on mobile screens",
      ],
    },
    {
      type: "p",
      text: "Happy solves these issues by providing a proper client-server architecture that works great on mobile devices. The mobile app features a dark theme, audio mode, custom server URLs, a better permissions UI, and the ability to create new sessions remotely. Text input on mobile is finally a first-class citizen.",
    },
    { type: "h2", text: "The Happy server stack" },
    {
      type: "p",
      text: "My self-hosted Happy server runs on Kubernetes as a coordinated set of services.",
    },
    {
      type: "table",
      headers: ["Component", "Technology", "Purpose"],
      rows: [
        ["Happy Server", "Node.js/Express", "Main API server on port 3000"],
        ["PostgreSQL", "CloudNativePG on Longhorn", "Persistent data storage"],
        ["Redis", "Redis 7 Alpine", "Caching and session management"],
        ["Object Storage", "Backblaze B2 (S3)", "File uploads and attachments"],
      ],
    },
    {
      type: "list",
      ordered: false,
      items: [
        "Pod Disruption Budget — minimum availability during maintenance",
        "Resource limits — 128Mi/100m requests, 512Mi limits",
        "Health probes — liveness and readiness for automatic recovery",
        "Automatic secret refresh — ExternalSecrets updates on change",
        "Database migration — init container runs npx prisma migrate deploy before startup",
      ],
    },
    { type: "h3", text: "How it works" },
    {
      type: "list",
      ordered: true,
      items: [
        "Client connection: your Happy app connects through Tailscale, creating a secure peer-to-peer tunnel to your cluster. All traffic is encrypted at the network layer via Tailscale’s WireGuard protocol.",
        "Ingress routing: traffic routes through Traefik to the Happy Server service. (For the Tailscale + Traefik + private CA setup, see the companion essay in the library.)",
        "Server processing: Happy Server handles authentication, session management, and workspace creation. It fetches sensitive credentials from OpenBao at runtime.",
        "Session management: a single persistent workspace. The happy-daemon waits for new sessions; when one is created, claude (wrapped) runs and shares data with Happy’s server.",
        "LLM integration: the workspace connects directly to the configured LLM provider (MiniMax, GLM, or Anthropic). This connection is independent of the Happy server and happens from the workspace pod.",
      ],
    },
    { type: "h3", text: "Network architecture" },
    {
      type: "p",
      text: "Both Traefik and Tailscale run inside the cluster. Tailscale uses hostNetwork: true to expose itself directly on the host network, while Traefik handles ingress routing internally. This keeps everything private within my tailnet—no open ports on the public internet.",
    },
    { type: "h2", text: "Patching the Android app" },
    {
      type: "p",
      text: "I use Happy on my Android phone with my private Kubernetes cluster. I always want HTTPS enabled—even though Tailscale’s WireGuard tunnel encrypts traffic at the network layer, relying solely on that would be a mistake. If Tailscale is disabled or I accidentally connect over public Wi-Fi without the VPN, plain HTTP would leak sensitive data. Defense in depth matters.",
    },
    { type: "h3", text: "Why my own CA?" },
    {
      type: "p",
      text: "I run a private certificate authority (via OpenBao). This gives me proper TLS with certificates trusted across all my devices, without exposing my internal hostnames to public Certificate Transparency logs (as Let’s Encrypt and other public CAs require).",
    },
    {
      type: "p",
      text: "Android apps by default only trust certificates from the system trust store. My private CA certificates live in the Android User Trust Store, which the Happy app didn’t recognize. I contributed PR #278, which teaches the app to trust authorities from the User Trust Store. On the server side, Traefik handles SSL termination with certificates issued by that private CA.",
    },
    { type: "h2", text: "My LLM setup" },
    {
      type: "p",
      text: "I’ve configured Happy to use different LLM providers depending on the task. This multi-provider approach lets me optimize for cost, speed, or capability.",
    },
    {
      type: "table",
      headers: ["Model", "Best for"],
      rows: [
        ["MiniMax M2.1", "Quick one-offs, simple refactors, routine tasks"],
        ["GLM 4.7", "Frontend, React/Vue, general coding — his daily driver"],
        ["Gemini 3.0", "Specialized tasks, UI debugging via Antigravity"],
        ["Claude Opus 4.5", "Complex planning, multi-step refactors, architecture"],
      ],
    },
    {
      type: "p",
      text: "MiniMax is the workhorse for fast, cheap tasks, and a little stubborn — useful on long jobs where you don’t want the model to drift. GLM 4.7 is the daily driver, especially for UI; at times he prefers it to Opus, and he’d rather fund Z.AI’s open models than pay the Anthropic tax. Opus still comes out for heavy lifting. That said, after Anthropic’s January 2026 crackdown on third-party tools, he is actively detaching from that walled garden.",
    },
    {
      type: "p",
      text: "You can’t switch providers from the Happy mobile app. The provider is locked when the happy-daemon starts. The workaround is a handful of shell scripts that export ANTHROPIC_* environment variables (pointing at MiniMax or Z.AI) before happy daemon start. The community is working on one-touch profile switching.",
    },
    {
      type: "code",
      text: "source ~/setup-minimax.sh   # or setup-zai.sh\nhappy daemon start",
    },
    { type: "h2", text: "The workspace setup" },
    {
      type: "p",
      text: "All sessions run in a shared dev-workspace container, entirely as a non-root user for Kubernetes Pod Security Standards (restricted) compliance. Each user can get their own workspace pod, PVC, SSH keys, and Nix store. He currently uses one workspace for convenience.",
    },
    {
      type: "table",
      headers: ["Aspect", "Implementation"],
      rows: [
        ["Base image", "Alpine Linux"],
        ["User model", "Non-root, UID 1000"],
        ["SSH", "Dropbear on port 2222"],
        ["Multi-arch", "AMD64 and ARM64"],
        ["Persistence", "Template-based PVC for home + nix-store"],
      ],
    },
    { type: "h3", text: "NetworkPolicy" },
    {
      type: "p",
      text: "The workspace employs strict network isolation. Egress: public internet (LLM APIs, packages), DNS, the Happy server, and the Tailscale namespace — and nothing else on the private ranges. Ingress: SSH from Tailscale only, on port 2222. Even if a workspace pod is compromised, it cannot access other services in the cluster or private networks.",
    },
    { type: "h3", text: "Why I run agents in “YOLO mode”" },
    {
      type: "p",
      text: "You might wonder why I bother with strict network isolation if I’m going to let AI agents run with minimal oversight. Here’s my reasoning: I run my agents in what some might call “bypass permissions” mode—or as I like to think of it, “YOLO mode.”",
    },
    {
      type: "p",
      text: "The magic of AI agents and LLMs is their ability to work autonomously. If I have to babysit them—approving every file read, every command execution, every tool call—then I might as well do the work myself. The whole point is that they can operate independently, making progress while I’m doing something else.",
    },
    {
      type: "p",
      text: "That said, I’m not reckless. The worst that can happen: a personal access token leaks (I rotate it), repos get exposed (most are public), the container goes rogue (I prune it). What I’m protecting against: a rogue agent on my home network, unrestricted access to production, compromised credentials affecting systems outside my control. All unacceptable.",
    },
    {
      type: "p",
      text: "By running agents in an isolated workspace with no local network access, I get both: autonomy without constant approval, and a blast radius limited to things I can restore. The convenience of autonomous agents far outweighs the minimal risk of a compromised workspace container, especially when that container can’t touch anything critical.",
    },
    { type: "h3", text: "MCP tools" },
    {
      type: "p",
      text: "I use a GitHub Personal Access Token limited to my authorized repositories, and several Model Context Protocol (MCP) servers via ~/.config/claude/mcp.json: GitHub Actions, ArgoCD, Woodpecker CI, and a self-hosted SearXNG for search (self-hosted so I can get JSON output, which public instances disable).",
    },
    {
      type: "note",
      kind: "warning",
      text: "A single workspace is convenient. For stronger isolation, run one workspace per repository with its own GitHub PAT — a compromised token then only affects one repo.",
    },
    { type: "h2", text: "Was it worth it?" },
    {
      type: "p",
      text: "Self-hosting Happy has given me a reliable, flexible way to use Claude Code across all my devices. The combination of Happy’s mobile-first design, Claude Code’s AI capabilities, and a well-architected Kubernetes backend creates a development experience that’s both powerful and liberating.",
    },
    {
      type: "p",
      text: "The ability to work from anywhere — on my phone during my commute, on my tablet from the couch, or on my laptop at my desk — has transformed how I think about development. I’m no longer tied to a traditional workstation, and I can reclaim those small pockets of time throughout the day that would otherwise be lost.",
    },
    {
      type: "p",
      text: "Was it worth the effort? Absolutely. The setup needed a bit of time, but the payoff in terms of productivity and flexibility has been enormous. And now, thanks to this setup, I can further improve it from my Happy app.",
    },
    { type: "h3", text: "If you want to try" },
    {
      type: "list",
      ordered: true,
      items: [
        "Try the public server first: npm install -g happy-coder && happy. It costs nothing.",
        "Explore happy.engineering, the GitHub repos, and the community Discord.",
        "Consider self-hosting only if you find yourself relying on it daily. Start with k3s or microk8s.",
        "Start simple. One LLM provider is enough. Expand once you know your patterns.",
      ],
    },
  ],
  terms: happyTerms,
};

/* -------------------------------------------------------------------------- */
/*  Companion: Tailscale + Traefik + Private CA                               */
/* -------------------------------------------------------------------------- */

const tsTerms: Term[] = [
  t({
    id: "ts-tailscale",
    term: "Tailscale",
    aliases: ["tailnet"],
    gloss: "A mesh VPN with nametags. Direct handshake if it can; mom’s house (DERP) if it can’t.",
    explanation:
      "Tailscale is a zero-config mesh VPN on WireGuard. Devices get identity and a stable address. It tries a direct path, then falls back to DERP relays. On Kubernetes, that fallback is the default more often than the brochure admits.",
    analogy:
      "Walkie-talkies that first try the park, then call a dispatcher. The dispatcher is not a friend. They just have a public address.",
    context:
      "The problem of this essay: Tailscale-on-Kubernetes cannot promise a direct path. The solution is to stop asking every pod to be a peer, and put Traefik on a machine that already has a reachable Tailscale IP.",
    excerpt: "direct connections aren’t guaranteed",
    related: ["ts-derp", "ts-nat", "ts-traefik"],
  }),
  t({
    id: "ts-traefik",
    term: "Traefik",
    aliases: [],
    gloss: "A doorman who terminates TLS and walks each hostname to the right kitchen.",
    explanation:
      "Traefik is a cloud-native reverse proxy. Here it runs as a DaemonSet with hostNetwork: true, so it sits on the node’s street door — the node’s Tailscale IP — and routes happy.example.com to the Happy server, ArgoCD, and the rest.",
    analogy:
      "One phone number for the whole building. The host checks the name you asked for and walks you there. The kitchens never get their own street address.",
    context:
      "The key insight of the post, in one line: route all traffic through Traefik pods that already have publicly reachable Tailscale IPs. Stop trying to make every proxy pod a Tailscale peer.",
    excerpt:
      "route all traffic through Traefik pods running on machines with publicly reachable Tailscale IPs",
    related: ["ts-hostnetwork", "ts-mtls", "ts-tailscale"],
    diagram: {
      title: "One door, many rooms",
      caption: "The client hits Traefik on the Tailscale IP. Traefik picks Happy or ArgoCD.",
      lanes: [
        {
          nodes: [
            { id: "app", label: "Happy app", kind: "actor" },
            { id: "tr", label: "Traefik\n:3443", kind: "box" },
            { id: "svc", label: "Happy /\nArgoCD", kind: "box" },
          ],
          edges: [
            { from: "app", to: "tr", label: "direct UDP" },
            { from: "tr", to: "svc", label: "by host" },
          ],
        },
      ],
    },
  }),
  t({
    id: "ts-ca",
    term: "private CA",
    aliases: ["private certificate authority", "OpenBao"],
    gloss: "A household notary. Stamps certificates without printing the shop’s name in the newspaper.",
    explanation:
      "OpenBao (a Vault fork) runs a PKI engine: a private certificate authority. Traefik presents those certs. Public CAs would publish the hostnames in Certificate Transparency logs. A private CA keeps happy.internal off the public record, and later can stamp client certs for mTLS.",
    analogy:
      "You hired a notary who only works for your family. The teller in your house already knows that stamp. The city newspaper never sees the address.",
    context:
      "He is not using mTLS in the new cluster yet — only server certificates. Client certs are the long-term plan for phones that don’t want Tailscale draining the battery.",
    excerpt: "a private CA powered by OpenBao",
    related: ["ts-mtls", "ts-traefik"],
  }),
  t({
    id: "ts-nat",
    term: "NAT",
    aliases: ["node’s NAT", "node's NAT"],
    gloss: "A receptionist who rewrites your return address so the outside world can write back.",
    explanation:
      "Network Address Translation sits between a private network and the public internet. Pods have private addresses. When they send a packet out, NAT swaps in a public one and remembers the mapping. From outside, there is no door to the pod — only to the building.",
    analogy:
      "You live in 4B. The street only knows the building. The front desk stamps outgoing mail and walks replies back upstairs.",
    context:
      "Each Tailscale proxy pod gets a ClusterIP; outbound traffic goes through the node’s NAT. That is item one of why Kubernetes kills direct Tailscale paths.",
    excerpt:
      "Each proxy pod gets a ClusterIP, and outbound traffic goes through the node’s NAT",
    related: ["ts-hardnat", "ts-clusterip", "ts-doublenat"],
    diagram: {
      title: "How NAT rewrites an address",
      caption: "Inside, the pod is 10.0.0.7. Outside, the world only sees the node.",
      lanes: [
        {
          nodes: [
            { id: "pod", label: "Pod\n10.0.0.7", kind: "box" },
            { id: "nat", label: "Node NAT", kind: "box" },
            { id: "net", label: "Internet", kind: "cloud" },
          ],
          edges: [
            { from: "pod", to: "nat", label: "private" },
            { from: "nat", to: "net", label: "public" },
          ],
        },
      ],
    },
  }),
  t({
    id: "ts-clusterip",
    term: "ClusterIP",
    aliases: [],
    gloss: "A phone extension that only rings inside the office.",
    explanation:
      "A ClusterIP is a virtual address Kubernetes assigns to a Service. Reachable from other pods. Invisible from the sidewalk. The Tailscale operator’s proxies live on ClusterIPs, which is why a laptop on the internet cannot dial them.",
    analogy:
      "Shipping is x4410. Anyone at a desk can dial it. Someone on the sidewalk cannot.",
    context:
      "Paired with NAT in the first numbered reason direct connections fail. ClusterIP is not a hole. It is another private address.",
    excerpt: "Each proxy pod gets a ClusterIP",
    related: ["ts-nat", "ts-hostnetwork"],
  }),
  t({
    id: "ts-hardnat",
    term: "hard NAT",
    aliases: ["symmetric NAT", "Symmetric/hard NAT"],
    gloss: "A bouncer who hands you a new fake name every time you walk out the door.",
    explanation:
      "Cone NAT reuses one public mapping, so hole-punching works. Symmetric (hard) NAT mints a new port per destination. The calling card you gave peer A is blank paper to peer B. Kubernetes node NAT, and especially AWS NAT gateways, often behave this way.",
    analogy:
      "Monday you are guest 17 to Grandma. Tuesday you are guest 84 to a friend. Grandma’s reply works. The friend’s attempt to reuse 17 bounces.",
    context:
      "Item two. This is the behavior Tailscale detects, then gives up on a direct path.",
    excerpt:
      "the NAT device uses a different port for every outbound connection",
    related: ["ts-nat", "ts-derp"],
    diagram: {
      title: "Cone NAT vs hard NAT",
      caption: "Cone NAT reuses one hole. Hard NAT mints a new port per destination.",
      lanes: [
        {
          label: "Cone (reusable)",
          nodes: [
            { id: "y1", label: "You", kind: "actor" },
            { id: "m1", label: ":4242\nalways", kind: "box" },
            { id: "p1", label: "A or B", kind: "cloud" },
          ],
          edges: [
            { from: "y1", to: "m1" },
            { from: "m1", to: "p1" },
          ],
        },
        {
          label: "Hard / symmetric",
          nodes: [
            { id: "y2", label: "You", kind: "actor" },
            { id: "a", label: ":1111\n→ A", kind: "box" },
            { id: "b", label: ":2222\n→ B", kind: "box" },
          ],
          edges: [
            { from: "y2", to: "a" },
            { from: "y2", to: "b" },
          ],
        },
      ],
    },
  }),
  t({
    id: "ts-derp",
    term: "DERP",
    aliases: ["DERP servers", "DERP relays", "Designated Encrypted Relay for Packets"],
    gloss: "Mom’s house: when two friends cannot find each other, they both call mom and she relays the letter.",
    explanation:
      "DERP is Tailscale’s relay network — Designated Encrypted Relay for Packets. Both sides open an outbound connection to a DERP server; it shuffles ciphertext. You keep a path. You lose the low latency and the 10 Gbps you bought the homelab for.",
    analogy:
      "You cannot visit. You both call mom. She does not open the mail. She walks it across the hall. Slower than a courtyard. The letter arrives.",
    context:
      "He has a 10 Gbps link and wants it for Transmission downloads. DERP would waste it. The 30 MB/s over 5G is his evidence that, with Traefik on hostNetwork, he is not on DERP.",
    excerpt:
      "When Tailscale detects hard NAT, it falls back to relay connections through DERP servers",
    related: ["ts-hardnat", "ts-tailscale", "ts-hostnetwork"],
    diagram: {
      title: "Direct fails, DERP carries the bag",
      caption: "Pods cannot punch through hard NAT. Both of them call a DERP relay instead.",
      lanes: [
        {
          label: "Direct (fails)",
          nodes: [
            { id: "a1", label: "Pod A", kind: "box" },
            { id: "x", label: "hard NAT", kind: "note" },
            { id: "b1", label: "Pod B", kind: "box" },
          ],
          edges: [
            { from: "a1", to: "x", dashed: true },
            { from: "x", to: "b1", dashed: true, label: "no hole" },
          ],
        },
        {
          label: "DERP (works, slower)",
          nodes: [
            { id: "a2", label: "Pod A", kind: "box" },
            { id: "d", label: "DERP\nmom's house", kind: "cloud" },
            { id: "b2", label: "Pod B", kind: "box" },
          ],
          edges: [
            { from: "a2", to: "d" },
            { from: "d", to: "b2" },
          ],
        },
      ],
    },
  }),
  t({
    id: "ts-doublenat",
    term: "double NAT",
    aliases: ["double NAT situation"],
    gloss: "Two front desks, both rewriting the envelope. Nobody outside can find the room.",
    explanation:
      "His house has one public IPv4. The MikroTik already NATs the street onto the LAN. Kubernetes then NATs again from pod to node. Two receptionists, both forgetful. Direct Tailscale between pods becomes a research problem.",
    analogy:
      "A hotel inside a gated office park. The park mailroom rewrites you. Then the hotel desk rewrites you again.",
    context:
      "This is why hostNetwork on specific nodes is ‘crucial’ — it deletes the second desk for the pods that matter (Traefik, Tailscale).",
    excerpt: "This creates a double NAT situation in my setup",
    related: ["ts-nat", "ts-hostnetwork"],
    diagram: {
      title: "Two desks",
      caption: "Pod → Kubernetes NAT → MikroTik NAT → street. hostNetwork skips the first desk.",
      lanes: [
        {
          nodes: [
            { id: "pod", label: "pod", kind: "box" },
            { id: "k", label: "K8s NAT", kind: "box" },
            { id: "r", label: "router NAT", kind: "box" },
            { id: "n", label: "street", kind: "cloud" },
          ],
          edges: [
            { from: "pod", to: "k" },
            { from: "k", to: "r" },
            { from: "r", to: "n" },
          ],
        },
      ],
    },
  }),
  t({
    id: "ts-hostnetwork",
    term: "hostNetwork",
    aliases: ["hostNetwork: true"],
    gloss: "The pod sits at reception and uses the building’s street door.",
    explanation:
      "hostNetwork: true puts a pod on the node’s network namespace. It can bind the node’s ports and inherit the node’s Tailscale IP. Traefik on hostNetwork is reachable without going through ClusterIP or node NAT. That is the whole trick.",
    analogy:
      "Most guests get a room number. This guest answers the street buzzer.",
    context:
      "Used twice: so Traefik has a reachable Tailscale IP, and so Tailscale itself can punch out. Combined with MikroTik UDP port mapping (41621, 41622, 41623), clients connect directly.",
    excerpt:
      "running Traefik with hostNetwork: true on specific nodes becomes crucial — it bypasses the Kubernetes NAT layer",
    related: ["ts-traefik", "ts-doublenat", "ts-derp"],
  }),
  t({
    id: "ts-mtls",
    term: "mTLS",
    aliases: ["mutual TLS", "client certificates"],
    gloss: "Not only does the shop show ID — you have to show ID too.",
    explanation:
      "TLS usually proves the server is itself. Mutual TLS also requires the client to present a certificate signed by a CA the server trusts. Here, that is the planned phone path: no Tailscale process draining the battery, just a client cert at Traefik on :3443.",
    analogy:
      "The building asks for your badge, not just a name at the desk. No badge, no elevator. You do not need to keep a walkie-talkie running in your pocket all day.",
    context:
      "Not on in the new cluster yet. The reason it matters: Tailscale on phones burns battery. Immich’s mTLS is broken, so photos stay Tailscale-only. Everything else can, eventually, be a cert.",
    excerpt: "mTLS: Client presents a valid certificate signed by my private CA",
    related: ["ts-ca", "ts-tailscale"],
  }),
  t({
    id: "ts-mesh",
    term: "mesh VPN",
    aliases: ["mesh networking", "mesh"],
    gloss: "A dinner party where everyone is supposed to talk directly to everyone else.",
    explanation:
      "In a mesh, every node is a peer. No required hub. Fast when the handshakes land. Exhausting when NAT keeps moving the apartment. A hub (Traefik, a TURN farm, Cloudflare) gives up the potluck and hires a waiter.",
    analogy:
      "A potluck versus a restaurant. The waiter is a bottleneck and an authority. The potluck falls apart if nobody can find the apartment.",
    context:
      "Tailscale wants the potluck. Kubernetes NAT keeps moving the apartment. This post hires a waiter (Traefik) and only lets a few machines be on the guest list.",
    excerpt: "a mesh VPN built on WireGuard",
    related: ["ts-tailscale", "ts-derp"],
  }),
  t({
    id: "ts-wireguard",
    term: "WireGuard",
    aliases: [],
    gloss: "The tube. Short, fast, boring on purpose. Tailscale is the nametag service on top.",
    explanation:
      "WireGuard is the VPN protocol underneath Tailscale. Each Traefik/Tailscale pod needs its own UDP port for that tunnel — he derives it from the node’s last octet (41600 + 21 = 41621) and dst-nats those ports on the MikroTik.",
    analogy:
      "The cardboard tube between ships. The port number is which porthole the tube is lashed to.",
    context:
      "The UDP port table is how one public IPv4 still gives every node a distinct hole for WireGuard, so Tailscale can be direct instead of DERP’d.",
    excerpt:
      "Each Traefik/Tailscale pod needs a unique UDP port for the WireGuard tunnel.",
    related: ["ts-tailscale", "ts-hostnetwork"],
  }),
];

const tailscaleArticle: Article = {
  id: "tailscale-traefik",
  title: "Tailscale + Traefik + Private CA",
  dek: "A mesh wants a handshake. A cluster gives every pod a room number. So he puts the doorman on the street door.",
  source: "Denys Vitali · Jan 12, 2026",
  field: "software",
  minutes: 10,
  blocks: [
    {
      type: "p",
      text: "I run a hybrid networking setup that combines Tailscale (a mesh VPN), Traefik (a cloud-native reverse proxy), and a private CA powered by OpenBao (an open-source secret management and PKI solution forked from HashiCorp Vault).",
    },
    {
      type: "p",
      text: "In this post, I’ll explain why I chose this architecture and how the pieces fit together. It’s the companion to the Happy essay — the part where the tunnel, the doorman, and the notary have to agree.",
    },
    { type: "h2", text: "The components" },
    {
      type: "p",
      text: "Tailscale is a zero-config mesh VPN built on WireGuard. It creates secure, peer-to-peer connections between devices. It handles NAT traversal, relay fallback through DERP servers, and authentication through your identity provider.",
    },
    {
      type: "p",
      text: "Traefik is a modern HTTP/TCP reverse proxy and load balancer that integrates with Kubernetes to automatically discover services and route traffic. It supports TLS termination, mTLS, middleware for authentication, and can run as a DaemonSet with hostNetwork: true.",
    },
    {
      type: "p",
      text: "OpenBao is an open-source secret management solution — a community fork of HashiCorp Vault — that provides secure secret storage and a PKI engine for issuing TLS certificates from a private certificate authority.",
    },
    { type: "h2", text: "The problem with pure Tailscale" },
    {
      type: "p",
      text: "Tailscale is fantastic for secure mesh networking. However, there’s a well-known limitation when running Tailscale on Kubernetes: direct connections aren’t guaranteed.",
    },
    {
      type: "p",
      text: "The Tailscale Kubernetes Operator creates proxies in their own network namespace. By design, the operator cannot easily use host networking for the pods it creates. This means:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Proxies run behind NAT: each proxy pod gets a ClusterIP, and outbound traffic goes through the node’s NAT",
        "Symmetric/hard NAT behavior: Kubernetes networking often exhibits “hard NAT” characteristics where the NAT device uses a different port for every outbound connection",
        "DERP fallback: when Tailscale detects hard NAT, it falls back to relay connections through DERP servers (Designated Encrypted Relay for Packets)",
      ],
    },
    {
      type: "p",
      text: "As Tailscale’s documentation states, they “can’t guarantee direct connections on Kubernetes” — this is a fundamental limitation of the Kubernetes networking model. Cloud environments exacerbate this: AWS NAT Gateways are particularly known for hard NAT behavior, forcing all traffic through DERP relays.",
    },
    {
      type: "p",
      text: "For my setup, I wanted direct peer-to-peer connectivity. DERP relays add latency and become a bottleneck. I have a 10Gbps connection and I want to use all of it for services like my NGINX file server. I haven’t yet run iperf3, but I was able to download files at 30 MB/s (240 Mbps) while on 5G — which means the connection wasn’t going through DERP servers, as those would be significantly slower over a typical mobile connection.",
    },
    {
      type: "p",
      text: "My homelab has only one public IPv4 address, a common constraint for residential connections. I can’t assign a unique public IP to each node. Instead I use port mapping (NAT) on my router. This creates a double NAT situation:",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Router-level NAT: my MikroTik maps external UDP ports to internal node IPs",
        "Kubernetes-level NAT: the CNI creates pod network namespaces with ClusterIPs",
      ],
    },
    {
      type: "p",
      text: "The double NAT makes direct Tailscale connections even more difficult, which is why running Traefik with hostNetwork: true on specific nodes becomes crucial — it bypasses the Kubernetes NAT layer entirely for those pods.",
    },
    { type: "h2", text: "The solution: Traefik as the ingress layer" },
    {
      type: "p",
      text: "The key insight is simple: route all traffic through Traefik pods running on machines with publicly reachable Tailscale IPs.",
    },
    {
      type: "list",
      ordered: true,
      items: [
        "Tailscale provides the public IP: Traefik pods run with hostNetwork: true on machines that have Tailscale IPs directly accessible.",
        "Direct connectivity: instead of DERP, clients connect directly to the Traefik pod’s Tailscale IP on port 3443.",
        "Traefik handles TLS: connections are TLS-terminated at Traefik, which can optionally require client certificates (mTLS).",
        "Load balancing: weighted-round-robin across backend services (Happy Server, ArgoCD, and the rest).",
      ],
    },
    { type: "h2", text: "Why both Tailscale and a private CA?" },
    {
      type: "note",
      kind: "note",
      text: "I don’t yet use mTLS in my new cluster. I already have a private CA on OpenBao, but I’m only using it for server authentication. Client certificate authentication is the long-term plan. What follows is the target state.",
    },
    {
      type: "table",
      headers: ["Method", "Best for", "Battery"],
      rows: [
        ["Tailscale", "Laptops, desktops, servers", "Minimal (always-on anyway)"],
        ["mTLS", "Mobile devices", "None (no background service)"],
      ],
    },
    {
      type: "p",
      text: "Tailscale is excellent for permanent devices, but it keeps the WireGuard tunnel active in the background and can drain a phone. For Android, he wanted a cleaner path: both Tailscale and mTLS terminate at Traefik on :3443. Tailscale proves you with a tailnet identity. mTLS proves you with a client certificate signed by the private CA.",
    },
    {
      type: "p",
      text: "Which path a service takes is just DNS. A name that resolves to a public IP is mTLS-from-the-internet (Prometheus, Grafana). A name that resolves to a Tailscale IP is tailnet-only (Immich, internal tools). A service cannot be both. That lets him migrate one hostname at a time.",
    },
    {
      type: "note",
      kind: "warning",
      text: "Before relying on mTLS for any application, verify it actually works. Immich’s mTLS is experimental and broken — video, uploads, downloads, crashes. Until that is fixed, Immich stays Tailscale-only. The hybrid is the point: enforce security at the network layer when the application layer is lying.",
    },
    { type: "h2", text: "UDP ports for Tailscale" },
    {
      type: "p",
      text: "Each Traefik/Tailscale pod needs a unique UDP port for the WireGuard tunnel. He derives it from the node’s last octet:",
    },
    {
      type: "code",
      text: "OCTET=$(echo $K8S_NODE_IP | cut -d. -f4)\nPORT=$((41600 + OCTET))    # 192.168.10.21 → 41621",
    },
    {
      type: "table",
      headers: ["Node IP", "Last octet", "UDP port"],
      rows: [
        ["192.168.10.21", "21", "41621"],
        ["192.168.10.22", "22", "41622"],
        ["192.168.10.23", "23", "41623"],
      ],
    },
    {
      type: "p",
      text: "One public IPv4. The MikroTik dst-nats those three UDP ports onto the three nodes. External WireGuard lands on the correct machine; Tailscale can be direct.",
    },
    {
      type: "code",
      text: "/ip/firewall/nat add chain=dstnat dst-port=41621 protocol=udp \\\n  action=dst-nat to-addresses=192.168.10.21 to-ports=41621",
    },
    { type: "h2", text: "Where this is going" },
    {
      type: "p",
      text: "Enable mTLS with the existing OpenBao CA for client authentication. Keep Tailscale for the machines that live on it anyway. Let phones put the walkie-talkie down and show a badge instead. Same Traefik door. Two kinds of ID.",
    },
  ],
  terms: tsTerms,
};

export const SEED_ARTICLES: Article[] = [happyArticle, tailscaleArticle];

export function findArticle(id: string, extras: Article[] = []): Article | undefined {
  return extras.concat(SEED_ARTICLES).find((a) => a.id === id) ?? SEED_ARTICLES[0];
}
