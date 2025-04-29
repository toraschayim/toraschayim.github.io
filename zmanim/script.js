// --- Constants ---
const J2000_EPOCH = 2451545.0; // Julian Day for J2000.0 (2000-01-01 12:00:00 UTC)
const ZENITH_OFFICIAL = 90 + (50 / 60); // 90 degrees 50 minutes = 90.83333...

// --- Local City Database ---
const citiesDB = {
    // Key: lowercase city name (or simple key) for easy lookup
    // Value: object with latitude, longitude, and IANA timezoneId
    // --- Sorted Alphabetically (in definition, though code sorts dynamically) ---
    'chicago':     { lat: 41.99461, lon: -87.72236, timezoneId: 'America/Chicago' },
    'cleveland':   { lat: 41.594167, lon: -81.483333, timezoneId: 'America/New_York' },
    'frankfurt':   { lat: 50.110924, lon: 8.682127, timezoneId: 'Europe/Berlin' },
    'jerusalem':   { lat: 31.77509, lon: 35.23269, timezoneId: 'Asia/Jerusalem' },
    'lakewood':    { lat: 40.0721087, lon: -74.2400243, timezoneId: 'America/New_York' },
    'london':      { lat: 51.57621, lon: -0.20130, timezoneId: 'Europe/London'},
    'los angeles': { lat: 34.07709, lon: -118.35300, timezoneId: 'America/Los_Angeles'},
    'melbourne':   { lat: -37.89277, lon: 145.01527, timezoneId: 'Australia/Melbourne'},
    'new york':    { lat: 40.605, lon: -73.966389, timezoneId: 'America/New_York'},
    'toronto':     { lat: 43.7167, lon: -79.4333, timezoneId: 'America/Toronto' },
    'vancouver':   { lat: 49.260833, lon: -123.113889, timezoneId: 'America/Vancouver' },
};

// --- Default Values ---
const DEFAULT_CITY_KEY = "toronto"; // Toronto remains the default logical key
const DEFAULT_DUSK_ANGLE = 5.0;
const DEFAULT_DAWN_ANGLE = 16.1; // Added Dawn default

// --- DOM Elements ---
const calculationForm = document.getElementById('calculationForm');
const citySelect = document.getElementById('citySelect');
const dateInput = document.getElementById('dateInput');
const dawnAngleInput = document.getElementById('dawnAngleInput'); // Added Dawn Input
const duskAngleInput = document.getElementById('duskAngleInput');
const calculateBtn = document.getElementById('calculateBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorDisplay = document.getElementById('errorDisplay');
const resultsCard = document.getElementById('resultsCard');
// Result elements
const resultLocation = document.getElementById('resultLocation');
const resultDate = document.getElementById('resultDate');
const resultAlos = document.getElementById('resultAlos'); // Dawn
const resultSunrise = document.getElementById('resultSunrise'); // Netz
const resultSZSGra = document.getElementById('resultSZSGra'); // Sof Zman Shma
const resultSolarNoon = document.getElementById('resultSolarNoon'); // Chatzos
const resultSunset = document.getElementById('resultSunset');
const resultDusk = document.getElementById('resultDusk'); // Tzais
const resultShaasZmanios = document.getElementById('resultShaasZmanios'); // Seasonal Hour
const resultDawnAngle = document.getElementById('resultDawnAngle'); // Span for dawn angle
const resultDuskAngle = document.getElementById('resultDuskAngle'); // Span for dusk angle
const resultTimezone = document.getElementById('resultTimezone');
const resultLatLon = document.getElementById('resultLatLon');


// --- City Selector Population (Corrected) ---
function populateCitySelector() {
    console.log("Populating cities..."); // Debug
    citySelect.innerHTML = ''; // Clear existing options
    const cityKeys = Object.keys(citiesDB);
    cityKeys.sort((a, b) => {
        const nameA = a.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const nameB = b.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return nameA.localeCompare(nameB);
    });
    cityKeys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        citySelect.appendChild(option);
    });
    console.log("Cities populated."); // Debug
}

// --- Initial Setup (Corrected) ---
function setDefaults() {
    console.log("Setting defaults..."); // Debug
    try {
        populateCitySelector(); // Populate sorted dropdown first

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;

        if (citiesDB.hasOwnProperty(DEFAULT_CITY_KEY) && citySelect) {
             citySelect.value = DEFAULT_CITY_KEY;
        } else if (citySelect && citySelect.options.length > 0) {
            citySelect.selectedIndex = 0;
        } else {
            console.warn("City select dropdown or default key not available.");
        }
        dawnAngleInput.value = DEFAULT_DAWN_ANGLE; // Set default dawn angle
        duskAngleInput.value = DEFAULT_DUSK_ANGLE;
        console.log("Defaults set."); // Debug
    } catch (error) {
        console.error("Error during setDefaults:", error);
        showError("Error initializing the page setup. Check console.");
    }
}

// --- Event Listeners ---
// Ensure calculationForm is not null before adding listener
if (calculationForm) {
    calculationForm.addEventListener('submit', handleCalculate);
    console.log("Submit event listener attached to form."); // Debug
} else {
    console.error("Could not find calculation form element!");
    // Attempt to show error even if showError might rely on elements not yet ready
    const errDiv = document.getElementById('errorDisplay');
    if (errDiv) errDiv.textContent = "Initialization Error: Cannot find form.";
}

if (clearBtn) {
    clearBtn.addEventListener('click', clearUI);
    console.log("Click event listener attached to clear button."); // Debug
} else {
    console.error("Could not find clear button element!");
}


// --- UI Update Functions ---
function showLoading(isLoading) {
    if (loadingIndicator) loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    if (calculateBtn) calculateBtn.disabled = isLoading;
}
function hideError() {
    if(errorDisplay) {
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';
    }
 }
function displayResults(data) {
    // Add checks for result elements before setting textContent
    if(resultLocation) resultLocation.textContent = data.location;
    if(resultDate) resultDate.textContent = `Date: ${data.date}`;
    if(resultDawnAngle) resultDawnAngle.textContent = data.dawnAngle; // Update dawn angle display
    if(resultAlos) resultAlos.textContent = data.alos;
    if(resultSunrise) resultSunrise.textContent = data.netz;
    if(resultSZSGra) resultSZSGra.textContent = data.szsGra;
    if(resultSolarNoon) resultSolarNoon.textContent = data.chatzos;
    if(resultSunset) resultSunset.textContent = data.sunset;
    if(resultDuskAngle) resultDuskAngle.textContent = data.duskAngle; // Update dusk angle display
    if(resultDusk) resultDusk.textContent = data.tzais;
    if(resultShaasZmanios) resultShaasZmanios.textContent = data.shaasZmanios;
    if(resultTimezone) resultTimezone.textContent = data.timezoneId;
    if(resultLatLon) resultLatLon.textContent = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
    if(resultsCard) resultsCard.style.display = 'block';
    hideError();
}
function showError(message) {
    if(errorDisplay) {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    }
    if(resultsCard) resultsCard.style.display = 'none';
}
function clearUI() {
    console.log("Clearing UI..."); // Debug
    // Reset inputs to default values
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    if(dateInput) dateInput.value = `${year}-${month}-${day}`;
     if (citySelect && citiesDB.hasOwnProperty(DEFAULT_CITY_KEY)) {
         citySelect.value = DEFAULT_CITY_KEY;
     } else if (citySelect && citySelect.options.length > 0) {
        citySelect.selectedIndex = 0;
     }
    if(dawnAngleInput) dawnAngleInput.value = DEFAULT_DAWN_ANGLE; // Reset dawn angle
    if(duskAngleInput) duskAngleInput.value = DEFAULT_DUSK_ANGLE;
    if(resultsCard) resultsCard.style.display = 'none';
    hideError();
    showLoading(false);
    // Clear all result fields
    if(resultLocation) resultLocation.textContent = '';
    if(resultDate) resultDate.textContent = '';
    if(resultAlos) resultAlos.textContent = '';
    if(resultSunrise) resultSunrise.textContent = '';
    if(resultSZSGra) resultSZSGra.textContent = '';
    if(resultSolarNoon) resultSolarNoon.textContent = '';
    if(resultSunset) resultSunset.textContent = '';
    if(resultDusk) resultDusk.textContent = '';
    if(resultShaasZmanios) resultShaasZmanios.textContent = '';
    if(resultTimezone) resultTimezone.textContent = '';
    if(resultLatLon) resultLatLon.textContent = '';
    console.log("UI Cleared."); // Debug
}

// --- Core Calculation Logic ---
function handleCalculate(event) {
    console.log("handleCalculate started"); // Debug: VERY IMPORTANT
    event.preventDefault(); // Ensure this is called first
    hideError();
    if(resultsCard) resultsCard.style.display = 'none'; // Hide previous results immediately
    showLoading(true); // Show loading indicator immediately

    try { // Wrap core logic in try...catch
        const cityKey = citySelect.value;
        const dateString = dateInput.value;
        const dawnAngle = parseFloat(dawnAngleInput.value);
        const duskAngle = parseFloat(duskAngleInput.value);

        console.log(`Input - CityKey: ${cityKey}, Date: ${dateString}, Dawn Angle: ${dawnAngle}, Dusk Angle: ${duskAngle}`); // Debug

        // --- Input Validation ---
        if (!cityKey) { throw new Error('Please select a city.'); }
        if (!dateString) { throw new Error('Please select a date.'); }
        if (isNaN(dawnAngle) || dawnAngle < 0 || dawnAngle > 90) { throw new Error('Please enter a valid dawn angle (0-90 degrees).'); }
        if (isNaN(duskAngle) || duskAngle < 0 || duskAngle > 90) { throw new Error('Please enter a valid dusk angle (0-90 degrees).'); }

        // 1. Lookup city
        console.log("Looking up city data..."); // Debug
        const cityData = citiesDB[cityKey];
        if (!cityData) { throw new Error(`Internal error: Data not found for selected city "${cityKey}".`); }
        console.log("City data found:", cityData); // Debug
        const { lat: latitude, lon: longitude, timezoneId } = cityData;
        const locationDisplayName = citySelect.options[citySelect.selectedIndex].text;

        // 2. Prepare Date Object
        console.log("Preparing date object..."); // Debug
        const [year, month, day] = dateString.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        console.log("Date object:", dateObj.toISOString()); // Debug

        // 3. Perform Solar Calculations
        console.log("Calculating solar times..."); // Debug
        const solarTimes = calculateSolarTimes(dateObj, latitude, longitude, dawnAngle, duskAngle);
        console.log("Solar times (UTC Fractions):", solarTimes); // Debug

        // 4. Calculate Derived Zmanim
        console.log("Calculating derived Zmanim..."); // Debug
        let shaasZmaniosDurationFraction = NaN;
        let szsGraUTC = NaN;

        if (!isNaN(solarTimes.sunriseUTC) && !isNaN(solarTimes.sunsetUTC)) {
            let daylightDurationFraction = solarTimes.sunsetUTC - solarTimes.sunriseUTC;
            if (daylightDurationFraction < 0) { daylightDurationFraction += 1.0; } // Handle wrap-around
            shaasZmaniosDurationFraction = daylightDurationFraction / 12.0;
            szsGraUTC = normalizeUTCFraction(solarTimes.sunriseUTC + (3.0 * shaasZmaniosDurationFraction));
            console.log(`Shaas Zmanios (Fraction): ${shaasZmaniosDurationFraction}, SZS Gra UTC (Fraction): ${szsGraUTC}`); // Debug
        } else {
            console.warn("Cannot calculate Shaas Zmanios or SZS Gra due to invalid sunrise/sunset.");
        }

        // 5. Format Results
        console.log("Formatting results..."); // Debug
        const formattedResults = formatResults(
            solarTimes, dateString, locationDisplayName,
            dawnAngle, duskAngle, timezoneId, latitude, longitude,
            shaasZmaniosDurationFraction, szsGraUTC
        );
        console.log("Formatted results:", formattedResults); // Debug

        // 6. Display Results
        console.log("Displaying results..."); // Debug
        displayResults(formattedResults);

    } catch (error) {
        // Catch any unexpected errors during calculation/formatting
        console.error("Error during handleCalculate:", error);
        showError(`Calculation Error: ${error.message}. Check console.`);
    } finally {
        // Ensure loading indicator is turned off even if errors occur
        showLoading(false);
        console.log("handleCalculate finished."); // Debug
    }
}

// --- Helper: Format Duration ---
function formatDuration(fractionalDay) {
    if (isNaN(fractionalDay) || fractionalDay === null || fractionalDay === undefined || fractionalDay < 0) {
        return "N/A";
    }
    // Round to nearest second for display
    const totalSeconds = Math.round(fractionalDay * 24 * 60 * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// --- Formatting ---
function formatResults(
    solarTimes, dateString, displayCity,
    dawnAngle, duskAngle, timezoneId, latitude, longitude,
    shaasZmaniosDurationFraction, szsGraUTC
) {
    function formatSingleTime(utcFractionalDay, dateString, tzId) {
        if (isNaN(utcFractionalDay) || utcFractionalDay === null || utcFractionalDay === undefined) { return "N/A"; }
        const [year, month, day] = dateString.split('-').map(Number);
        const baseDateTimestamp = Date.UTC(year, month - 1, day, 0, 0, 0);
        // Clamp fractional day to avoid potential date overflows due to precision issues
        const safeFractionalDay = Math.max(0, Math.min(1, utcFractionalDay));
        const eventTimestampUTC = baseDateTimestamp + (safeFractionalDay * 24 * 60 * 60 * 1000);
        const eventDateUTC = new Date(eventTimestampUTC);
        try {
            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: tzId
            }).format(eventDateUTC);
        } catch (e) { console.error(`Error formatting date for timezone ${tzId}:`, e); return "TZ Error"; }
    }
    return {
        location: displayCity, date: dateString,
        dawnAngle: dawnAngle.toFixed(1),
        alos: formatSingleTime(solarTimes.dawnUTC, dateString, timezoneId),
        netz: formatSingleTime(solarTimes.sunriseUTC, dateString, timezoneId),
        szsGra: formatSingleTime(szsGraUTC, dateString, timezoneId),
        chatzos: formatSingleTime(solarTimes.solarNoonUTC, dateString, timezoneId),
        sunset: formatSingleTime(solarTimes.sunsetUTC, dateString, timezoneId),
        duskAngle: duskAngle.toFixed(1),
        tzais: formatSingleTime(solarTimes.duskUTC, dateString, timezoneId),
        shaasZmanios: formatDuration(shaasZmaniosDurationFraction),
        timezoneId: timezoneId, latitude: latitude, longitude: longitude
    };
}

// --- NOAA Solar Calculation Implementation ---
function degToRad(degrees) { return degrees * (Math.PI / 180); }
function radToDeg(radians) { return radians * (180 / Math.PI); }
function normalizeUTCFraction(fraction) { return (fraction % 1 + 1) % 1; }

// Helper: Calculate hour angle
function calculateHourAngle(declination, latitude, zenith) {
    const decRad = degToRad(declination);
    const latRad = degToRad(latitude);
    const zenRad = degToRad(zenith);
    const cos_delta = Math.cos(decRad);
    const cos_lat = Math.cos(latRad);
    const denominator = cos_lat * cos_delta;
    if (Math.abs(denominator) < 1e-10) {
         const sin_alt_limit = Math.sin(latRad) * Math.sin(decRad);
         const cos_zenith = Math.cos(zenRad);
         // If sun is always above horizon for this event, return null (no crossing)
         // If sun is always below horizon for this event, return null (no crossing)
         if (cos_zenith <= sin_alt_limit) return null; else return null;
    }
    const cos_h = (Math.cos(zenRad) - Math.sin(latRad) * Math.sin(decRad)) / denominator;
    // Check bounds strictly
    if (cos_h > 1.0) return null; // Sun never gets this low (always above)
    if (cos_h < -1.0) return null; // Sun never gets this high (always below)
    return radToDeg(Math.acos(cos_h));
}

// ***** calculateSolarTimes function - Non-Iterative Approach *****
function calculateSolarTimes(dateObj, latitude, longitude, dawnAngleDegrees, duskAngleDegrees) {
    const year = dateObj.getUTCFullYear(); const month = dateObj.getUTCMonth() + 1; const day = dateObj.getUTCDate();
    const M = month <= 2 ? month + 12 : month; const Y = month <= 2 ? year - 1 : year;
    const A = Math.floor(Y / 100); const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5 + 0.5;
    const JC = (JD - J2000_EPOCH) / 36525.0;
    const L = (280.46646 + JC * (36000.76983 + JC * 0.0003032)) % 360;
    const G = 357.52911 + JC * (35999.05029 - 0.0001537 * JC);
    const e = 0.016708634 - JC * (0.000042037 + 0.0000001267 * JC);
    const C = Math.sin(degToRad(G)) * (1.914602 - JC * (0.004817 + 0.000014 * JC)) + Math.sin(degToRad(2 * G)) * (0.019993 - 0.000101 * JC) + Math.sin(degToRad(3 * G)) * 0.000289;
    const true_long = L + C; const omega = true_long - 0.00569 - 0.00478 * Math.sin(degToRad(125.04 - 1934.136 * JC));
    const epsilon0 = 23.0 + (26.0 + ((21.448 - JC * (46.8150 + JC * (0.00059 - JC * 0.001813)))) / 60.0) / 60.0;
    const epsilon = epsilon0 + 0.00256 * Math.cos(degToRad(125.04 - 1934.136 * JC));
    const delta = radToDeg(Math.asin(Math.sin(degToRad(epsilon)) * Math.sin(degToRad(omega))));
    const y = Math.tan(degToRad(epsilon / 2)) * Math.tan(degToRad(epsilon / 2));
    const eq_time = 4 * radToDeg(y * Math.sin(2 * degToRad(L)) - 2 * e * Math.sin(degToRad(G)) + 4 * e * y * Math.sin(degToRad(G)) * Math.cos(2 * degToRad(L)) - 0.5 * y * y * Math.sin(4 * degToRad(L)) - 1.25 * e * e * Math.sin(2 * degToRad(G)));

    const zenith_dawn = 90.0 + dawnAngleDegrees;
    const zenith_dusk = 90.0 + duskAngleDegrees;
    const ha_dawn = calculateHourAngle(delta, latitude, zenith_dawn);
    const ha_sunrise = calculateHourAngle(delta, latitude, ZENITH_OFFICIAL);
    const ha_dusk = calculateHourAngle(delta, latitude, zenith_dusk);

    const noonUTC_raw = 0.5 - (longitude / 360.0) - (eq_time / 1440.0);
    const noonUTC = normalizeUTCFraction(noonUTC_raw);
    let dawnUTC = NaN; if (ha_dawn !== null) { dawnUTC = normalizeUTCFraction(noonUTC - (ha_dawn / 360.0)); }
    let sunriseUTC = NaN; if (ha_sunrise !== null) { sunriseUTC = normalizeUTCFraction(noonUTC - (ha_sunrise / 360.0)); }
    let sunsetUTC = NaN; if (ha_sunrise !== null) { sunsetUTC = normalizeUTCFraction(noonUTC + (ha_sunrise / 360.0)); }
    let duskUTC = NaN; if (ha_dusk !== null) { duskUTC = normalizeUTCFraction(noonUTC + (ha_dusk / 360.0)); }

    if (ha_sunrise === null) {
        const noon_altitude_rad = Math.asin(Math.sin(degToRad(latitude)) * Math.sin(degToRad(delta)) + Math.cos(degToRad(latitude)) * Math.cos(degToRad(delta)) * Math.cos(0));
        const noon_altitude_deg = radToDeg(noon_altitude_rad);
        const horizon_angle = 90.0 - ZENITH_OFFICIAL;
        if (noon_altitude_deg <= horizon_angle) {
             dawnUTC = NaN; sunriseUTC = NaN; sunsetUTC = NaN; duskUTC = NaN;
        } else { // Polar Day
             sunriseUTC = NaN; sunsetUTC = NaN;
             // Dawn/Dusk HA might be null independently if angle isn't reached
             if (ha_dawn === null) dawnUTC = NaN;
             if (ha_dusk === null) duskUTC = NaN;
        }
    }

    return {
        dawnUTC: dawnUTC, solarNoonUTC: noonUTC, sunriseUTC: sunriseUTC, sunsetUTC: sunsetUTC, duskUTC: duskUTC
    };
}

// --- Initial Call ---
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed");
    try {
        setDefaults();
        console.log("Initial defaults set successfully.");
    } catch (error) {
        console.error("Error during initial setup:", error);
        showError("Error initializing the application. Check console.");
    }
});