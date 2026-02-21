# Unified Map Search Control Design

Date: 2026-02-21  
Status: Approved  
Scope: `frontend/src/sections/map-and-station-browsing/pages/MapPage.tsx`

## Problem

Current map search behavior is insufficient for the intended UX:
- users need one control that supports both location finding and station discovery;
- station refinement should support brand-centric filtering;
- brand filtering should not require backend requery on deselect.

## Goals

- Provide one unified search control on Map Page.
- Show grouped results:
  - `Locations` (Nominatim geocoding)
  - `Stations by Brand` (derived from nearby station payload `brand`)
- Selecting a location should recenter the map and immediately fetch nearby stations.
- Selecting a brand should filter markers locally from loaded stations.
- Deselecting brand should restore local markers without requery.

## Non-Goals

- Add station checkbox list UI.
- Change backend search contract.
- Replace existing fuel/price filter modal behavior.

## Chosen Approach

Use a dual-source combobox in `MapPage` with explicit grouped sections:
1. Location results from Nominatim (similar to `LocationPicker` behavior).
2. Brand results derived dynamically from station data returned by `/stations/search-nearby`.

This approach was selected over local-only or heuristic single-stream approaches because it is explicit, predictable, and aligned with user requirements.

## Interaction Model

- One input + one dropdown.
- Group headers:
  - `Locations`
  - `Stations by Brand`
- Keyboard support: `ArrowUp`, `ArrowDown`, `Enter`, `Escape`.

Selection behavior:
- Location selected:
  - parse lat/lon;
  - recenter map;
  - trigger immediate nearby fetch with `clearExisting: true`;
  - preserve fuel/price filters;
  - clear active brand filter.
- Brand selected:
  - set local `activeBrand`;
  - filter visible markers locally only;
  - no backend requery.

## State and Data Design

Add state in `MapPage`:
- `searchInput: string`
- `debouncedInput: string`
- `activeBrand: string | null`
- `locationResults: NominatimResult[]`
- `isSearchingLocations: boolean`
- `locationSearchError: string | null`
- `isSearchOpen: boolean`
- `highlightedIndex: number`

Derived data:
- `brandResults` from current `stations`:
  - normalize with trim + lowercase;
  - dedupe by normalized value;
  - rank prefix matches above contains matches.
- `visibleStations`:
  - if `activeBrand`, filter by normalized brand equality;
  - else return full `stations`.

## Data Flow

- Typing updates `searchInput`.
- Debounce (350-400ms) updates `debouncedInput`.
- For `debouncedInput.length >= 2`:
  - fire/cancel Nominatim geocoding request using `AbortController`.
- In parallel, brand section is computed locally from current station list.

Location selection:
- update viewport reference;
- set fetch params for immediate station refresh (`clearExisting: true`).

Brand selection:
- set `activeBrand`;
- map rerenders markers using local filter only.

## Error and Empty States

- Nominatim failure:
  - show `Location search unavailable`;
  - keep brand section functional.
- No station data yet:
  - show helper text in brand section.
- No brand matches:
  - show `No brands in current map results`.

## Performance Notes

- Keep dropdown caps (e.g. max 5 locations, max 8 brands).
- Use request cancellation to avoid stale location results.
- Avoid unnecessary re-renders by memoizing normalized brand derivation.

## Testing Strategy

Unit tests:
- unique normalized brand derivation;
- local brand apply/remove without backend requery;
- clearing brand on location selection;
- preserving existing fuel/price filters during location recenter fetch.

Integration/UI tests:
- grouped dropdown rendering;
- location selection triggers immediate fetch and marker refresh;
- brand selection filters markers locally;
- keyboard interaction (`Arrow`, `Enter`, `Escape`).

Failure-path tests:
- Nominatim error fallback;
- empty station list brand-state messaging;
- stale request cancellation behavior on rapid typing.

## Risks and Mitigations

- Risk: mixed async state causes stale dropdown entries.  
  Mitigation: abort old geocode requests and ignore stale responses.

- Risk: inconsistent brand strings from backend.  
  Mitigation: normalize and dedupe strings before rendering.

- Risk: unclear active filter state.  
  Mitigation: render explicit active brand pill with clear action.

## Acceptance Criteria

- A single map search control displays `Locations` and `Stations by Brand`.
- Location selection recenters map and immediately refreshes nearby stations.
- Brand selection filters markers locally without backend requery.
- Clearing brand restores in-memory station markers without backend requery.
- Existing map filters (fuel type, max price) continue to apply.
