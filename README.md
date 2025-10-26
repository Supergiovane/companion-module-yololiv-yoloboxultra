# Bitfocus Companion – YoloBox Ultra Module

Companion module for controlling a YoloLiv YoloBox Ultra via the same WebSocket API that powers the official _Web Control_ interface. Automate scenes, overlays, audio and live-state workflows through Companion buttons, macros and stream decks.

## Key Features

- Connects to Web Control (`ws://<ip>:8887`) and periodically polls device status, scenes, overlays and audio mixers.
- Actions to change scenes, enable overlays, manage audio channels, switch UI tabs and start/stop streaming.
- Feedbacks that highlight the current program source, active overlays and live status.
- Companion variables exposing battery, bitrate, CPU, memory, temperature, uptime and other device metrics.

## Requirements

- Bitfocus Companion v3 or later.
- YoloBox Ultra firmware with Web Control enabled, reachable on the same network as Companion.
- Port `8887` open between Companion and the YoloBox (default Web Control port).


## Installation

### From the Companion Module Store (simpler way)

1. Open _Modules → Module Store_ (or _Modules → Manage modules_) inside Companion.
2. Search for **YoloBox Ultra** or **yololiv** and click _Install_. Companion fetches the latest compatible build directly from the Bitfocus registry.
3. Go to _Connections → Add connection_, pick `YoloBox Ultra`, choose the version shown in the dropdown, and fill in the device IP/ports.

### From this repository (local/dev builds)

Prefer a ready-made archive without rebuilding? Grab the freshest `.tgz` files under [`dist/`](dist/) (we keep the latest stable and beta drops there), then import the one you need via _Modules → Import module package_. Once Companion shows the success toast, that version is immediately available in the Add Connection dialog.

> ⚠️ The _Import offline module bundle_ button is for the official multi-module bundle Bitfocus publishes for fully offline installs. Using it with this single-module `.tgz` results in “No modules found in bundle.”

## Configuration in Companion

1. Add a new `YoloBox Ultra` instance from the _Instances_ section.
2. Enter the device IP address and, if required, adjust the port and polling interval.
3. Once connected, actions will list the current scenes, overlays and audio channels reported by the device.

See [`companion/HELP.md`](companion/HELP.md) for usage tips and detailed action/feedback descriptions.

## Known Limitations

- The module does not download preview thumbnails returned by the API; custom integrations can consume the provided URLs if needed.
- The public API does not expose the local recording state, so no dedicated feedback/action is available for that feature.

Contributions, bug reports and feature requests are welcome via issues or pull requests.
