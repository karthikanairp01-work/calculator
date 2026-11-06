const GEOAPIFY_KEY = "YOUR_API_KEY";

const VEHICLE = {

    labourRate: 30.01,

    fuelConsumption: 38,

    annualKm: 236538,

    depreciation: 168040.11,

    insurance: 31700.23,

    maintenance: 65478.27
};

// 16 Speers Road
const ORIGIN = {
    lat: 49.8751544,
    lon: -97.0739435
};

let dieselPrice = 0;

async function loadFuelPrice() {

    const response =
        await fetch("./config.json");

    const data =
        await response.json();

    dieselPrice =
        data.dieselPrice;

    console.log(
        "Diesel Price:",
        dieselPrice
    );
}