# Bitfocus Companion – YoloBox Ultra Module

Companion module for controlling a YoloLiv YoloBox Ultra via the same WebSocket API that powers the official *Web Control* interface. Automate scenes, overlays, audio and live-state workflows through Companion buttons, macros and stream decks.

## Key Features

- Connects to Web Control (`ws://<ip>:8887`) and periodically polls device status, scenes, overlays and audio mixers.
- Actions to change scenes, enable overlays, manage audio channels, switch UI tabs and start/stop streaming.
- Feedbacks that highlight the current program source, active overlays and live status.
- Companion variables exposing battery, bitrate, CPU, memory, temperature, uptime and other device metrics.

## Requirements

- Bitfocus Companion v3 or later.
- YoloBox Ultra firmware with Web Control enabled, reachable on the same network as Companion.
- Port `8887` open between Companion and the YoloBox (default Web Control port).
- Node.js 18.12+ or 22.8+ when building the module locally (in line with the requirements of `@companion-module/base`).

## Installation

1. Clone this repository into your Companion custom-modules directory.
2. Run `npm install` (or `yarn install` if you have Yarn enabled through Corepack) to fetch dependencies.
3. Launch Companion (either from source or the desktop build); it will pick up modules from the `custom-modules` folder automatically. When you want to test or distribute an installable archive, execute `npm run package`—this produces a `yololiv-ultra-<version>.tgz` file in the project root.

To load the packaged module into Companion without the store:

- Open *Modules → Import module package* (the first button) and pick the generated `.tgz` archive.
- Wait for the confirmation toast; the module will appear under *Connections* ready to configure.

> ⚠️ The *Import offline module bundle* button is meant for the official multi-module bundle Bitfocus publishes for fully offline installs. Using it with the single-module `.tgz` from this repo will result in “No modules found in bundle.”

## Configuration in Companion

1. Add a new `YoloBox Ultra` instance from the *Instances* section.
2. Enter the device IP address and, if required, adjust the port and polling interval.
3. Once connected, actions will list the current scenes, overlays and audio channels reported by the device.

See [`companion/HELP.md`](companion/HELP.md) for usage tips and detailed action/feedback descriptions.

## Known Limitations

- The module does not download preview thumbnails returned by the API; custom integrations can consume the provided URLs if needed.
- The public API does not expose the local recording state, so no dedicated feedback/action is available for that feature.


Contributions, bug reports and feature requests are welcome via issues or pull requests.
