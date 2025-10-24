# YoloBox Ultra

Control a YoloLiv YoloBox Ultra through the official Web Control WebSocket endpoint (default port 8887).

## Prerequisites

- Enable Web Control in your YoloBox Ultra settings and ensure the device shares the same LAN as the Companion host.
- Note the device IP address. The default Web Control port is `8887`.

## Configuration

1. Enter the YoloBox IP in `YoloBox Ultra IP address` (e.g. `192.168.8.190`).  
2. Update `WebSocket port` only if you changed it on the device.
3. Adjust `Status polling interval (ms)` if you want a faster or slower refresh rate (default: 5000 ms).

## Actions

- **Switch program source** – switch to the selected HDMI input, multiview, clip, etc.  
- **Overlay: set state** – enable, disable or toggle an overlay (lower-third, image, web, and so on).  
- **Audio: configure channel** – change volume (0‑100), on/off state and AFV for an audio channel (Program, Monitor, etc.).  
- **Go live / stop streaming** – start, stop or toggle the live stream.  
- **Change active tab on device** – switch the active UI tab on the YoloBox touchscreen.  
- **Refresh cached status** – immediately refresh scenes, overlays, mixers and live metrics.

Scene, overlay and audio channel lists refresh automatically; if you make changes on the device and do not see them yet, trigger the refresh action.

## Feedbacks

- **Program source is active** – highlights the button when the selected source is on program.  
- **Overlay is active** – lights up the button when the chosen overlay is active.  
- **Streaming live status** – reflects whether the device is currently streaming.

## Variables

The module exposes variables for key metrics: battery, bitrate, FPS, CPU, memory, temperature, device name, firmware/software versions, uptime, Wi‑Fi SSID/IP, live state and live start timestamp.

## Notes

- Preview thumbnails (image URLs) returned by the API are not downloaded; you can use them with custom automation if needed.  
- If the device does not respond, verify the IP address, confirm Web Control is enabled, and ensure no firewall is blocking port `8887`.
