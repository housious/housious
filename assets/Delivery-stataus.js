

console.log("Delivery Status JS Loaded");


document.addEventListener("DOMContentLoaded", function () {

const dateSpan = document.getElementById("delivery-expected-date");
const locationSpan = document.getElementById("delivery-city-zip");
const changeBtn = document.getElementById("change-location-btn");
const inputContainer = document.getElementById("pincode-input-container");
const applyBtn = document.getElementById("apply-pincode-btn");
const manualPincodeInput = document.getElementById("manual-pincode");

if (!dateSpan || !locationSpan) return;

function formatDate(days) {
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


const date = new Date();
date.setDate(date.getDate() + days);

return `${date.getDate()} ${months[date.getMonth()]}`;


}

function updateDeliveryETA(state) {


let minDays = 4;
let maxDays = 6;

if (state && state.toLowerCase().includes("gujarat")) {
  minDays = 2;
  maxDays = 3;
}

dateSpan.textContent =
  `${formatDate(minDays)} - ${formatDate(maxDays)}`;

}

function checkPincode(pin) {

  console.log("Checking Pincode:", pin);

  fetch(`https://api.postalpincode.in/pincode/${pin}`)
    .then((res) => res.json())
    .then((data) => {

      if (
        !data ||
        !data[0] ||
        data[0].Status !== "Success"
      ) {
        throw new Error("Invalid pincode");
      }

      const postOffice = data[0].PostOffice[0];

      const city = postOffice.District || "";
      const state = postOffice.State || "";

      locationSpan.textContent =
        `${city}, ${state} - ${pin}`;

      updateDeliveryETA(state);

      // localStorage.setItem(
      //   "user_delivery_pincode",
      //   pin
      // );

    })
    .catch((err) => {

      console.error(err);

      locationSpan.textContent =
        "Invalid Pincode";

      dateSpan.textContent = "--";

    });

}
function detectLocation() {

  // const savedPin = localStorage.getItem("user_delivery_pincode");

  // if (savedPin) {
  //   checkPincode(savedPin);
  //   return;
  // }

  fetch("https://ipapi.co/json/")
    .then((res) => res.json())
    .then((data) => {

      console.log("IP API Response:", data);

      if (data.postal) {

        // localStorage.setItem(
        //   "user_delivery_pincode",
        //   data.postal
        // );

        checkPincode(data.postal);

      } else {

        locationSpan.textContent = "Enter Pincode";

      }

    })
    .catch(() => {

      locationSpan.textContent = "Enter Pincode";

    });

}

if (changeBtn) {


changeBtn.addEventListener("click", () => {

  inputContainer.style.display =
    inputContainer.style.display === "none"
      ? "block"
      : "none";

});


}

if (applyBtn) {


applyBtn.addEventListener("click", () => {

  const pin =
    manualPincodeInput.value.trim();

  if (!/^\d{6}$/.test(pin)) {

    alert(
      "Please enter valid 6 digit pincode"
    );

    return;
  }

  checkPincode(pin);

  inputContainer.style.display = "none";

});


}

function startCountdown() {


const timer =
  document.getElementById(
    "countdown-timer"
  );

if (!timer) return;

const now = new Date();

const hours =
  23 - now.getHours();

const minutes =
  59 - now.getMinutes();

timer.textContent =
  `${hours}h ${minutes}m`;


}

detectLocation();
startCountdown();

setInterval(
startCountdown,
60000
);

});
