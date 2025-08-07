// JavaScript for WFH/Office Tracker

document.addEventListener('DOMContentLoaded', () => {
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    const calendarDaysContainer = document.getElementById('calendar-days');
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const themeToggleInput = document.getElementById('theme-toggle');
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
    let notesData = {}; // To store notes for each date

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    document.body.appendChild(contextMenu);

    // Create notes modal
    const notesModal = document.createElement('div');
    notesModal.className = 'notes-modal';
    notesModal.innerHTML = `
        <div class="notes-modal-content">
            <div class="notes-modal-header">
                <h3>Notes for <span class="notes-date"></span></h3>
                <button class="notes-modal-close">&times;</button>
            </div>
            <textarea class="notes-textarea" placeholder="Enter your notes here..."></textarea>
            <button class="notes-save-btn">Save Notes</button>
        </div>
    `;
    document.body.appendChild(notesModal);

    // Notes modal elements
    const notesDateSpan = notesModal.querySelector('.notes-date');
    const notesTextarea = notesModal.querySelector('.notes-textarea');
    const notesSaveBtn = notesModal.querySelector('.notes-save-btn');
    const notesCloseBtn = notesModal.querySelector('.notes-modal-close');
    let currentEditingDate = null;

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const DAY_STATUS = { 
        NONE: 'none', 
        WFH: 'wfh', 
        OFFICE: 'office', 
        HOLIDAY: 'holiday',
        SICK: 'sick',
        PERSONAL: 'personal',
        OFFSITE: 'offsite',
        BANK_HOLIDAY: 'bank-holiday'
    };
    const STATUS_TEXT = { 
        [DAY_STATUS.WFH]: 'WFH', 
        [DAY_STATUS.OFFICE]: 'WFO', 
        [DAY_STATUS.HOLIDAY]: 'HOLS',
        [DAY_STATUS.SICK]: 'SICK',
        [DAY_STATUS.PERSONAL]: 'PERS',
        [DAY_STATUS.OFFSITE]: 'OFF',
        [DAY_STATUS.BANK_HOLIDAY]: 'BHOL'
    };

    // Status options for the dropdown (order matters for display)
    const STATUS_OPTIONS = [
        { status: DAY_STATUS.WFH, text: 'Work From Home' },
        { status: DAY_STATUS.OFFICE, text: 'Work From Office' },
        { status: DAY_STATUS.OFFSITE, text: 'Off Site Work' },
        { status: DAY_STATUS.HOLIDAY, text: 'Holiday' },
        { status: DAY_STATUS.SICK, text: 'Sick Leave' },
        { status: DAY_STATUS.PERSONAL, text: 'Personal Leave' },
        { status: DAY_STATUS.BANK_HOLIDAY, text: 'Bank Holiday' },
        { status: DAY_STATUS.NONE, text: 'Clear' }
    ];

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

    function createStatusDropdown(dayCell, dateStr, currentStatus) {
        const dropdown = document.createElement('div');
        dropdown.className = 'day-status-dropdown';
        dropdown.setAttribute('role', 'listbox');
        dropdown.setAttribute('aria-label', `Select status for ${dateStr}`);

        STATUS_OPTIONS.forEach(option => {
            const optionEl = document.createElement('div');
            optionEl.className = 'day-status-option';
            optionEl.setAttribute('role', 'option');
            optionEl.setAttribute('data-status', option.status);
            if (currentStatus === option.status) {
                optionEl.classList.add('selected');
                optionEl.setAttribute('aria-selected', 'true');
            }

            const colorDot = document.createElement('span');
            colorDot.className = 'status-color';
            
            const text = document.createElement('span');
            text.className = 'status-text';
            text.textContent = option.text;
            
            const checkmark = document.createElement('span');
            checkmark.className = 'status-check';
            checkmark.innerHTML = '✓';
            checkmark.setAttribute('aria-hidden', 'true');

            optionEl.appendChild(colorDot);
            optionEl.appendChild(text);
            optionEl.appendChild(checkmark);

            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                setDayStatus(dayCell, dateStr, option.status);
                closeAllDropdowns();
            });

            // Keyboard navigation
            optionEl.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        setDayStatus(dayCell, dateStr, option.status);
                        closeAllDropdowns();
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        const next = optionEl.nextElementSibling;
                        if (next) next.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prev = optionEl.previousElementSibling;
                        if (prev) prev.focus();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        closeAllDropdowns();
                        break;
                }
            });

            optionEl.setAttribute('tabindex', '0');
            dropdown.appendChild(optionEl);
        });

        return dropdown;
    }

    function closeAllDropdowns() {
        document.querySelectorAll('.day-status-button.active').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.day-status-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            if (dropdown.parentElement) {
                dropdown.parentElement.removeChild(dropdown);
            }
        });
    }

    function setDayStatus(dayCell, dateStr, status) {
        dayCell.classList.remove(...Object.values(DAY_STATUS));
        const statusTextSpan = dayCell.querySelector('.status-text');

        if (status === DAY_STATUS.NONE) {
            delete workData[dateStr];
            if (statusTextSpan) statusTextSpan.textContent = '';
        } else {
            workData[dateStr] = status;
            dayCell.classList.add(status);
            if (statusTextSpan) {
                statusTextSpan.textContent = STATUS_TEXT[status] || '';
            }
        }
        saveWorkData();
        updateSummaries(currentDate.getFullYear(), currentDate.getMonth());
    }

    function createDayCell(day, dateStr, isOtherMonth = false) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day');
        dayCell.setAttribute('data-date', dateStr);
        if (isOtherMonth) dayCell.classList.add('other-month');

        // Create status button with chevron
        const statusButton = document.createElement('button');
        statusButton.className = 'day-status-button';
        statusButton.setAttribute('aria-label', `Change status for ${dateStr}`);
        statusButton.setAttribute('aria-expanded', 'false');
        statusButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8l4 4-4 4"/>
            </svg>
        `;

        // Create day number
        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.classList.add('day-number');
        dayNumberSpan.textContent = day;

        // Create status text
        const statusTextSpan = document.createElement('span');
        statusTextSpan.classList.add('status-text');

        // Add elements to day cell
        dayCell.appendChild(statusButton);
        dayCell.appendChild(dayNumberSpan);
        dayCell.appendChild(statusTextSpan);

        // Set initial status if exists
        const currentStatus = workData[dateStr] || (bankHolidayData[dateStr] ? DAY_STATUS.BANK_HOLIDAY : null);
        if (currentStatus) {
            dayCell.classList.add(currentStatus === DAY_STATUS.BANK_HOLIDAY ? DAY_STATUS.HOLIDAY : currentStatus);
            statusTextSpan.textContent = STATUS_TEXT[currentStatus === DAY_STATUS.BANK_HOLIDAY ? DAY_STATUS.BANK_HOLIDAY : currentStatus] || '';
        }

        // Create dropdown (but don't append yet)
        const dropdown = createStatusDropdown(dayCell, dateStr, currentStatus);

        // Handle status button click
        statusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle this dropdown
            const isActive = statusButton.classList.contains('active');
            
            // Close all other dropdowns first
            document.querySelectorAll('.day-status-dropdown.active').forEach(d => {
                const btn = d.parentElement.querySelector('.day-status-button');
                btn.classList.remove('active');
                btn.setAttribute('aria-expanded', 'false');
                d.classList.remove('active');
                if (d.parentElement) {
                    d.parentElement.removeChild(d);
                }
            });

            // Toggle current dropdown
            if (isActive) {
                statusButton.classList.remove('active');
                statusButton.setAttribute('aria-expanded', 'false');
                if (dropdown.parentElement) {
                    dropdown.parentElement.removeChild(dropdown);
                }
            } else {
                statusButton.classList.add('active');
                statusButton.setAttribute('aria-expanded', 'true');
                document.body.appendChild(dropdown);
                
                // Position the dropdown next to the button
                const buttonRect = statusButton.getBoundingClientRect();
                dropdown.style.left = `${buttonRect.right + 5}px`;
                dropdown.style.top = `${buttonRect.top}px`;
                
                dropdown.classList.add('active');
                
                // Focus first option
                const firstOption = dropdown.querySelector('.day-status-option');
                if (firstOption) firstOption.focus();
            }
        });

        // Handle cycling click on the rest of the cell and long-press for mobile
        let longPressTimer = null;
        let isLongPress = false;

        dayCell.addEventListener('touchstart', e => {
            // Don't trigger long-press if the status button itself is the target
            if (e.target.closest('.day-status-button')) return;
            
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                e.preventDefault(); // Prevent default touch actions like text selection or context menu
                
                // Open status dropdown by simulating a click on its button
                if (statusButton) {
                    statusButton.click();
                }
                
                // Provide haptic feedback if the browser supports it
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, 500); // 500ms threshold for a long press
        });

        dayCell.addEventListener('touchend', () => {
            clearTimeout(longPressTimer);
        });

        dayCell.addEventListener('touchmove', () => {
            clearTimeout(longPressTimer);
        });

        dayCell.addEventListener('click', (e) => {
            // If a long press just occurred, prevent the default click action.
            if (isLongPress) {
                e.preventDefault();
                e.stopPropagation();
                isLongPress = false; // Reset for the next interaction
                return;
            }
            // If it's a regular click, perform the toggle action.
            if (e.target !== statusButton && !statusButton.contains(e.target) && !dropdown.contains(e.target)) {
                toggleDayStatus(dayCell, dateStr);
            }
        });

        // Add right-click handler
        dayCell.addEventListener('contextmenu', (e) => showContextMenu(e, dateStr));

        // Add notes indicator if needed
        if (notesData[dateStr]) {
            const indicator = document.createElement('div');
            indicator.className = 'day-note-indicator';
            indicator.innerHTML = '📝';
            indicator.title = 'This day has notes';
            dayCell.appendChild(indicator);
        }

        return dayCell;
    }

    function renderCalendar(year, month) {
        calendarDaysContainer.innerHTML = '';
        currentDate = new Date(year, month, 1);

        monthSelect.value = month;
        yearSelect.value = year;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonthRaw = new Date(year, month, 1).getDay();
        const firstDayOfWeek = (firstDayOfMonthRaw === 0) ? 6 : firstDayOfMonthRaw - 1;

        // Previous month days
        const prevMonthEndDate = new Date(year, month, 0);
        const prevMonthLastDate = prevMonthEndDate.getDate();

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDate - i;
            const prevMonth = month - 1;
            const prevYear = prevMonth < 0 ? year - 1 : year;
            const adjustedMonth = prevMonth < 0 ? 11 : prevMonth;
            const dateStr = `${prevYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = createDayCell(day, dateStr, true);
            calendarDaysContainer.appendChild(dayCell);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = createDayCell(day, dateStr);
            
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('today');
            }
            
            calendarDaysContainer.appendChild(dayCell);
        }

        // Next month days
        const totalCells = 42;
        const cellsFilledSoFar = firstDayOfWeek + daysInMonth;
        let daysToAdd = totalCells - cellsFilledSoFar;
        
        if (daysToAdd > 14) daysToAdd = daysToAdd % 7;
        if (daysToAdd === 0 && (firstDayOfWeek + daysInMonth) % 7 !== 0) {
            daysToAdd = 7 - ((firstDayOfWeek + daysInMonth) % 7);
        }
        if ((firstDayOfWeek + daysInMonth) % 7 === 0 && daysToAdd === 0 && (firstDayOfWeek + daysInMonth < 35)) {
            daysToAdd = 7;
        }

        for (let day = 1; day <= daysToAdd; day++) {
            const nextMonth = month + 1;
            const nextYear = nextMonth > 11 ? year + 1 : year;
            const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
            const dateStr = `${nextYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayCell = createDayCell(day, dateStr, true);
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
            nextStatus = DAY_STATUS.OFFSITE;
        } else if (currentStatus === DAY_STATUS.OFFSITE) {
            nextStatus = DAY_STATUS.HOLIDAY;
        } else if (currentStatus === DAY_STATUS.HOLIDAY) {
            nextStatus = DAY_STATUS.SICK;
        } else if (currentStatus === DAY_STATUS.SICK) {
            nextStatus = DAY_STATUS.PERSONAL;
        } else if (currentStatus === DAY_STATUS.PERSONAL) {
            nextStatus = DAY_STATUS.NONE;
        }

        dayCell.classList.remove(DAY_STATUS.WFH, DAY_STATUS.OFFICE, DAY_STATUS.HOLIDAY, DAY_STATUS.SICK, DAY_STATUS.PERSONAL, DAY_STATUS.OFFSITE);
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

            // If it's a bank holiday, treat it as a holiday status but with different text
            const currentDayStatus = workData[dateStr] || (bankHolidayData[dateStr] ? DAY_STATUS.HOLIDAY : null);

            if (currentDayStatus === DAY_STATUS.WFH) monthlyWfh++;
            if (currentDayStatus === DAY_STATUS.OFFICE || currentDayStatus === DAY_STATUS.OFFSITE) monthlyOffice++;

            if (selectedWorkingDays.has(dayOfWeek)) {
                // Count as working day if not a holiday, sick day, or personal leave
                if (currentDayStatus !== DAY_STATUS.HOLIDAY && 
                    currentDayStatus !== DAY_STATUS.SICK && 
                    currentDayStatus !== DAY_STATUS.PERSONAL) {
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

        // Rolling 3-month summary (current month and previous two months)
        for (let mOffset = 0; mOffset < 3; mOffset++) {
            // Calculate month and year, handling year boundary correctly
            let targetMonth = month - mOffset;
            let targetYear = year;
            if (targetMonth < 0) {
                targetMonth += 12;
                targetYear--;
            }
            
            const daysInThisMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
            
            for (let day = 1; day <= daysInThisMonth; day++) {
                const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const currentDateObj = new Date(targetYear, targetMonth, day);
                const dayOfWeek = currentDateObj.getDay();

                const currentDayStatus = workData[dateStr] || (bankHolidayData[dateStr] ? DAY_STATUS.HOLIDAY : null);

                if (currentDayStatus === DAY_STATUS.WFH) quarterlyWfh++;
                if (currentDayStatus === DAY_STATUS.OFFICE || currentDayStatus === DAY_STATUS.OFFSITE) quarterlyOffice++;

                if (selectedWorkingDays.has(dayOfWeek)) {
                    // Count as working day if not a holiday, sick day, or personal leave
                    if (currentDayStatus !== DAY_STATUS.HOLIDAY && 
                        currentDayStatus !== DAY_STATUS.SICK && 
                        currentDayStatus !== DAY_STATUS.PERSONAL) {
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
            themeToggleInput.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleInput.checked = false;
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

    // Theme toggle handler
    themeToggleInput.addEventListener('change', () => {
        if (themeToggleInput.checked) {
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

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        // If we clicked inside a dropdown or button, let those handlers deal with it
        if (e.target.closest('.day-status-button') || e.target.closest('.day-status-dropdown')) {
            return;
        }
        
        // Otherwise, close all dropdowns
        closeAllDropdowns();
    });

    // Handle escape key globally
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllDropdowns();
        }
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
        } catch (error) {
            console.error('Error fetching or processing bank holidays:', error);
        }
    }

    async function displayReadmeInModal() {
        try {
            const response = await fetch('README.md');
            if (!response.ok) {
                throw new Error(`Failed to fetch README.md: ${response.status} ${response.statusText}`);
            }
            const readmeText = await response.text();
            readmeContentEl.textContent = readmeText;
            aboutModal.classList.add('active');
            if (settingsDropdown.classList.contains('active')) {
                settingsDropdown.classList.remove('active');
            }
        } catch (error) {
            console.error('Error loading README.md:', error);
            readmeContentEl.textContent = 'Error loading README content. Please try again later.';
            aboutModal.classList.add('active');
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

    function showContextMenu(e, dateStr) {
        e.preventDefault();
        
        // Close any open dropdowns
        closeAllDropdowns();
        
        // Position context menu
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        
        // Clear previous menu items
        contextMenu.innerHTML = '';
        
        // Add menu items
        const hasNotes = notesData[dateStr];
        const items = [
            {
                text: hasNotes ? 'Edit Notes' : 'Add Notes',
                icon: '📝',
                action: () => showNotesModal(dateStr)
            }
        ];
        
        if (hasNotes) {
            items.push({
                text: 'View Notes',
                icon: '👁️',
                action: () => showNotesModal(dateStr, true)
            });
            items.push({
                text: 'Delete Notes',
                icon: '🗑️',
                action: () => {
                    delete notesData[dateStr];
                    saveNotesData();
                    updateNotesIndicator(dateStr);
                }
            });
        }
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `${item.icon} ${item.text}`;
            menuItem.addEventListener('click', () => {
                item.action();
                hideContextMenu();
            });
            contextMenu.appendChild(menuItem);
        });
        
        contextMenu.classList.add('active');
    }

    function hideContextMenu() {
        contextMenu.classList.remove('active');
    }

    function showNotesModal(dateStr, readOnly = false) {
        currentEditingDate = dateStr;
        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        notesDateSpan.textContent = formattedDate;
        notesTextarea.value = notesData[dateStr] || '';
        notesTextarea.readOnly = readOnly;
        notesSaveBtn.style.display = readOnly ? 'none' : 'block';
        
        notesModal.classList.add('active');
        if (!readOnly) {
            notesTextarea.focus();
        }
    }

    function hideNotesModal() {
        notesModal.classList.remove('active');
        currentEditingDate = null;
    }

    function saveNotes() {
        if (currentEditingDate && notesTextarea.value.trim()) {
            notesData[currentEditingDate] = notesTextarea.value.trim();
        } else if (currentEditingDate) {
            delete notesData[currentEditingDate];
        }
        
        saveNotesData();
        updateNotesIndicator(currentEditingDate);
        hideNotesModal();
    }

    function updateNotesIndicator(dateStr) {
        const dayCell = document.querySelector(`.day[data-date="${dateStr}"]`);
        if (!dayCell) return;

        let indicator = dayCell.querySelector('.day-note-indicator');
        
        if (notesData[dateStr]) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'day-note-indicator';
                indicator.innerHTML = '📝';
                indicator.title = 'This day has notes';
                dayCell.appendChild(indicator);
            }
        } else if (indicator) {
            dayCell.removeChild(indicator);
        }
    }

    function saveNotesData() {
        localStorage.setItem('notesData', JSON.stringify(notesData));
    }

    function loadNotesData() {
        const savedData = localStorage.getItem('notesData');
        if (savedData) {
            notesData = JSON.parse(savedData);
        }
    }

    // Event listeners for notes functionality
    document.addEventListener('click', () => {
        hideContextMenu();
    });

    notesCloseBtn.addEventListener('click', hideNotesModal);
    notesSaveBtn.addEventListener('click', saveNotes);

    notesModal.addEventListener('click', (e) => {
        if (e.target === notesModal) {
            hideNotesModal();
        }
    });

    async function init() {
        loadWorkData();
        loadWorkingDaySelection();
        loadNotesData(); // Add this line
        await fetchAndApplyBankHolidays(); // Fetch bank holidays before first render
        loadThemePreference(); 
        populateMonthSelect();
        populateYearSelect();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    }

    init();
}); 