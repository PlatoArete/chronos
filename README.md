# Project Chronos - WFH/Office & Holiday Tracker

Project Chronos is a client-side web application designed to help you track your work locations (Work From Home, Work From Office) and holidays on a monthly and quarterly basis. It provides a clear calendar interface and insightful summaries to monitor your work patterns and office presence.

## Features

*   **Interactive Calendar**: 
    *   View and navigate through months and years.
    *   Click on a day to cycle its status through:
        *   **WFH** (Work From Home) - Pastel Blue (Light Mode) / Neon Blue (Dark Mode)
        *   **WFO** (Work From Office) - Pastel Yellow (Light Mode) / Neon Yellow (Dark Mode)
        *   **HOLS** (Holiday) - Pastel Pink (Light Mode) / Neon Pink (Dark Mode)
        *   Clear (no status)
    *   Text indicators (WFH, WFO, HOLS) directly on the calendar days.
*   **Automatic UK Bank Holiday Integration**:
    *   Automatically fetches and marks bank holidays for England and Wales from the `gov.uk` API as "HOLS".
    *   These are visually distinct and factored into working day calculations.
*   **Configurable Working Days**: 
    *   Set your typical working days (Monday to Sunday) via checkboxes in the settings menu.
    *   Defaults to Monday-Friday.
*   **Detailed Summaries**:
    *   **Monthly Summary**:
        *   Count of WFH days.
        *   Count of WFO days.
        *   **Net Working Days**: Calculated based on your selected working days for the month, minus any marked holidays (user-marked or API-set).
        *   **Target Office Days (60%)**: The target number of office days, calculated as 60% of Net Working Days (rounded up).
        *   **Office Presence**: Your actual office days as a percentage of Net Working Days.
    *   **Quarterly Summary**: Provides the same metrics as the monthly summary, aggregated for the current calendar quarter.
*   **Theme Customization**: 
    *   **Dark/Light Mode Toggle**: Switch between a dark (default) and light visual theme via a settings menu.
*   **Persistent Data**: 
    *   All your marked days, theme preferences, and selected working days are saved locally in your browser's `localStorage`. This means your data persists even after closing the browser or restarting your computer.
*   **Settings Menu**: 
    *   Accessible via a cogwheel icon.
    *   Contains the theme toggle and working day selection.

## How to Run

Project Chronos is designed for simplicity and requires no complex setup:

1.  Ensure all three files (`index.html`, `style.css`, `script.js`) are in the same folder on your computer.
2.  Open the `index.html` file in any modern web browser (e.g., Chrome, Firefox, Edge).

No web server or internet connection is strictly required for core functionality after the first load (though an internet connection is needed on first load and potentially subsequent loads if bank holiday data needs to be refreshed/updated from the API).

## Technology Stack

*   **HTML**: Structure of the application.
*   **CSS**: Styling and theming (including dark/light modes and pastel/neon color schemes).
*   **JavaScript**: All application logic, including calendar generation, interaction, data storage, API calls, and summary calculations.

---
Created by Andy Sproston - 2025
