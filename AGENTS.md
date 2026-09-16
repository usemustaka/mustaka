# Agent skills

## Issue tracker

Issues and specs for this repo live as GitHub issues, driven via the `gh` CLI. See `docs/agents/issue-tracker.md`.

## Triage labels

Default vocabulary for the five canonical triage roles: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

## Domain docs

Single-context: one root `CONTEXT.md` plus `docs/adr/` for architecture decisions. See `docs/agents/domain.md`.

## CodeGraph

Follow the agent instructions in `.claude/CLAUDE.md`.

## Highly strict agent behavior (not syntax)

This repo is a curated modern boilerplate/starter (Nuxt 4, Elysia, ZenStack, Better Auth on Bun). Be highly strict about **behavior**, not syntax: if you lack enough knowledge to act with confidence — an unfamiliar skill, an MCP tool, or the official documentation of any dependency — **ask the user or stop** instead of guessing. Never improvise your way through this stack.
