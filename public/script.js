// Global variables
let map;
let userLocation = null;
let dustbins = [];
let markers = [];
let userMarker = null;
let infoWindow = null;

// DOM elements
const elements = {
    mapLoading: document.getElementById('mapLoading'),
    loadingList: document.getElementById('loadingList'),
    locationStatus: document.getElementById('locationStatus'),
    dustbinList: document.getElementById('dustbinList'),
    searchInput: document.getElementById('searchInput'),
    locateBtn: document.getElementById('locateBtn'),
    refreshBtn: document.getElementById('refreshBtn'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    modalTitle: document.getElementById('modalTitle'),
    modalContent: document.getElementById('modalContent'),
    toastContainer: document.getElementById('toastContainer'),
    filterEmpty: document.getElementById('filterEmpty'),
    filterLow: document.getElementById('filterLow'),
    filterMedium: document.getElementById('filterMedium'),
    filterHigh: document.getElementById('filterHigh')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    getUserLocation();
});

// Initialize Google Maps
function initMap() {
    const defaultLocation = { lat: 40.7128, lng: -74.0060 }; // New York City default
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: defaultLocation,
        styles: [
            {
                featureType: 'all',
                elementType: 'geometry.fill',
                stylers: [{ weight: '2.00' }]
            },
            {
                featureType: 'all',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#9c9c9c' }]
            },
            {
                featureType: 'all',
                elementType: 'labels.text',
                stylers: [{ visibility: 'on' }]
            },
            {
                featureType: 'landscape',
                elementType: 'all',
                stylers: [{ color: '#f2f2f2' }]
            },
            {
                featureType: 'landscape',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }]
            },
            {
                featureType: 'landscape.man_made',
                elementType: 'geometry.fill',
                stylers: [{ color: '#ffffff' }]
            },
            {
                featureType: 'poi',
                elementType: 'all',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road',
                elementType: 'all',
                stylers: [{ saturation: -100 }, { lightness: 45 }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.fill',
                stylers: [{ color: '#eeeeee' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#7b7b7b' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#ffffff' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'all',
                stylers: [{ visibility: 'simplified' }]
            },
            {
                featureType: 'road.arterial',
                elementType: 'labels.icon',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'all',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'water',
                elementType: 'all',
                stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry.fill',
                stylers: [{ color: '#c8d7d4' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#070707' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#ffffff' }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
    });

    infoWindow = new google.maps.InfoWindow();
    elements.mapLoading.style.display = 'none';
    
    // Load dustbins after map is initialized
    loadDustbins();
}

// Initialize event listeners
function initializeEventListeners() {
    elements.locateBtn.addEventListener('click', getUserLocation);
    elements.refreshBtn.addEventListener('click', refreshData);
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    });
    
    elements.searchInput.addEventListener('input', debounce(filterDustbins, 300));
    
    // Filter checkboxes
    [elements.filterEmpty, elements.filterLow, elements.filterMedium, elements.filterHigh]
        .forEach(checkbox => checkbox.addEventListener('change', filterDustbins));
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'f' && e.ctrlKey) {
            e.preventDefault();
            elements.searchInput.focus();
        }
    });
}

// Get user's current location
function getUserLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocation is not supported by this browser', 'error');
        return;
    }

    elements.locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Getting your location...</span>';
    elements.locateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Locating...';

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            updateLocationStatus('Location found');
            elements.locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>Find Me';
            
            if (map) {
                map.setCenter(userLocation);
                map.setZoom(15);
                
                // Add or update user marker
                if (userMarker) {
                    userMarker.setPosition(userLocation);
                } else {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        title: 'Your Location',
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
                                    <circle cx="12" cy="12" r="3" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(24, 24),
                            anchor: new google.maps.Point(12, 12)
                        }
                    });
                }
                
                loadDustbins();
            }
            
            showToast('Location found successfully', 'success');
        },
        (error) => {
            let message = 'Unable to get your location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    message = 'Location request timed out';
                    break;
            }
            
            updateLocationStatus('Location unavailable');
            elements.locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>Find Me';
            showToast(message, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Load dustbins from server
async function loadDustbins() {
    try {
        const response = await fetch('/api/dustbins');
        if (!response.ok) throw new Error('Failed to fetch dustbins');
        
        dustbins = await response.json();
        
        // Calculate distances if user location is available
        if (userLocation) {
            dustbins.forEach(dustbin => {
                dustbin.distance = calculateDistance(
                    userLocation.lat, userLocation.lng,
                    dustbin.latitude, dustbin.longitude
                );
            });
            
            // Sort by distance
            dustbins.sort((a, b) => a.distance - b.distance);
        }
        
        displayDustbins();
        displayMarkersOnMap();
        elements.loadingList.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading dustbins:', error);
        showToast('Failed to load dustbins', 'error');
        elements.loadingList.innerHTML = '<p style="text-align: center; color: #ef4444;">Failed to load dustbins</p>';
    }
}

// Display dustbins in sidebar
function displayDustbins() {
    const filteredDustbins = getFilteredDustbins();
    const listContainer = elements.dustbinList;
    
    // Remove existing items except the title and loading
    const existingItems = listContainer.querySelectorAll('.dustbin-item');
    existingItems.forEach(item => item.remove());
    
    if (filteredDustbins.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No dustbins found</p>';
        listContainer.appendChild(noResults);
        return;
    }
    
    filteredDustbins.forEach(dustbin => {
        const item = createDustbinListItem(dustbin);
        listContainer.appendChild(item);
    });
}

// Create dustbin list item
function createDustbinListItem(dustbin) {
    const item = document.createElement('div');
    item.className = 'dustbin-item';
    item.onclick = () => showDustbinDetails(dustbin);
    
    const fillLevel = getFillLevel(dustbin.fillPercentage);
    const distanceText = dustbin.distance ? `${dustbin.distance.toFixed(1)} km` : '';
    
    item.innerHTML = `
        <div class="dustbin-header">
            <div class="dustbin-name">${dustbin.name}</div>
            <div class="dustbin-distance">${distanceText}</div>
        </div>
        <div class="dustbin-address">${dustbin.address}</div>
        <div class="fill-level">
            <div class="fill-bar">
                <div class="fill-progress ${fillLevel.class}" style="width: ${dustbin.fillPercentage}%"></div>
            </div>
            <div class="fill-text">${dustbin.fillPercentage}%</div>
        </div>
    `;
    
    return item;
}

// Display markers on map
function displayMarkersOnMap() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    const filteredDustbins = getFilteredDustbins();
    
    filteredDustbins.forEach(dustbin => {
        const fillLevel = getFillLevel(dustbin.fillPercentage);
        
        const marker = new google.maps.Marker({
            position: { lat: dustbin.latitude, lng: dustbin.longitude },
            map: map,
            title: dustbin.name,
            icon: {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createMarkerSVG(fillLevel.color))}`,
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32)
            }
        });
        
        marker.addListener('click', () => {
            showInfoWindow(marker, dustbin);
        });
        
        markers.push(marker);
    });
}

// Create marker SVG
function createMarkerSVG(color) {
    return `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C11.6 2 8 5.6 8 10C8 16 16 30 16 30S24 16 24 10C24 5.6 20.4 2 16 2Z" fill="${color}" stroke="white" stroke-width="2"/>
            <circle cx="16" cy="10" r="4" fill="white"/>
            <path d="M14 8L15 9L18 6" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
}

// Show info window
function showInfoWindow(marker, dustbin) {
    const fillLevel = getFillLevel(dustbin.fillPercentage);
    const distanceText = dustbin.distance ? `<br><strong>Distance:</strong> ${dustbin.distance.toFixed(1)} km` : '';
    
    const content = `
        <div style="max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${dustbin.name}</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${dustbin.address}</p>
            <div style="margin: 8px 0;">
                <strong>Fill Level:</strong> ${dustbin.fillPercentage}%
                <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px; margin-top: 4px;">
                    <div style="width: ${dustbin.fillPercentage}%; height: 100%; background: ${fillLevel.color}; border-radius: 3px;"></div>
                </div>
            </div>
            ${distanceText}
            <div style="margin-top: 12px;">
                <button onclick="showDustbinDetails(${JSON.stringify(dustbin).replace(/"/g, `'`)})" 
                        style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    View Details
                </button>
            </div>
        </div>
    `;
    
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
}

// Show dustbin details modal
function showDustbinDetails(dustbin) {
    const fillLevel = getFillLevel(dustbin.fillPercentage);
    const distanceText = dustbin.distance ? `${dustbin.distance.toFixed(1)} km away` : 'Distance unknown';
    const lastUpdated = new Date(dustbin.lastUpdated).toLocaleString();
    
    elements.modalTitle.textContent = dustbin.name;
    elements.modalContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: #1f2937;">Location</h4>
                <p style="margin: 0; color: #6b7280;">${dustbin.address}</p>
                <p style="margin: 0.25rem 0 0 0; color: #6b7280; font-size: 0.9rem;">${distanceText}</p>
            </div>
            
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: #1f2937;">Fill Level</h4>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px;">
                        <div style="width: ${dustbin.fillPercentage}%; height: 100%; background: ${fillLevel.color}; border-radius: 4px;"></div>
                    </div>
                    <span style="font-weight: 600; color: ${fillLevel.color};">${dustbin.fillPercentage}%</span>
                </div>
                <p style="margin: 0.5rem 0 0 0; color: #6b7280; font-size: 0.9rem;">Status: ${fillLevel.status}</p>
            </div>
            
            <div>
                <h4 style="margin: 0 0 0.5rem 0; color: #1f2937;">Information</h4>
                <p style="margin: 0 0 0.5rem 0; color: #6b7280;"><strong>Type:</strong> ${dustbin.type || 'General Waste'}</p>
                <p style="margin: 0 0 0.5rem 0; color: #6b7280;"><strong>Capacity:</strong> ${dustbin.capacity || 'Standard'}</p>
                <p style="margin: 0; color: #6b7280;"><strong>Last Updated:</strong> ${lastUpdated}</p>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button onclick="getDirections(${dustbin.latitude}, ${dustbin.longitude})" 
                        style="flex: 1; background: #10b981; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-directions" style="margin-right: 0.5rem;"></i>Get Directions
                </button>
                <button onclick="reportIssue('${dustbin.id}')" 
                        style="flex: 1; background: #f97316; color: white; border: none; padding: 0.75rem; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>Report Issue
                </button>
            </div>
        </div>
    `;
    
    elements.modalOverlay.classList.add('active');
}

// Close modal
function closeModal() {
    elements.modalOverlay.classList.remove('active');
}

// Get directions to dustbin
function getDirections(lat, lng) {
    if (userLocation) {
        // Corrected URL: starts with current location
        const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
        window.open(url, '_blank');
    } else {
        // Corrected URL: no starting location, just the destination
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    }
}

// Report issue
function reportIssue(dustbinId) {
    // In a real application, this would send a report to the server
    showToast('Issue reported successfully. Thank you for your feedback!', 'success');
    closeModal();
}

// Filter dustbins based on search and checkboxes
function filterDustbins() {
    displayDustbins();
    displayMarkersOnMap();
}

// Get filtered dustbins
function getFilteredDustbins() {
    let filtered = dustbins;
    
    // Filter by search term
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filtered = filtered.filter(dustbin => 
            dustbin.name.toLowerCase().includes(searchTerm) ||
            dustbin.address.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by fill level
    const activeFilters = [];
    if (elements.filterEmpty.checked) activeFilters.push('empty');
    if (elements.filterLow.checked) activeFilters.push('low');
    if (elements.filterMedium.checked) activeFilters.push('medium');
    if (elements.filterHigh.checked) activeFilters.push('high');
    
    if (activeFilters.length > 0) {
        filtered = filtered.filter(dustbin => {
            const level = getFillLevel(dustbin.fillPercentage).class;
            return activeFilters.includes(level);
        });
    }
    
    return filtered;
}

// Get fill level information
function getFillLevel(percentage) {
    if (percentage <= 25) {
        return { class: 'empty', color: '#10b981', status: 'Empty' };
    } else if (percentage <= 50) {
        return { class: 'low', color: '#f59e0b', status: 'Low' };
    } else if (percentage <= 75) {
        return { class: 'medium', color: '#f97316', status: 'Medium' };
    } else {
        return { class: 'high', color: '#ef4444', status: 'High' };
    }
}

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update location status
function updateLocationStatus(message) {
    elements.locationStatus.innerHTML = `<i class="fas fa-location-dot"></i><span>${message}</span>`;
}

// Refresh data
function refreshData() {
    elements.refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Refresh';
    elements.loadingList.style.display = 'flex';
    
    loadDustbins().finally(() => {
        elements.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>Refresh';
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Debounce function
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

// Make functions globally available for onclick handlers
window.showDustbinDetails = showDustbinDetails;
window.getDirections = getDirections;
window.reportIssue = reportIssue;