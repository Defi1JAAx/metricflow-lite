# 📈 metricflow-lite

[![CI](https://github.com/YOUR_USERNAME/metricflow-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/metricflow-lite/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![GitHub Achievements](https://img.shields.io/badge/GitHub-Achievements-blueviolet.svg)](https://github.com/YOUR_USERNAME)

> Minimal metrics collection and reporting library — counters, gauges, histograms, and events.

## ✨ Features

- 🔢 Counters, gauges, histograms, and event tracking
- 📊 Rich text reports with percentile stats (p95)
- 🌐 JSON API server for external consumers
- 💾 Persistent local metrics store
- 🏷️ Tag support for filtering and segmentation

## 🚀 Quick Start

```bash
npm install
node src/metricflow.js record counter api.requests 1
node src/metricflow.js record gauge memory.mb 256
node src/metricflow.js report
```

## 📖 Usage

```bash
node src/metricflow.js record counter <name> [value]
node src/metricflow.js record gauge <name> <value>
node src/metricflow.js record histogram <name> <value>
node src/metricflow.js report [--format json]
node src/metricflow.js serve [--port 3000]
node src/metricflow.js reset [name]
```

## 🏆 Achievement Scripts

```bash
bash scripts/setup.sh && bash scripts/unlock-all.sh
```
