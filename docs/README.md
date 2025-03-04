# Twisdom Documentation

Welcome to the Twisdom project documentation. This directory contains comprehensive documentation for the Twisdom Twitter bookmark manager application.

## Documentation Structure

- **[prd.md](./prd.md)**: Product Requirements Document - Comprehensive overview of the product
- **[architecture-decisions.md](./architecture-decisions.md)**: Architecture Decision Records
- **[active-issues.md](./active-issues.md)**: Lightweight issue tracking
- **[session-workflow.md](./session-workflow.md)**: Session start/end templates & workflow guidelines
- **[supabase-setup.md](./supabase-setup.md)**: Supabase integration documentation
- **[sessions/](./sessions/)**: Directory containing chronological development session logs

## Documentation Philosophy

The Twisdom documentation follows these key principles:

### 1. Progressive Context Building

Documentation evolves alongside the codebase, with each development session adding to the collective knowledge. This approach ensures that documentation remains current and comprehensive.

### 2. Single Source of Truth

Each piece of information has a designated location to prevent inconsistencies and duplication. Cross-references are used to connect related information across documents.

### 3. Embedded Status Updates

Documentation includes status indicators to clearly communicate the current state of features, issues, and decisions. This provides immediate context about what is stable, experimental, or planned.

### 4. Just-in-Time Documentation

Documentation is created when it provides the most value - not too early (when details are still fluid) and not too late (when context is lost). This ensures documentation accuracy and relevance.

## Automatic Context Bridging
so 
The project implements automatic context bridging to preserve knowledge between development sessions:

1. At the end of each session, a context summary is generated in the "Next Session Context" section of the session log
2. At the beginning of the next session, this context is automatically loaded
3. This eliminates manual context transfer between sessions

## Using This Documentation

### For New Team Members

1. Start with the [PRD](./prd.md) to understand the product vision and requirements
2. Review [Architecture Decisions](./architecture-decisions.md) to understand key technical choices
3. Read the most recent [Session Log](./sessions/) to understand the current state
4. Check [Active Issues](./active-issues.md) to see current challenges and opportunities
5. Review [Supabase Setup](./supabase-setup.md) to understand the backend integration

### For Active Developers

1. Begin each development session by reviewing the previous session's context
2. Follow the [Session Workflow](./session-workflow.md) guidelines
3. Update documentation alongside code changes
4. End each session with a comprehensive context summary
5. Refer to [Supabase Setup](./supabase-setup.md) when working with the backend

### For Project Managers

1. Use the [PRD](./prd.md) to track feature implementation status
2. Review [Session Logs](./sessions/) to monitor progress
3. Check [Active Issues](./active-issues.md) for current challenges
4. Use [Architecture Decisions](./architecture-decisions.md) to understand technical direction

## Contributing to Documentation

When contributing to this documentation:

1. Follow the established formats and templates
2. Update all relevant documents when making changes
3. Provide context and rationale, not just descriptions
4. Include code snippets and examples where helpful
5. Maintain cross-references between related documents
6. Keep the "Next Session Context" summaries comprehensive and clear

## Documentation Maintenance

The documentation is maintained through:

1. Regular updates during development sessions
2. Monthly documentation reviews
3. Quarterly archiving of resolved issues
4. Major updates with significant releases