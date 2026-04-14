# DeltaV Alarm Triage Assistant

DeltaV Alarm Triage Assistant is a concept web application for industrial alarm-flood response. It helps transform a large stream of raw alarms into ranked, actionable incidents by grouping related alarms, suppressing nuisance noise, surfacing likely root causes, and supporting structured shift handoff generation.

The project is inspired by real alarm-management challenges in industrial control systems and is grounded in ISA-18.2 alarm management principles.

## Live Demo

https://deltav-alarm-system.vercel.app

## Features

- Raw alarm inbox with chronological alarm view
- Triage view with ranked incident cards
- Incident detail view with cascade timeline and trend chart
- AI-assisted shift handoff draft generation
- Shared derived state across screens for consistent alarm and incident status

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Anthropic API
- Vercel

## Project Structure

```text
app/          Application routes and pages
components/   Reusable UI components
data/         Alarm scenario dataset
lib/          Triage and state logic
public/       Static assets
