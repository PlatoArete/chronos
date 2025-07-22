// JavaScript for WFH/Office Tracker

document.addEventListener('DOMContentLoaded', () => {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const calendarDaysContainer = document.getElementById('calendar-days');
    const themeToggle = document.getElementById('theme-toggle');
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const dropdownThemeText = settingsDropdown.querySelector('.dropdown-item span');
    const workingDayCheckboxes = document.querySelectorAll('#working-days-selector input[type="checkbox"]');
    const aboutLink = document.getElementById('about-link');
    const aboutModal = document.getElementById('about-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const readmeContentEl = document.getElementById('readme-content');

    const monthlyWfhEl = document.getElementById('monthly-wfh');
    const monthlyOfficeEl = document.getElementById('monthly-office');
    const quarterlyWfhEl = document.getElementById('quarterly-wfh');
    const quarterlyOfficeEl = document.getElementById('quarterly-office');
    const monthlyWorkingDaysEl = document.getElementById('monthly-working-days');
    const quarterlyWorkingDaysEl = document.getElementById('quarterly-working-days');
    const monthlyTargetOfficeEl = document.getElementById('monthly-target-office');
    const monthlyOfficePercentageEl = document.getElementById('monthly-office-percentage');
    const quarterlyTargetOfficeEl = document.getElementById('quarterly-target-office');
    const quarterlyOfficePercentageEl = document.getElementById('quarterly-office-percentage');

    let currentDate = new Date();
    let workData = {}; // Store as { 'YYYY-MM-DD': 'wfh'/'office'/'holiday' }
    let bankHolidayData = {}; // To store fetched bank holidays { 'YYYY-MM-DD': true }

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const DAY_STATUS = { NONE: 'none', WFH: 'wfh', OFFICE: 'office', HOLIDAY: 'holiday' };
    const STATUS_TEXT = { [DAY_STATUS.WFH]: 'WFH', [DAY_STATUS.OFFICE]: 'WFO', [DAY_STATUS.HOLIDAY]: 'HOLS' };

    function populateMonthSelect() {
        MONTH_NAMES.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = month;
            monthSelect.appendChild(option);
        });
    }

    function populateYearSelect() {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }

    function renderCalendar(year, month) {
        calendarDaysContainer.innerHTML = ''; 
        currentDate = new Date(year, month, 1);

        monthSelect.value = month;
        yearSelect.value = year;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonthRaw = new Date(year, month, 1).getDay(); 
        const firstDayOfWeek = (firstDayOfMonthRaw === 0) ? 6 : firstDayOfMonthRaw - 1;

        const prevMonthEndDate = new Date(year, month, 0);
        const prevMonthLastDate = prevMonthEndDate.getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDate - i;
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'other-month');
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayCell.appendChild(dayNumberSpan);
            calendarDaysContainer.appendChild(dayCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayCell.appendChild(dayNumberSpan);

            const statusTextSpan = document.createElement('span');
            statusTextSpan.classList.add('status-text');
            dayCell.appendChild(statusTextSpan);

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (workData[dateStr]) {
                dayCell.classList.add(workData[dateStr]);
                statusTextSpan.textContent = STATUS_TEXT[workData[dateStr]] || '';
            } else if (bankHolidayData[dateStr]) { // Check if it's an API-set bank holiday not yet in workData
                dayCell.classList.add(DAY_STATUS.HOLIDAY);
                statusTextSpan.textContent = STATUS_TEXT[DAY_STATUS.HOLIDAY] || '';
                 // Optionally, add to workData if we want it to be saved/cycled by user
                // workData[dateStr] = DAY_STATUS.HOLIDAY;
            }

            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }

            dayCell.addEventListener('click', () => toggleDayStatus(dayCell, dateStr));
            calendarDaysContainer.appendChild(dayCell);
        }

        const totalCells = 42; 
        const cellsFilledSoFar = firstDayOfWeek + daysInMonth;
        const nextMonthDaysNeeded = totalCells - cellsFilledSoFar > 0 ? totalCells - cellsFilledSoFar : ( (totalCells + 7) - cellsFilledSoFar ) % 7 ; // ensure we fill to 7 if totalCells is not enough, or if it perfectly aligns we add 0 (or 7 if we want to always have a next month row)
        // Correction for ensuring next month days fill up to a total of 42 cells if needed, or at least complete the week
        let daysToAdd = nextMonthDaysNeeded;
        if ( (firstDayOfWeek + daysInMonth + nextMonthDaysNeeded) < totalCells && (firstDayOfWeek + daysInMonth + nextMonthDaysNeeded) % 7 !== 0){ // Check if we need more to complete 6 weeks
             daysToAdd = nextMonthDaysNeeded + (7 - ((firstDayOfWeek + daysInMonth + nextMonthDaysNeeded) %7)) % 7;
        }
        if (daysToAdd > 14) daysToAdd = daysToAdd % 7; // Cap to prevent excessive next month days if logic is off, max 2 rows.
        if (daysToAdd === 0 && (firstDayOfWeek + daysInMonth) % 7 !== 0) daysToAdd = 7 - ((firstDayOfWeek + daysInMonth) % 7); // If no days needed but current month doesnt end week
        if ( (firstDayOfWeek + daysInMonth) % 7 === 0 && daysToAdd === 0 && (firstDayOfWeek + daysInMonth < 35) ) daysToAdd = 7; // Ensure at least 5 rows, if 4 rows are full, add one more from next month


        for (let day = 1; day <= daysToAdd; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day', 'other-month');
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.classList.add('day-number');
            dayNumberSpan.textContent = day;
            dayCell.appendChild(dayNumberSpan);
            calendarDaysContainer.appendChild(dayCell);
        }

        updateSummaries(year, month);
    }

    function toggleDayStatus(dayCell, dateStr) {
        const currentStatus = workData[dateStr];
        let nextStatus = DAY_STATUS.WFH;

        if (currentStatus === DAY_STATUS.WFH) {
            nextStatus = DAY_STATUS.OFFICE;
        } else if (currentStatus === DAY_STATUS.OFFICE) {
            nextStatus = DAY_STATUS.HOLIDAY;
        } else if (currentStatus === DAY_STATUS.HOLIDAY) {
            nextStatus = DAY_STATUS.NONE; 
        }

        dayCell.classList.remove(DAY_STATUS.WFH, DAY_STATUS.OFFICE, DAY_STATUS.HOLIDAY);
        const statusTextSpan = dayCell.querySelector('.status-text');

        if (nextStatus === DAY_STATUS.NONE) {
            delete workData[dateStr];
            if (statusTextSpan) statusTextSpan.textContent = '';
        } else {
            workData[dateStr] = nextStatus;
            dayCell.classList.add(nextStatus);
            if (statusTextSpan) statusTextSpan.textContent = STATUS_TEXT[nextStatus] || '';
        }
        saveWorkData();
        updateSummaries(currentDate.getFullYear(), currentDate.getMonth());
    }

    function updateSummaries(year, month) {
        let monthlyWfh = 0;
        let monthlyOffice = 0;
        let monthlyNetWorkingDays = 0; 
        let monthlyTargetOfficeDays = 0;
        let monthlyOfficePercentage = 0.0;
        let quarterlyWfh = 0;
        let quarterlyOffice = 0;
        let quarterlyNetWorkingDays = 0;
        let quarterlyTargetOfficeDays = 0;
        let quarterlyOfficePercentage = 0.0;

        const selectedWorkingDays = new Set();
        workingDayCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedWorkingDays.add(parseInt(checkbox.value));
            }
        });

        // Monthly summary
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInCurrentMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const currentDateObj = new Date(year, month, day);
            const dayOfWeek = currentDateObj.getDay();

            const currentDayStatus = workData[dateStr] || (bankHolidayData[dateStr] ? DAY_STATUS.HOLIDAY : null);

            if (currentDayStatus === DAY_STATUS.WFH) monthlyWfh++;
            if (currentDayStatus === DAY_STATUS.OFFICE) monthlyOffice++;

            if (selectedWorkingDays.has(dayOfWeek)) {
                if (currentDayStatus !== DAY_STATUS.HOLIDAY) {
                    monthlyNetWorkingDays++;
                }
            }
        }
        monthlyWfhEl.textContent = monthlyWfh;
        monthlyOfficeEl.textContent = monthlyOffice;
        if (monthlyWorkingDaysEl) monthlyWorkingDaysEl.textContent = monthlyNetWorkingDays;

        // Calculate and display monthly target office days and percentage
        monthlyTargetOfficeDays = Math.round(monthlyNetWorkingDays * 0.6);
        monthlyOfficePercentage = (monthlyNetWorkingDays > 0) ? (monthlyOffice / monthlyNetWorkingDays) * 100 : 0;
        if (monthlyTargetOfficeEl) monthlyTargetOfficeEl.textContent = monthlyTargetOfficeDays;
        if (monthlyOfficePercentageEl) monthlyOfficePercentageEl.textContent = monthlyOfficePercentage.toFixed(1);

        // Quarterly summary
        const currentQuarter = Math.floor(month / 3);
        const startMonthOfQuarter = currentQuarter * 3;

        for (let mOffset = 0; mOffset < 3; mOffset++) {
            const currentMonthInQuarter = startMonthOfQuarter + mOffset;
            // Adjust year if quarter spans across year-end (e.g. viewing Dec, quarter is Oct, Nov, Dec)
            // Or viewing Jan, quarter is Jan, Feb, Mar of current year.
            // This simple calculation assumes the quarter is within the same `year` as the viewed `month`.
            // For a more robust cross-year quarter, this would need adjustment if `startMonthOfQuarter` or `currentMonthInQuarter` makes year change.
            const yearForThisMonthInQuarter = year; 
            const daysInThisMonth = new Date(yearForThisMonthInQuarter, currentMonthInQuarter + 1, 0).getDate();
            
            for (let day = 1; day <= daysInThisMonth; day++) {
                const dateStr = `${yearForThisMonthInQuarter}-${String(currentMonthInQuarter + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const currentDateObj = new Date(yearForThisMonthInQuarter, currentMonthInQuarter, day);
                const dayOfWeek = currentDateObj.getDay();

                const currentDayStatus = workData[dateStr] || (bankHolidayData[dateStr] ? DAY_STATUS.HOLIDAY : null);

                if (currentDayStatus === DAY_STATUS.WFH) quarterlyWfh++;
                if (currentDayStatus === DAY_STATUS.OFFICE) quarterlyOffice++;

                if (selectedWorkingDays.has(dayOfWeek)) {
                    if (currentDayStatus !== DAY_STATUS.HOLIDAY) {
                        quarterlyNetWorkingDays++;
                    }
                }
            }
        }
        quarterlyWfhEl.textContent = quarterlyWfh;
        quarterlyOfficeEl.textContent = quarterlyOffice;
        if (quarterlyWorkingDaysEl) quarterlyWorkingDaysEl.textContent = quarterlyNetWorkingDays;

        // Calculate and display quarterly target office days and percentage
        quarterlyTargetOfficeDays = Math.round(quarterlyNetWorkingDays * 0.6);
        quarterlyOfficePercentage = (quarterlyNetWorkingDays > 0) ? (quarterlyOffice / quarterlyNetWorkingDays) * 100 : 0;
        if (quarterlyTargetOfficeEl) quarterlyTargetOfficeEl.textContent = quarterlyTargetOfficeDays;
        if (quarterlyOfficePercentageEl) quarterlyOfficePercentageEl.textContent = quarterlyOfficePercentage.toFixed(1);
    }

    function saveWorkData() {
        localStorage.setItem('workData', JSON.stringify(workData));
    }

    function loadWorkData() {
        const savedData = localStorage.getItem('workData');
        if (savedData) {
            workData = JSON.parse(savedData);
        }
    }

    function saveWorkingDaySelection() {
        const selection = Array.from(workingDayCheckboxes).map(cb => cb.checked);
        localStorage.setItem('workingDaySelection', JSON.stringify(selection));
    }

    function loadWorkingDaySelection() {
        const savedSelection = localStorage.getItem('workingDaySelection');
        if (savedSelection) {
            const selectionArray = JSON.parse(savedSelection);
            workingDayCheckboxes.forEach((checkbox, index) => {
                if (selectionArray[index] !== undefined) {
                    checkbox.checked = selectionArray[index];
                }
            });
        } 
        // If not saved, HTML defaults (M-F checked) will be used.
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
            if(dropdownThemeText) dropdownThemeText.textContent = 'Dark Mode is ON'; 
        } else {
            document.body.classList.remove('dark-mode');
            themeToggle.checked = false;
            if(dropdownThemeText) dropdownThemeText.textContent = 'Light Mode is ON'; 
        }
    }

    function saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            applyTheme('dark'); // Default to dark mode
        }
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            applyTheme('dark');
            saveThemePreference('dark');
        } else {
            applyTheme('light');
            saveThemePreference('light');
        }
    });

    settingsButton.addEventListener('click', (event) => {
        event.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    window.addEventListener('click', (event) => {
        if (!settingsDropdown.contains(event.target) && !settingsButton.contains(event.target)) {
            if (settingsDropdown.classList.contains('active')) {
                settingsDropdown.classList.remove('active');
            }
        }
        if (event.target === aboutModal) {
            if (aboutModal.classList.contains('active')) {
                aboutModal.classList.remove('active');
            }
        }
    });

    workingDayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            saveWorkingDaySelection();
            updateSummaries(currentDate.getFullYear(), currentDate.getMonth());
        });
    });

    function changeMonth(offset) {
        currentDate.setMonth(currentDate.getMonth() + offset);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    prevMonthButton.addEventListener('click', () => changeMonth(-1));
    nextMonthButton.addEventListener('click', () => changeMonth(1));
    monthSelect.addEventListener('change', (e) => {
        currentDate.setMonth(parseInt(e.target.value));
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
    yearSelect.addEventListener('change', (e) => {
        currentDate.setFullYear(parseInt(e.target.value));
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    async function fetchAndApplyBankHolidays() {
        try {
            const response = await fetch('https://www.gov.uk/bank-holidays.json');
            if (!response.ok) {
                console.error('Failed to fetch bank holidays:', response.status, response.statusText);
                return;
            }
            const data = await response.json();
            // Using England and Wales by default
            const holidays = data['england-and-wales'].events;
            if (holidays) {
                holidays.forEach(holiday => {
                    bankHolidayData[holiday.date] = true; // Store YYYY-MM-DD format
                    // We won't directly add to workData here to allow user overrides more easily.
                    // renderCalendar and updateSummaries will check bankHolidayData.
                });
            }
            console.log('Bank holidays loaded:', bankHolidayData);
        } catch (error) {
            console.error('Error fetching or processing bank holidays:', error);
        }
    }

    async function displayReadmeInModal() {
        try {
            const response = await fetch('README.md');
            if (!response.ok) {
                readmeContentEl.textContent = 'Could not load README.md content.';
                console.error('Failed to fetch README.md:', response.status, response.statusText);
                return;
            }
            const readmeText = await response.text();
            readmeContentEl.textContent = readmeText;
            aboutModal.classList.add('active');
            if (settingsDropdown.classList.contains('active')) {
                settingsDropdown.classList.remove('active');
            }
        } catch (error) {
            readmeContentEl.textContent = 'Error loading README.md content.';
            console.error('Error fetching or processing README.md:', error);
        }
    }

    if (aboutLink) {
        aboutLink.addEventListener('click', (event) => {
            event.preventDefault();
            displayReadmeInModal();
        });
    }

    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            aboutModal.classList.remove('active');
        });
    }
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && aboutModal.classList.contains('active')) {
            aboutModal.classList.remove('active');
        }
    });

    async function init() {
        loadWorkData();
        loadWorkingDaySelection();
        await fetchAndApplyBankHolidays(); // Fetch bank holidays before first render
        loadThemePreference(); 
        populateMonthSelect();
        populateYearSelect();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    init();
}); 