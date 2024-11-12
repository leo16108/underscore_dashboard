// Import Firebase functions from the SDK
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database"; // Import necessary database functions
import { Chart } from "chart.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase and Database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Variables to store data
let bets = [];
let totalProfit = 0;

// Load bets from Firebase
const loadBets = () => {
    const betsRef = ref(database, "bets");
    onValue(betsRef, (snapshot) => {
        bets = snapshot.val() ? Object.values(snapshot.val()) : [];
        renderBets();
        calculateProfits();
        renderCumulativeChart();
    });
};

// Render bets to the DOM
const renderBets = () => {
    const betsList = document.getElementById("bets-list");
    betsList.innerHTML = ""; // Clear existing bets

    bets.forEach((bet, index) => {
        const betElement = document.createElement("div");
        betElement.classList.add("bet-entry");
        betElement.innerHTML = `
            <input type="date" value="${bet.date}" onchange="updateBet(${index}, 'date', this.value)">
            <input type="text" value="${bet.type}" placeholder="Bet Type" onchange="updateBet(${index}, 'type', this.value)">
            <input type="text" value="${bet.bookmaker}" placeholder="Bookmaker" onchange="updateBet(${index}, 'bookmaker', this.value)">
            <input type="text" value="${bet.runner}" placeholder="Runner/Player" onchange="updateBet(${index}, 'runner', this.value)">
            <input type="number" value="${bet.odds}" placeholder="Odds" onchange="updateBet(${index}, 'odds', parseFloat(this.value))">
            <input type="number" value="${bet.stake}" placeholder="Stake" onchange="updateBet(${index}, 'stake', parseFloat(this.value))">
            <select onchange="updateBet(${index}, 'result', this.value)">
                <option value="Win" ${bet.result === "Win" ? "selected" : ""}>Win</option>
                <option value="Loss" ${bet.result === "Loss" ? "selected" : ""}>Loss</option>
            </select>
            <span>Profit/Loss: $${bet.profit}</span>
            <button onclick="deleteBet(${index})">Delete</button>
        `;
        betsList.appendChild(betElement);
    });
};

// Add a new bet entry
const addBet = () => {
    bets.push({
        date: new Date().toISOString().split("T")[0], // Default to today's date
        type: "",
        bookmaker: "",
        runner: "",
        odds: 0,
        stake: 0,
        result: "Win",
        profit: 0
    });
    renderBets();
};

// Update a specific bet's property
window.updateBet = (index, property, value) => {
    bets[index][property] = value;
    if (property === 'odds' || property === 'stake' || property === 'result') {
        bets[index].profit = calculateProfit(bets[index].odds, bets[index].stake, bets[index].result);
    }
    saveChanges();
    calculateProfits();
    renderCumulativeChart();
};

// Save changes to Firebase
const saveChanges = () => {
    set(ref(database, "bets"), bets);
};

// Calculate profit based on bet result
const calculateProfit = (odds, stake, result) => {
    if (result === "Win") {
        return (odds - 1) * stake;
    }
    return -stake; // Loss equals negative stake
};

// Calculate profits for different periods
const calculateProfits = () => {
    let todayProfit = 0;
    let thisMonthProfit = 0;
    let totalProfit = 0;

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    bets.forEach(bet => {
        const betDate = new Date(bet.date);
        const profit = parseFloat(bet.profit) || 0;
        totalProfit += profit;

        if (betDate.toDateString() === today.toDateString()) {
            todayProfit += profit;
        }

        if (betDate.getMonth() === thisMonth && betDate.getFullYear() === thisYear) {
            thisMonthProfit += profit;
        }
    });

    document.getElementById("today-profit").textContent = todayProfit.toFixed(2);
    document.getElementById("this-month-profit").textContent = thisMonthProfit.toFixed(2);
    document.getElementById("total-profit").textContent = totalProfit.toFixed(2);
};

// Render cumulative profit chart
const renderCumulativeChart = () => {
    const ctx = document.getElementById("cumulativeChart").getContext("2d");

    const dates = bets.map(bet => bet.date);
    const cumulativeProfits = bets.reduce((acc, bet) => {
        const lastProfit = acc.length ? acc[acc.length - 1] : 0;
        acc.push(lastProfit + parseFloat(bet.profit || 0));
        return acc;
    }, []);

    if (window.cumulativeChart) {
        window.cumulativeChart.destroy(); // Destroy previous chart instance if it exists
    }

    window.cumulativeChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dates,
            datasets: [{
                label: "Cumulative Profit",
                data: cumulativeProfits,
                borderColor: "blue",
                fill: false
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Profit ($)" } }
            }
        }
    });
};

// Delete a bet
const deleteBet = (index) => {
    bets.splice(index, 1);
    saveChanges();
    renderBets();
    calculateProfits();
    renderCumulativeChart();
};

// Load initial data
loadBets();
