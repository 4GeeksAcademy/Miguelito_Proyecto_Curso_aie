# `skills` folder

This folder contains **agent skills** (reusable capabilities) that help you work consistently across the monorepo: research, data analysis, code review, scraping, math, and more.

- **Main purpose**: standardize how AI agents assist the team across the cross-functional project milestones.
- **Recommendation**: document each skill you add (when to use it, expected inputs/outputs, examples) and keep a clear subfolder structure so skills are easy to discover.

## Current skills for HealthCore workflow

- `clinical-triage-prioritization`:
	Classifies patient urgency into operational priority levels (critica, alta, media, baja) with traceable reasons and recommended action.

- `regional-privacy-check`:
	Validates whether a clinical data action is allowed by role, region, and consent rules before execution.

> _Spanish version: [README.es.md](./README.es.md)._
