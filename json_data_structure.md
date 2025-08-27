# Oxford University Term Dates JSON Structure

This document explains the structure of `terms.json`, which contains comprehensive term date information for Oxford University.

## Overview

The JSON file stores Oxford University term dates organized by academic year, with each year containing dates for all three terms (Michaelmas, Hilary, and Trinity). The data includes both standard term weeks (1-8) and extended term weeks (0-12).

## JSON Structure

The file follows a hierarchical structure:

```
{
  "terms": [
    {
      "year": "YYYY-YY",
      "michaelmas": { ... },
      "hilary": { ... },
      "trinity": { ... }
    },
    ...
  ]
}
```

### Level 1: Root Object
- **`terms`**: Array containing academic year objects

### Level 2: Academic Year Object
Each year object contains:
- **`year`**: String in format "YYYY-YY" (e.g., "2024-25")
- **`michaelmas`**: Object containing Michaelmas term weeks
- **`hilary`**: Object containing Hilary term weeks  
- **`trinity`**: Object containing Trinity term weeks

### Level 3: Term Object
Each term (michaelmas/hilary/trinity) contains:
- **`week0`** through **`week12`**: Objects representing each week of the extended term

### Level 4: Week Object
Each week contains:
- **`start`**: ISO date string (YYYY-MM-DD) for the Sunday starting the week
- **`end`**: ISO date string (YYYY-MM-DD) for the Saturday ending the week

## Week System Explained

Oxford terms use a unique week numbering system:

- **Weeks 1-8**: Standard term weeks (Full Term)
- **Week 0**: The week before Full Term begins
- **Weeks 9-12**: Extended weeks after Full Term ends

The extended weeks (0 and 9-12) are included to accommodate various academic activities that occur outside the standard 8-week term.

## Date Format

All dates are stored as ISO 8601 date strings:
- Format: `"YYYY-MM-DD"`
- Example: `"2024-10-13"`
- Each week runs from Sunday to Saturday

## Term Schedule Pattern

The three terms follow this annual pattern:

1. **Michaelmas Term** (Autumn)
   - Typically starts early October
   - Week 1 begins on a Sunday in mid-October
   - Runs through early December

2. **Hilary Term** (Spring)  
   - Typically starts mid-January
   - Week 1 begins on a Sunday in late January
   - Runs through mid-March

3. **Trinity Term** (Summer)
   - Typically starts late April
   - Week 1 begins on a Sunday in late April/early May
   - Runs through mid-June

## Example Data Structure

```json
{
  "terms": [
    {
      "year": "2024-25",
      "michaelmas": {
        "week0": {
          "start": "2024-10-06",
          "end": "2024-10-12"
        },
        "week1": {
          "start": "2024-10-13",
          "end": "2024-10-19"
        },
        ...
        "week12": {
          "start": "2024-12-29",
          "end": "2025-01-04"
        }
      },
      "hilary": { ... },
      "trinity": { ... }
    }
  ]
}
```

## Usage Examples

### Finding a specific week:
To find Michaelmas Week 3 of 2024-25:
```javascript
terms[0].michaelmas.week3
// Returns: { "start": "2024-10-27", "end": "2024-11-02" }
```

### Checking if a date falls within a term week:
Given a date, you can check if it falls between a week's start and end dates.

### Iterating through all weeks of a term:
Each term object contains week0 through week12 as properties that can be accessed directly.

## Notes

- The file currently contains data from academic year 2024-25 through 2031-32
- All weeks are 7 days long, running Sunday to Saturday
- The data structure is consistent across all years and terms
- Week 0 represents the week immediately before Full Term
- Weeks 9-12 represent the extended period after Full Term ends