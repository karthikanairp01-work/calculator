const GEOAPIFY_KEY = "734a9afc29864d52ad71ee7bae4c9521";

const ORIGIN = {
    lat: 49.8751544,
    lon: -97.0739435
};

// Truck Data
const VEHICLE = {

    labourRate: 30.01,

    fuelConsumption: 38,

    annualKm: 236538,

    depreciation: 168040.11,

    insurance: 31700.23,

    maintenance: 65478.27
};

let dieselPrice = 0;

// ------------------------
// Load Fuel Price
// ------------------------

async function loadFuelPrice() {

    const response =
        await fetch("./config.json");

    const data =
        await response.json();

    dieselPrice =
        data.dieselPrice;
}

loadFuelPrice();

// ------------------------
// Address Suggestions
// ------------------------

const addressInput =
    document.getElementById("destination");

const suggestions =
    document.getElementById("suggestions");

addressInput.addEventListener(
    "input",
    async () => {

        const query =
            addressInput.value.trim();

        if(query.length < 3){

            suggestions.innerHTML = "";
            return;
        }

        const response =
            await fetch(
                `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:ca&limit=5&apiKey=${GEOAPIFY_KEY}`
            );

        const data =
            await response.json();

        suggestions.innerHTML = "";

        data.features.forEach(feature => {

            const div =
                document.createElement("div");

            div.className =
                "suggestion";

            div.textContent =
                feature.properties.formatted;

            div.onclick = () => {

                addressInput.value =
                    feature.properties.formatted;

                suggestions.innerHTML = "";
            };

            suggestions.appendChild(div);
        });
    }
);

// ------------------------
// Calculate Button
// ------------------------

document
.getElementById("calculateBtn")
.addEventListener(
    "click",
    calculateTrip
);

// ------------------------
// Main Calculation
// ------------------------

async function calculateTrip() {

    const address =
        addressInput.value;

    const geoResponse =
        await fetch(
            `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_KEY}`
        );

    const geoData =
        await geoResponse.json();

    const coords =
        geoData.features[0]
        .geometry
        .coordinates;

    const destinationLon =
        coords[0];

    const destinationLat =
        coords[1];

    // Route

    const routeResponse =
        await fetch(
            `https://api.geoapify.com/v1/routing?waypoints=${ORIGIN.lat},${ORIGIN.lon}|${destinationLat},${destinationLon}&mode=drive&apiKey=${GEOAPIFY_KEY}`
        );

    const routeData =
        await routeResponse.json();

    const route =
        routeData.features[0]
        .properties;

    const oneWayDistance =
        route.distance / 1000;

    const oneWayTime =
        route.time / 3600;

    // Business Rules

    const totalDistance =
        oneWayDistance * 2;

    const totalTime =
        oneWayTime * 2;

    const labourCost =
        totalTime *
        VEHICLE.labourRate;

    const fuelCost =
        (
            totalDistance / 100
        )
        *
        VEHICLE.fuelConsumption
        *
        dieselPrice;

    const vehicleCostPerKm =
        (
            VEHICLE.depreciation +
            VEHICLE.insurance +
            VEHICLE.maintenance
        )
        /
        VEHICLE.annualKm;

    const vehicleCost =
        vehicleCostPerKm *
        totalDistance;

    const totalCost =
        labourCost +
        fuelCost +
        vehicleCost;

    const roundedCost =
        Math.round(totalCost / 5) * 5;

    document.getElementById("results").innerHTML = `
    
    <h3>Results</h3>

    <p><b>One-Way Distance:</b> ${oneWayDistance.toFixed(2)} KM</p>

    <p><b>Total Distance:</b> ${totalDistance.toFixed(2)} KM</p>

    <p><b>One-Way Time:</b> ${oneWayTime.toFixed(2)} Hours</p>

    <p><b>Total Time:</b> ${totalTime.toFixed(2)} Hours</p>

    <p><b>Diesel Price:</b> $${dieselPrice.toFixed(3)}</p>

    <p><b>Labour Cost:</b> $${labourCost.toFixed(2)}</p>

    <p><b>Fuel Cost:</b> $${fuelCost.toFixed(2)}</p>

    <p><b>Vehicle Cost:</b> $${vehicleCost.toFixed(2)}</p>

    <p><b>Total Cost:</b> $${totalCost.toFixed(2)}</p>

    <h2>Rounded Cost: $${roundedCost.toFixed(2)}</h2>
    
    `;
}