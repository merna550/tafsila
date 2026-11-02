---
date: "2026-11-02"
issue: "#341"
title: "Photos are cleaned in the browser before upload"
---

Photos are resized and re-encoded to JPEG in a Web Worker before they leave the phone: the re-encode drops EXIF (GPS and camera data), so the private bucket never holds a location. The page uploads each file to its signed URL with progress, then polls the analysis every 2 seconds.

Read: [Signed URL](../glossary.md#signed-url)
