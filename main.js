// Global variables
let currentView = 'list';
let filteredEvents = [...allEvents];
let currentDate = new Date();

// DOM elements
const searchInput = document.getElementById('searchInput');
const eventsContainer = document.getElementById('eventsContainer');
const featuredEventsContainer = document.getElementById('featuredEvents');
const resultsCount = document.getElementById('resultsCount');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const calendarView = document.getElementById('calendarView');
const mapView = document.getElementById('mapView');
const addEventModal = document.getElementById('addEventModal');
const eventForm = document.getElementById('eventForm');

// Filter elements
const dateFilter = document.getElementById('dateFilter');
const typeFilter = document.getElementById('typeFilter');
const locationFilter = document.getElementById('locationFilter');
const priceFilter = document.getElementById('priceFilter');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const clearFilters = document.getElementById('clearFilters');

// Calendar elements
const calendarGrid = document.getElementById('calendarGrid');
const currentMonthDisplay = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    renderEvents();
    renderFeaturedEvents();
    updateResultsCount();
});

function initializeApp() {
    // Set default date filter to show upcoming events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Initialize calendar
    updateCalendarDisplay();
}

function setupEventListeners() {
    // View switching
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.target.dataset.view);
        });
    });

    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // Filter listeners
    dateFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    locationFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applySorting);
    clearFilters.addEventListener('click', clearAllFilters);

    // Load more events
    loadMoreBtn.addEventListener('click', loadMoreEvents);

    // Modal functionality
    document.getElementById('submitEventBtn').addEventListener('click', openAddEventModal);
    document.getElementById('closeModal').addEventListener('click', closeAddEventModal);
    document.getElementById('cancelBtn').addEventListener('click', closeAddEventModal);
    
    // Close modal when clicking outside
    addEventModal.addEventListener('click', (e) => {
        if (e.target === addEventModal) {
            closeAddEventModal();
        }
    });

    // Form submission
    eventForm.addEventListener('submit', handleEventSubmission);

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
    nextMonthBtn.addEventListener('click', () => navigateMonth(1));

    // Keyboard accessibility
    document.addEventListener('keydown', handleKeyboardNavigation);
}

function switchView(view) {
    currentView = view;
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Show/hide appropriate content
    eventsContainer.style.display = view === 'list' ? 'grid' : 'none';
    calendarView.style.display = view === 'calendar' ? 'block' : 'none';
    mapView.style.display = view === 'map' ? 'block' : 'none';
    loadMoreBtn.style.display = view === 'list' ? 'block' : 'none';

    if (view === 'calendar') {
        renderCalendar();
    } else if (view === 'map') {
        renderMapView();
    }
}

function handleSearch() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const dateRange = dateFilter.value;
    const eventType = typeFilter.value;
    const eventLocation = locationFilter.value;
    const eventPrice = priceFilter.value;
    const eventCategory = categoryFilter.value;

    filteredEvents = allEvents.filter(event => {
        // Search filter
        const matchesSearch = !searchTerm || 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.tags.some(tag => tag.toLowerCase().includes(searchTerm));

        // Date filter
        const matchesDate = !dateRange || checkDateRange(event.date, dateRange);

        // Type filter
        const matchesType = !eventType || event.type === eventType;

        // Location filter
        const matchesLocation = !eventLocation || 
            (eventLocation === 'online' && event.location.toLowerCase() === 'online') ||
            (eventLocation !== 'online' && event.location.toLowerCase().includes(eventLocation.replace('-', ' ')));

        // Price filter
        const matchesPrice = !eventPrice || 
            (eventPrice === 'free' && event.price === 0) ||
            (eventPrice === 'paid' && event.price > 0);

        // Category filter
        const matchesCategory = !eventCategory || event.category === eventCategory;

        return matchesSearch && matchesDate && matchesType && matchesLocation && matchesPrice && matchesCategory;
    });

    applySorting();
    currentPage = 1;
    renderEvents();
    updateResultsCount();
    updateLoadMoreButton();
}

function checkDateRange(eventDate, range) {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    
    switch (range) {
        case 'today':
            return eventDateObj.toDateString() === today.toDateString();
        case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDateObj >= today && eventDateObj <= weekFromNow;
        case 'month':
            const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            return eventDateObj >= today && eventDateObj <= monthFromNow;
        default:
            return true;
    }
}

function applySorting() {
    const sortBy = sortSelect.value;
    
    filteredEvents.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return b.id - a.id;
            case 'upcoming':
                return new Date(a.date) - new Date(b.date);
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            default:
                return 0;
        }
    });
}

function clearAllFilters() {
    searchInput.value = '';
    dateFilter.value = '';
    typeFilter.value = '';
    locationFilter.value = '';
    priceFilter.value = '';
    categoryFilter.value = '';
    sortSelect.value = 'newest';
    
    filteredEvents = [...allEvents];
    applySorting();
    currentPage = 1;
    renderEvents();
    updateResultsCount();
    updateLoadMoreButton();
}

function renderEvents() {
    const startIndex = 0;
    const endIndex = currentPage * eventsPerPage;
    const eventsToShow = filteredEvents.slice(startIndex, endIndex);
    
    eventsContainer.innerHTML = eventsToShow.map(event => createEventCard(event)).join('');
    
    // Add click event listeners to event cards
    eventsContainer.querySelectorAll('.event-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            // You can implement event detail view here
            console.log('Event clicked:', eventsToShow[index]);
        });
    });
}

function renderFeaturedEvents() {
    const featured = allEvents.filter(event => event.featured);
    featuredEventsContainer.innerHTML = featured.map(event => createEventCard(event, true)).join('');
}

function createEventCard(event, isFeatured = false) {
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const badges = [];
    if (event.price === 0) badges.push('<span class="badge free">Free</span>');
    if (event.popular) badges.push('<span class="badge popular">Popular</span>');
    if (isNewEvent(event.date)) badges.push('<span class="badge new">New</span>');
    
    const cardClass = isFeatured ? 'event-card featured-card' : 'event-card';
    
    return `
        <article class="${cardClass}" role="button" tabindex="0" aria-label="Event: ${event.title}">
            <img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy">
            <div class="event-content">
                <header class="event-header">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-date-time">📅 ${formattedDate} at ${event.time}</div>
                    <div class="event-location">📍 ${event.location}</div>
                </header>
                <p class="event-description">${event.description}</p>
                <div class="event-badges">
                    ${badges.join('')}
                </div>
                <footer class="event-footer">
                    <div class="event-price ${event.price === 0 ? 'free' : ''}">
                        ${event.price === 0 ? 'Free' : `$${event.price}`}
                    </div>
                    <button class="event-btn" onclick="handleEventRegistration(${event.id})" aria-label="Register for ${event.title}">
                        ${event.price === 0 ? 'Join Free' : 'Register'}
                    </button>
                </footer>
            </div>
        </article>
    `;
}

function isNewEvent(eventDate) {
    const eventDateObj = new Date(eventDate);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return eventDateObj > sevenDaysAgo;
}

function loadMoreEvents() {
    currentPage++;
    renderEvents();
    updateLoadMoreButton();
}

function updateLoadMoreButton() {
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
    loadMoreBtn.style.display = currentPage >= totalPages ? 'none' : 'block';
    loadMoreBtn.disabled = currentPage >= totalPages;
}

function updateResultsCount() {
    const count = filteredEvents.length;
    resultsCount.textContent = `${count} event${count !== 1 ? 's' : ''} found`;
}

// Calendar functionality
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month display
    currentMonthDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Clear calendar grid
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateString === new Date().toISOString().split('T')[0];
        
        if (isToday) {
            dayElement.classList.add('today');
        }
        
        dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        
        // Add events for this day
        const dayEvents = filteredEvents.filter(event => event.date === dateString);
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'calendar-event';
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.time}`;
            eventElement.addEventListener('click', () => {
                console.log('Calendar event clicked:', event);
            });
            dayElement.appendChild(eventElement);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function updateCalendarDisplay() {
    if (currentView === 'calendar') {
        renderCalendar();
    }
}

// Map view functionality
function renderMapView() {
    const mapEvents = document.getElementById('mapEvents');
    const locationGroups = {};
    
    // Group events by location
    filteredEvents.forEach(event => {
        if (!locationGroups[event.location]) {
            locationGroups[event.location] = [];
        }
        locationGroups[event.location].push(event);
    });
    
    // Render location groups
    mapEvents.innerHTML = Object.entries(locationGroups).map(([location, events]) => `
        <div class="location-group">
            <h4>${location} (${events.length} events)</h4>
            ${events.map(event => `
                <div class="map-event-item">
                    <strong>${event.title}</strong>
                    <div>${new Date(event.date).toLocaleDateString()} - ${event.time}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// Modal functionality
function openAddEventModal() {
    addEventModal.classList.add('active');
    addEventModal.setAttribute('aria-hidden', 'false');
    document.getElementById('eventTitle').focus();
    document.body.style.overflow = 'hidden';
}

function closeAddEventModal() {
    addEventModal.classList.remove('active');
    addEventModal.setAttribute('aria-hidden', 'true');
    eventForm.reset();
    document.body.style.overflow = '';
}

function handleEventSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(eventForm);
    const newEvent = {
        id: allEvents.length + 1,
        title: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        type: document.getElementById('eventType').value,
        category: document.getElementById('eventCategory').value,
        price: parseFloat(document.getElementById('eventPrice').value) || 0,
        description: document.getElementById('eventDescription').value,
        image: document.getElementById('eventImage').value || 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400',
        featured: false,
        popular: false,
        tags: [document.getElementById('eventCategory').value, document.getElementById('eventType').value]
    };
    
    // Add to events array
    allEvents.unshift(newEvent);
    
    // Show loading
    showLoading();
    
    // Simulate API call
    setTimeout(() => {
        hideLoading();
        closeAddEventModal();
        
        // Refresh the view
        applyFilters();
        
        // Show success message
        alert('Event submitted successfully! It will be reviewed and published soon.');
    }, 1500);
}

// Event registration handler
function handleEventRegistration(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
        alert(`Thank you for your interest in "${event.title}"! Registration functionality would be implemented here.`);
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Keyboard navigation
function handleKeyboardNavigation(e) {
    if (e.key === 'Escape' && addEventModal.classList.contains('active')) {
        closeAddEventModal();
    }
    
    // Add more keyboard shortcuts as needed
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'f':
                e.preventDefault();
                searchInput.focus();
                break;
            case 'n':
                e.preventDefault();
                openAddEventModal();
                break;
        }
    }
}

// Accessibility enhancements
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Add screen reader only styles
const srOnlyStyles = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = srOnlyStyles;
document.head.appendChild(styleSheet);