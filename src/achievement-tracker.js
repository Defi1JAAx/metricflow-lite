#!/usr/bin/env node
/**
 * achievement-tracker.js — Track GitHub achievement badge progress
 * Usage: node src/achievement-tracker.js [roadmap]
 */

const https = require('https');
const { execSync } = require('child_process');

function getUsername() {
  try {
    return execSync('gh api user -q .login 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch { return 'YOUR_USERNAME'; }
}

function getPRCount() {
  try {
    const username = getUsername();
    const result = execSync(
      `gh pr list --author @me --state merged --limit 200 --json number 2>/dev/null | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); try{console.log(JSON.parse(d).length)}catch{console.log(0)}"`,
      { encoding: 'utf8', timeout: 10000 }
    ).trim();
    return parseInt(result) || 0;
  } catch { return 0; }
}

const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW= '\x1b[33m';
const RED   = '\x1b[31m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const NC    = '\x1b[0m';

function bar(current, max, width = 20) {
  const filled = Math.min(Math.floor((current / max) * width), width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function tierLabel(count, tiers) {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (count >= tiers[i].req) return tiers[i].label;
  }
  return 'Locked 🔒';
}

function nextTier(count, tiers) {
  for (const t of tiers) {
    if (count < t.req) return t;
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const showRoadmap = args.includes('roadmap');
  const username = getUsername();
  
  console.log(`\n${BOLD}${CYAN}🏆 GitHub Achievement Tracker${NC}`);
  console.log(`${DIM}Profile: https://github.com/${username}${NC}`);
  console.log('═'.repeat(50));
  
  if (showRoadmap) {
    console.log(`\n${BOLD}📅 Achievement Roadmap — Day 1 to Month 1${NC}\n`);
    
    const roadmap = [
      { day: 'Day 1', tasks: [
        '⚡ Run quickdraw.sh → Quickdraw badge',
        '🤠 Run yolo.sh → YOLO badge',
        '📢 Run publicist.sh → Publicist badge',
        '🦈 Run pull-shark.sh 2 → Pull Shark Bronze',
      ]},
      { day: 'Day 2-3', tasks: [
        '🤝 Run pair-extraordinaire.sh with a colleague',
        '❤️  React to any issue/PR/comment with ❤️ → Heart On Your Sleeve',
        '🌌 Answer a Discussion in a popular repo',
      ]},
      { day: 'Week 1', tasks: [
        '🦈 Run pull-shark.sh 16 → Pull Shark Silver',
        '🌟 Share your repos on social media, aim for 16 stars → Starstruck Bronze',
        '🔁 Repeat scripts on your other 4 repos for stacking PRs',
      ]},
      { day: 'Week 2-3', tasks: [
        '🦈 Run pull-shark.sh 128 → Pull Shark Gold (across all repos)',
        '🌌 Get a Discussion answer accepted → Galaxy Brain',
        '💬 Stay active, comment on issues and PRs',
      ]},
      { day: 'Month 1', tasks: [
        '✅ All 8 badges should be unlocked!',
        '🌟 Keep sharing for higher Starstruck tiers (128, 512 stars)',
        '📊 Run achievement-tracker.js to verify progress',
      ]},
    ];
    
    roadmap.forEach(step => {
      console.log(`${BOLD}${YELLOW}${step.day}${NC}`);
      step.tasks.forEach(t => console.log(`  ${t}`));
      console.log('');
    });
    return;
  }
  
  console.log(`\n${BOLD}Badge Status:${NC}\n`);
  
  const mergedPRs = getPRCount();
  
  const badges = [
    {
      name: '⚡ Quickdraw',
      desc: 'Close an issue within 5 min of opening it',
      script: 'bash scripts/quickdraw.sh',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'One-time badge — run quickdraw.sh once'
    },
    {
      name: '🤠 YOLO',
      desc: 'Merge a PR without a review',
      script: 'bash scripts/yolo.sh',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'One-time badge — run yolo.sh once'
    },
    {
      name: '📢 Publicist',
      desc: 'Create a GitHub Release',
      script: 'bash scripts/publicist.sh',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'One-time badge — run publicist.sh once'
    },
    {
      name: '🦈 Pull Shark',
      desc: 'Merge pull requests',
      script: 'bash scripts/pull-shark.sh <count>',
      tiers: [
        { req: 2, label: '🥉 Bronze (2 PRs)' },
        { req: 16, label: '🥈 Silver (16 PRs)' },
        { req: 128, label: '🥇 Gold (128 PRs)' },
        { req: 1024, label: '💎 Diamond (1024 PRs)' },
      ],
      current: mergedPRs,
      tip: `You have ~${mergedPRs} merged PRs. Run pull-shark.sh to increase count.`
    },
    {
      name: '🤝 Pair Extraordinaire',
      desc: 'Merge a co-authored PR',
      script: 'bash scripts/pair-extraordinaire.sh "Name" "email"',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'Needs a partner\'s GitHub-linked email'
    },
    {
      name: '❤️  Heart On Your Sleeve',
      desc: 'React with ❤️ on GitHub',
      script: 'Manual: Add ❤️ reaction on any issue/PR',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'Go to any issue → 😊 emoji → ❤️'
    },
    {
      name: '🌌 Galaxy Brain',
      desc: 'Get a Discussion answer accepted',
      script: 'Manual: Answer Discussions on popular repos',
      tiers: [{ req: 1, label: '✅ Unlocked!' }],
      tip: 'Find unanswered questions at github.com/discussions'
    },
    {
      name: '🌟 Starstruck',
      desc: 'Get stars on your repos',
      script: 'Share repos on Reddit, Twitter/X, HN, dev.to',
      tiers: [
        { req: 16, label: '🥉 Bronze (16 stars)' },
        { req: 128, label: '🥈 Silver (128 stars)' },
        { req: 512, label: '🥇 Gold (512 stars)' },
        { req: 4096, label: '💎 Diamond (4096 stars)' },
      ],
      tip: 'Share your work publicly to earn stars'
    },
  ];
  
  badges.forEach(b => {
    console.log(`${BOLD}${b.name}${NC}`);
    console.log(`  ${DIM}${b.desc}${NC}`);
    if (b.current !== undefined) {
      const tiers = b.tiers;
      const current = tierLabel(b.current, tiers);
      const next = nextTier(b.current, tiers);
      console.log(`  Current: ${b.current} merged PRs → ${current}`);
      if (next) {
        const pct = Math.floor((b.current / next.req) * 100);
        console.log(`  Next: ${next.label} — ${b.current}/${next.req} [${bar(b.current, next.req)}] ${pct}%`);
      }
    }
    console.log(`  ${GREEN}Script: ${b.script}${NC}`);
    console.log(`  ${YELLOW}Tip: ${b.tip}${NC}`);
    console.log('');
  });
  
  console.log('─'.repeat(50));
  console.log(`${DIM}Run 'node src/achievement-tracker.js roadmap' for Day 1 → Month 1 plan${NC}`);
  console.log(`${DIM}Run 'bash scripts/unlock-all.sh' to start unlocking${NC}\n`);
}

main().catch(console.error);
