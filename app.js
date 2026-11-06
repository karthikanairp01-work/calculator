const GEOAPIFY_KEY = "734a9afc29864d52ad71ee7bae4c9521";

const ORIGIN = {
    lat: 49.8751544,
    lon: -97.0739435
};

const VEHICLE = {
    labourRate: 30.01,
    fuelConsumption: 38,
    costPerKm: 1.12
};

let dieselPrice = 0;
let fuelUpdated = "";

async function loadFuelPrice() {

    try {

        const response =
            await fetch("./config.json");

        const data =
            await response.json();

        dieselPrice =
            Number(data.dieselPrice);

        fuelUpdated =
            data.updated;

    } catch(error){

        console.error(
            "Unable to load config.json",
            error
        );
    }
}

loadFuelPrice();

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

document
.getElementById("calculateBtn")
.addEventListener(
    "click",
    calculateTrip
);

function formatHours(hours){

    const h =
        Math.floor(hours);

    const m =
        Math.round(
            (hours - h) * 60
        );

    if(h === 0){

        return `${m}m`;
    }

    return `${h}h ${m}m`;
}

async function calculateTrip(){

    if(!dieselPrice){

        alert(
            "Fuel price unavailable. Please refresh the page."
        );

        return;
    }

    const address =
        addressInput.value.trim();

    if(!address){

        alert(
            "Please enter a delivery address."
        );

        return;
    }

    const crewSize =
        Number(
            document.querySelector(
                'input[name="crewSize"]:checked'
            ).value
        );

    try{

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

        const totalDistance =
            oneWayDistance * 2;

        const totalTime =
            oneWayTime * 2;

        const labourCost =
            totalTime *
            VEHICLE.labourRate *
            crewSize;

        const fuelCost =
            (
                totalDistance / 100
            )
            *
            VEHICLE.fuelConsumption
            *
            dieselPrice;

        const vehicleCost =
            VEHICLE.costPerKm *
            totalDistance;

        const totalCost =
            labourCost +
            fuelCost +
            vehicleCost;

        const roundedCost =
            Math.round(totalCost / 5) * 5;

        document.getElementById(
            "results"
        ).innerHTML = `

<div class="metrics">

    <div class="metric">
        <div class="metric-title">
            Distance
        </div>

        <div class="metric-value">
            ${totalDistance.toFixed(2)} KM
        </div>
    </div>

    <div class="metric">
        <div class="metric-title">
            Travel Time
        </div>

        <div class="metric-value">
            ${formatHours(totalTime)}
        </div>
    </div>

    <div class="metric">
        <div class="metric-title">
            Crew
        </div>

        <div class="metric-value">
            ${crewSize}
        </div>
    </div>

    <div class="metric">
        <div class="metric-title">
            Diesel
        </div>

        <div class="metric-value">
            $${dieselPrice.toFixed(3)}
        </div>
    </div>

</div>

<div class="summary-card">

    <h3>Delivery Summary</h3>

    <div class="summary-row">
        <span>Origin Yard</span>
        <span>16 Speers Road</span>
    </div>

    <div class="summary-row">
        <span>Destination</span>
        <span>${address}</span>
    </div>

    <div class="summary-row">
        <span>Fuel Updated</span>
        <span>${fuelUpdated}</span>
    </div>

</div>

<div class="rounded">

    <div class="quote-label">
        Estimated Delivery Charge
    </div>

    <div class="amount">
        $${roundedCost.toFixed(0)}
    </div>

</div>

`;

    } catch(error){

        console.error(error);

        alert(
            "Unable to calculate route."
        );
    }
}