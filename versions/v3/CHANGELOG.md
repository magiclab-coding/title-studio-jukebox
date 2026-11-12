# Title Studio 3.0

- Collapsible, pinnable navigation with independent mobile scrolling.
- Responsive layouts verified at 360 × 640 CSS pixels.
- Named collections, paginated editable tables, per-column filters and sorting.
- Independent named compositions containing explicitly selected records.
- Pointer-based card placement, duplicate/delete compositions and undo.
- Whole-system or scoped JSON backups and up to ten recoverable data snapshots.
- Collection/composition print sources, multiple-page preview and fixed physical card dimensions in either orientation.

## Recovery

The prior published application is Sites version 2, source commit e8faf2e993dc4f07d0864fe1a6b234ee167a5ff1. It remains in source and publication history for rollback.

Version 3 reads existing browser storage from v2/v1 when no v3 data exists. Legacy keys remain intact. Export a complete JSON backup to move data between devices. New compositions begin empty; adding records to a collection never automatically inserts them into a composition.

Use Settings → Versions to snapshot/restore browser data. A snapshot is created before loading a JSON backup or deleting a collection. Full-system loading replaces the system; scoped collection/composition loading adds a new independent copy. Changing paper geometry reflows compositions while preserving card dimensions. Printing a composition retains its saved positions until geometry changes or Reorganize is used.

Validation: `npm test` exercises import of 1,000 records, filtering/pagination, selection, printing, orientation, full/scoped restore including manual positions, collections, and undo. Browser QA additionally covered 306 records, pointer dragging and a 360 × 640 frame.
