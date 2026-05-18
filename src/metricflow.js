#!/usr/bin/env node
/**
 * metricflow-lite — Minimal metrics collection and reporting library
 * Usage: node src/metricflow.js <command> [options]
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const METRICS_FILE = 'metrics.json';

function loadMetrics() {
  if (!fs.existsSync(METRICS_FILE)) return { counters: {}, gauges: {}, histograms: {}, events: [] };
  try { return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8')); } catch { return { counters: {}, gauges: {}, histograms: {}, events: [] }; }
}

function saveMetrics(m) {
  fs.writeFileSync(METRICS_FILE, JSON.stringify(m, null, 2));
}

function recordCommand(type, name, value, tags = '') {
  const m = loadMetrics();
  const ts = new Date().toISOString();
  const tagMap = tags ? Object.fromEntries(tags.split(',').map(t => t.split('='))) : {};
  
  if (type === 'counter') {
    if (!m.counters[name]) m.counters[name] = { value: 0, history: [] };
    m.counters[name].value += Number(value) || 1;
    m.counters[name].history.push({ value: Number(value) || 1, ts, tags: tagMap });
    console.log(`✅ Counter [${name}] = ${m.counters[name].value}`);
  } else if (type === 'gauge') {
    m.gauges[name] = { value: Number(value), ts, tags: tagMap };
    console.log(`✅ Gauge [${name}] = ${value}`);
  } else if (type === 'histogram') {
    if (!m.histograms[name]) m.histograms[name] = { samples: [] };
    m.histograms[name].samples.push({ value: Number(value), ts, tags: tagMap });
    console.log(`✅ Histogram [${name}] += ${value} (${m.histograms[name].samples.length} samples)`);
  } else if (type === 'event') {
    m.events.push({ name, value, ts, tags: tagMap });
    console.log(`✅ Event [${name}] recorded`);
  }
  saveMetrics(m);
}

function reportCommand(format = 'text') {
  const m = loadMetrics();
  
  if (format === 'json') {
    console.log(JSON.stringify(m, null, 2));
    return;
  }
  
  console.log('\n📈 MetricFlow Report');
  console.log('═'.repeat(50));
  
  const ckeys = Object.keys(m.counters);
  if (ckeys.length) {
    console.log('\n🔢 Counters:');
    ckeys.forEach(k => console.log(`  ${k}: ${m.counters[k].value} (${m.counters[k].history.length} increments)`));
  }
  
  const gkeys = Object.keys(m.gauges);
  if (gkeys.length) {
    console.log('\n📊 Gauges:');
    gkeys.forEach(k => console.log(`  ${k}: ${m.gauges[k].value} (updated: ${m.gauges[k].ts})`));
  }
  
  const hkeys = Object.keys(m.histograms);
  if (hkeys.length) {
    console.log('\n📉 Histograms:');
    hkeys.forEach(k => {
      const samples = m.histograms[k].samples.map(s => s.value);
      const min = Math.min(...samples).toFixed(2);
      const max = Math.max(...samples).toFixed(2);
      const avg = (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2);
      const p95 = samples.sort((a, b) => a - b)[Math.floor(samples.length * 0.95)];
      console.log(`  ${k}: count=${samples.length} min=${min} max=${max} avg=${avg} p95=${(p95||0).toFixed(2)}`);
    });
  }
  
  if (m.events.length) {
    console.log(`\n⚡ Events: ${m.events.length} recorded`);
    m.events.slice(-5).forEach(e => console.log(`  [${e.ts.slice(0,19)}] ${e.name}: ${e.value}`));
  }
  
  if (!ckeys.length && !gkeys.length && !hkeys.length && !m.events.length) {
    console.log('\n  No metrics recorded yet. Use: record counter|gauge|histogram|event <name> <value>');
  }
}

function resetCommand(name) {
  const m = loadMetrics();
  if (name) {
    delete m.counters[name]; delete m.gauges[name]; delete m.histograms[name];
    m.events = m.events.filter(e => e.name !== name);
    console.log(`✅ Reset metric: ${name}`);
  } else {
    Object.assign(m, { counters: {}, gauges: {}, histograms: {}, events: [] });
    console.log('✅ All metrics reset');
  }
  saveMetrics(m);
}

function serveCommand(port = 3000) {
  const server = http.createServer((req, res) => {
    const m = loadMetrics();
    if (req.url === '/metrics' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(m, null, 2));
    } else {
      res.writeHead(404); res.end('Not found');
    }
  });
  server.listen(port, () => {
    console.log(`\n🌐 MetricFlow API running at http://localhost:${port}/metrics`);
    console.log('Ctrl+C to stop.');
  });
}

const [,, cmd, ...args] = process.argv;
if (!cmd || cmd === 'help') {
  console.log('metricflow-lite — Metrics Collection & Reporting\n');
  console.log('Commands:');
  console.log('  record counter <name> [value]      Increment a counter');
  console.log('  record gauge <name> <value>        Set a gauge value');
  console.log('  record histogram <name> <value>    Add a histogram sample');
  console.log('  record event <name> <value>        Record an event');
  console.log('  report [--format json|text]        Show metrics report');
  console.log('  reset [name]                       Reset metrics');
  console.log('  serve [--port N]                   Serve metrics as JSON API');
  process.exit(0);
}

if (cmd === 'record') recordCommand(args[0], args[1], args[2], args[3]);
else if (cmd === 'report') { const fi = args.indexOf('--format'); reportCommand(fi !== -1 ? args[fi+1] : 'text'); }
else if (cmd === 'reset') resetCommand(args[0]);
else if (cmd === 'serve') { const pi = args.indexOf('--port'); serveCommand(pi !== -1 ? parseInt(args[pi+1]) : 3000); }
else { console.error(`Unknown command: ${cmd}`); process.exit(1); }
