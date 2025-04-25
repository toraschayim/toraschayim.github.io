// --- Constants ---
// No API Keys or URLs needed

// --- Local City Database ---
const citiesDB = {
    // Key: lowercase city name for easy lookup
    // Value: object with latitude, longitude, and IANA timezoneId
    'toronto':   { lat: 43.7167, lon: -79.4333, timezoneId: 'America/Toronto' },
    'jerusalem': { lat: 31.77509, lon: 35.23269, timezoneId: 'Asia/Jerusalem' },
    'lakewood':  { lat: 40.0721087, lon: -74.2400243, timezoneId: 'America/New_York' },
    'frankfurt': { lat: 50.110924, lon: 8.682127, timezoneId: 'Europe/Berlin' }
    // Add more cities here manually as needed
    // 'london': { lat: 51.5074, lon: -0.1278, timezoneId: 'Europe/London'},
};

// --- Default Values ---
const DEFAULT_CITY_KEY = "toronto"; // Use the key from citiesDB
const DEFAULT_DUSK_ANGLE = 5.0;

// --- DOM Elements ---
const calculationForm = document.getElementById('calculationForm');
const citySelect = document.getElementById('citySelect'); // Added select reference
const dateInput = document.getElementById('dateInput');
const duskAngleInput = document.getElementById('duskAngleInput');
const calculateBtn = document.getElementById('calculateBtn');
const clearBtn = document.getElementById('clearBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorDisplay = document.getElementById('errorDisplay');
const resultsCard = document.getElementById('resultsCard');
const resultLocation = document.getElementById('resultLocation');
const resultDate = document.getElementById('resultDate');
const resultSunrise = document.getElementById('resultSunrise');
const resultSolarNoon = document.getElementById('resultSolarNoon');
const resultSunset = document.getElementById('resultSunset');
const resultDusk = document.getElementById('resultDusk');
const resultDuskAngle = document.getElementById('resultDuskAngle');
const resultTimezone = document.getElementById('resultTimezone');
const resultLatLon = document.getElementById('resultLatLon');

// --- City Selector Population ---
function populateCitySelector() {
    citySelect.innerHTML = ''; // Clear existing options
    for (const key in citiesDB) {
        if (Object.hasOwnProperty.call(citiesDB, key)) {
            const option = document.createElement('option');
            option.value = key; // e.g., 'toronto'
            option.textContent = key.charAt(0).toUpperCase() + key.slice(1); // e.g., 'Toronto'
            citySelect.appendChild(option);
        }
    }
}

// --- Initial Setup ---
function setDefaults() {
    populateCitySelector(); // Populate dropdown first
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    citySelect.value = DEFAULT_CITY_KEY; // Set dropdown value
    duskAngleInput.value = DEFAULT_DUSK_ANGLE;
}

// --- Event Listeners ---
calculationForm.addEventListener('submit', handleCalculate);
clearBtn.addEventListener('click', clearUI);

// --- UI Update Functions ---
function showLoading(isLoading) {
    loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    calculateBtn.disabled = isLoading;
}
function hideError() {
    errorDisplay.style.display = 'none';
    errorDisplay.textContent = '';
 }
function displayResults(data) {
    resultLocation.textContent = data.location;
    resultDate.textContent = `Date: ${data.date}`;
    resultSunrise.textContent = data.sunrise;
    resultSolarNoon.textContent = data.solarNoon;
    resultSunset.textContent = data.sunset;
    resultDuskAngle.textContent = data.duskAngle;
    resultDusk.textContent = data.dusk;
    resultTimezone.textContent = data.timezoneId;
    resultLatLon.textContent = `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`;
    resultsCard.style.display = 'block';
    hideError();
}
function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
    resultsCard.style.display = 'none';
}
function clearUI() {
    // Reset inputs to default values
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
    citySelect.value = DEFAULT_CITY_KEY; // Reset dropdown to default
    duskAngleInput.value = DEFAULT_DUSK_ANGLE;
    resultsCard.style.display = 'none';
    hideError();
    showLoading(false);
    resultLocation.textContent = '';
    resultDate.textContent = '';
    resultSunrise.textContent = '';
    resultSolarNoon.textContent = '';
    resultSunset.textContent = '';
    resultDusk.textContent = '';
    resultTimezone.textContent = '';
    resultLatLon.textContent = '';
}

// --- Core Calculation Logic ---
function handleCalculate(event) {
    event.preventDefault();
    hideError();
    resultsCard.style.display = 'none';
    showLoading(true);

    const cityKey = citySelect.value; // Get selected value from dropdown
    const dateString = dateInput.value;
    const duskAngle = parseFloat(duskAngleInput.value);

    if (!cityKey) { showError('Please select a city.'); showLoading(false); return; }
    if (!dateString) { showError('Please select a date.'); showLoading(false); return; }
    if (isNaN(duskAngle) || duskAngle < 0 || duskAngle > 90) { showError('Please enter a valid dusk angle (0-90 degrees).'); showLoading(false); return; }

    const cityData = citiesDB[cityKey];
    if (!cityData) {
        showError(`Internal error: Data not found for selected city "${cityKey}".`);
        showLoading(false);
        return;
    }
    const { lat: latitude, lon: longitude, timezoneId } = cityData;
    const locationDisplayName = citySelect.options[citySelect.selectedIndex].text;

    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

        // Perform Solar Calculations (Calls the REVERTED function below)
        const solarTimes = calculateSolarTimes(dateObj, latitude, longitude, duskAngle);

        const formattedResults = formatResults(
            solarTimes, dateString, locationDisplayName,
            duskAngle, timezoneId,
            latitude, longitude
        );
        displayResults(formattedResults);

    } catch (error) {
        console.error("Calculation failed:", error);
        showError(`Calculation Error: ${error.message}. Please check input values.`);
    } finally {
        setTimeout(() => showLoading(false), 100);
    }
}

// --- Formatting ---
function formatResults(solarTimes, dateString, displayCity, duskAngle, timezoneId, latitude, longitude) {
    function formatSingleTime(utcFractionalDay, dateString, tzId) {
        if (isNaN(utcFractionalDay) || utcFractionalDay === null || utcFractionalDay === undefined) { return "N/A"; }
        const [year, month, day] = dateString.split('-').map(Number);
        const baseDateTimestamp = Date.UTC(year, month - 1, day, 0, 0, 0);
        const eventTimestampUTC = baseDateTimestamp + (utcFractionalDay * 24 * 60 * 60 * 1000);
        const eventDateUTC = new Date(eventTimestampUTC);
        try {
            return new Intl.DateTimeFormat('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: tzId
            }).format(eventDateUTC);
        } catch (e) { console.error(`Error formatting date for timezone ${tzId}:`, e); return "TZ Error"; }
    }
    return {
        location: displayCity, date: dateString,
        sunrise: formatSingleTime(solarTimes.sunriseUTC, dateString, timezoneId),
        solarNoon: formatSingleTime(solarTimes.solarNoonUTC, dateString, timezoneId),
        sunset: formatSingleTime(solarTimes.sunsetUTC, dateString, timezoneId),
        duskAngle: duskAngle.toFixed(1),
        dusk: formatSingleTime(solarTimes.duskUTC, dateString, timezoneId),
        timezoneId: timezoneId, latitude: latitude, longitude: longitude
    };
}

// --- NOAA Solar Calculation Implementation ---
function degToRad(degrees) { return degrees * (Math.PI / 180); }
function radToDeg(radians) { return radians * (180 / Math.PI); }

// ***** calculateSolarTimes function - Using JC based on Noon UTC JD relative to J2000 *****
// ***** This version produced the 06:19:46, 13:15:49, 20:11:52 results *****
function calculateSolarTimes(dateObj, latitude, longitude, duskAngleDegrees) {
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1;
    const day = dateObj.getUTCDate();

    // Calculate Julian Day for noon UTC of the given date
    const M = month <= 2 ? month + 12 : month;
    const Y = month <= 2 ? year - 1 : year;
    const A = Math.floor(Y / 100);
    const B = 2 - A + Math.floor(A / 4);
    const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5 + 0.5; // JD for noon UT

    // Calculate Julian Century based DIRECTLY on the J2000.0 epoch (JD 2451545.0)
    const JC = (JD - 2451545.0) / 36525.0;

    // --- Solar Position Calculations (using JC from noon UTC JD) ---
    const L = (280.46646 + JC * (36000.76983 + JC * 0.0003032)) % 360;
    const G = 357.52911 + JC * (35999.05029 - 0.0001537 * JC);
    const e = 0.016708634 - JC * (0.000042037 + 0.0000001267 * JC);
    const C = Math.sin(degToRad(G)) * (1.914602 - JC * (0.004817 + 0.000014 * JC)) +
              Math.sin(degToRad(2 * G)) * (0.019993 - 0.000101 * JC) +
              Math.sin(degToRad(3 * G)) * 0.000289;
    const true_long = L + C;
    const omega = true_long - 0.00569 - 0.00478 * Math.sin(degToRad(125.04 - 1934.136 * JC));
    const epsilon0 = 23.0 + (26.0 + ((21.448 - JC * (46.8150 + JC * (0.00059 - JC * 0.001813)))) / 60.0) / 60.0;
    const epsilon = epsilon0 + 0.00256 * Math.cos(degToRad(125.04 - 1934.136 * JC));
    const delta = radToDeg(Math.asin(Math.sin(degToRad(epsilon)) * Math.sin(degToRad(omega))));
    const y = Math.tan(degToRad(epsilon / 2)) * Math.tan(degToRad(epsilon / 2));
    const eq_time = 4 * radToDeg(y * Math.sin(2 * degToRad(L)) - 2 * e * Math.sin(degToRad(G)) +
                    4 * e * y * Math.sin(degToRad(G)) * Math.cos(2 * degToRad(L)) -
                    0.5 * y * y * Math.sin(4 * degToRad(L)) - 1.25 * e * e * Math.sin(2 * degToRad(G)));

    // --- Hour Angle Calculation ---
    const zenith_official = 90.833;
    const zenith_dusk = 90.0 + duskAngleDegrees;
    function calculateHourAngle(zenith) {
        const cos_delta = Math.cos(degToRad(delta));
        const cos_lat = Math.cos(degToRad(latitude));
        const denominator = cos_lat * cos_delta;
        if (Math.abs(denominator) < 1e-10) {
             const sin_alt_limit = Math.sin(degToRad(latitude)) * Math.sin(degToRad(delta));
             const cos_zenith = Math.cos(degToRad(zenith));
             if (cos_zenith <= sin_alt_limit) return null; else return null;
        }
        const cos_h = (Math.cos(degToRad(zenith)) - Math.sin(degToRad(latitude)) * Math.sin(degToRad(delta))) / denominator;
        if (cos_h > 1.0) return null; if (cos_h < -1.0) return null;
        return radToDeg(Math.acos(cos_h));
    }
    const ha_sunrise = calculateHourAngle(zenith_official);
    const ha_dusk = calculateHourAngle(zenith_dusk);

    // --- UTC Time Calculation ---
    function normalizeUTCFraction(fraction) { return (fraction % 1 + 1) % 1; }
    const noonUTC_raw = 0.5 - (longitude / 360.0) - (eq_time / 1440.0);
    const noonUTC = normalizeUTCFraction(noonUTC_raw);
    let sunriseUTC = NaN; if (ha_sunrise !== null) { sunriseUTC = normalizeUTCFraction(noonUTC - (ha_sunrise / 360.0)); }
    let sunsetUTC = NaN; if (ha_sunrise !== null) { sunsetUTC = normalizeUTCFraction(noonUTC + (ha_sunrise / 360.0)); }
    let duskUTC = NaN; if (ha_dusk !== null) { duskUTC = normalizeUTCFraction(noonUTC + (ha_dusk / 360.0)); }
    // Polar Night Check
    if (ha_sunrise === null) {
        const noon_altitude_rad = Math.asin(Math.sin(degToRad(latitude)) * Math.sin(degToRad(delta)) + Math.cos(degToRad(latitude)) * Math.cos(degToRad(delta)) * Math.cos(0));
        const noon_altitude_deg = radToDeg(noon_altitude_rad);
        if (noon_altitude_deg <= -0.833) { duskUTC = NaN; }
    }

    return {
        solarNoonUTC: noonUTC,
        sunriseUTC: sunriseUTC,
        sunsetUTC: sunsetUTC,
        duskUTC: duskUTC
    };
}

// --- Initial Call ---
setDefaults(); // Populate selector and set defaults on page load