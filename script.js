// Import the functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import the database module 

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9HNUVqKfU5A8Iuias2vyVEbOdxO_byB8",
    authDomain: "underscore-tracker.firebaseapp.com",
    databaseURL: "https://underscore-tracker-default-rtdb.firebaseio.com",
    projectId: "underscore-tracker",
    storageBucket: "underscore-tracker.firebasestorage.app",
    messagingSenderId: "846352298994",
    appId: "1:846352298994:web:eca11254b2d1edc340b16b",
    measurementId: "G-65F9KHVGEN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Initialize the Realtime Database 

// Variables to store data
let bets = [];
let totalProfit = 0;

// Load bets from Firebase
const loadBets = () => {
    database.ref("bets").on("value", (snapshot) => {
        bets = snapshot.val() || [];
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
            <input type="date" value="${bet.date}">
            <input type="text" value="${bet.type}" placeholder="Bet Type">
            <input type="text" value="${bet.bookmaker}" placeholder="Bookmaker">
            <input type="text" value="${bet.runner}" placeholder="Runner/Player">
            <input type="number" value="${bet.odds}" placeholder="Odds">
            <input type="number" value="${bet.stake}" placeholder="Stake">
            <select>
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
        date: "",
        type: "",
        bookmaker: "",
        runner: "",
        odds: "",
        stake: "",
        result: "Win",
        profit: 0
    });
    renderBets();
};

// Save changes to Firebase
const saveChanges = () => {
    database.ref("bets").set(bets);
    alert("Changes saved!");
};

// Calculate profits
const calculateProfits = () => {
    let todayProfit = 0;
    let thisMonthProfit = 0;
    let lastMonthProfit = 0;
    totalProfit = 0;

    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    bets.forEach(bet => {
        const betDate = new Date(bet.date);
        const profit = parseFloat(bet.profit) || 0;
        totalProfit += profit;

        // Calculate today’s profit
        if (betDate.toDateString() === today.toDateString()) {
            todayProfit += profit;
        }

        // Calculate this month’s profit
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

    new Chart(ctx, {
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
