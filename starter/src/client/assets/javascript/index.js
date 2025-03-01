// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
	track_id: undefined,
	track_name: undefined,
	player_id: undefined,
	player_name: undefined,
	race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

async function onPageLoad() {
	console.log("Getting form info for dropdowns!");
	try {
		const tracks = await getTracks();
		const racers = await getRacers();
		renderAt("#tracks", renderTrackCards(tracks));
		renderAt("#racers", renderRacerCars(racers));
	} catch (error) {
		console.error("Problem getting tracks and racers:", error);
	}
}

function setupClickHandlers() {
	document.addEventListener(
		"click",
		function (event) {
			const { target } = event;

			// Race track form field
			if (target.matches(".card.track")) {
				handleSelectTrack(target);
				store.track_id = target.id;
				store.track_name = target.innerHTML;
			}

			// Racer form field
			if (target.matches(".card.racer")) {
				handleSelectRacer(target);
				store.player_id = target.id;
				store.player_name = target.innerHTML;
			}

			// Submit create race form
			if (target.matches("#submit-create-race")) {
				event.preventDefault();
				handleCreateRace();
			}

			// Handle acceleration click
			if (target.matches("#gas-peddle")) {
				handleAccelerate();
			}

			console.log("Store updated:", store);
		},
		false
	);
}

async function delay(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}

// ^ PROVIDED CODE ^ DO NOT REMOVE

// BELOW THIS LINE IS CODE WHERE STUDENT EDITS ARE NEEDED ----------------------------

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try {
		console.log("in create race");

		// Render starting UI
		renderAt("#race", renderRaceStartView());

		// Get player_id and track_id from the store
		const { player_id, track_id } = store;

		// Call the asynchronous method createRace, passing the correct parameters
		const race = await createRace(player_id, track_id);

		// Update the store with the race id in the response
		console.log("RACE:", race);
		store.race_id = race.id; // Use race.id instead of race.ID

		// The race has been created, now start the countdown
		await runCountdown();

		// Start the race
		console.log("Starting race with ID:", store.race_id);
		await startRace(store.race_id);

		// Run the race
		await runRace(store.race_id);
	} catch (error) {
		console.error("Error in handleCreateRace:", error);
		renderAt("#race", "<h2>Race Failed to Start</h2>");
	}
}

function runRace(raceID) {
	return new Promise((resolve, reject) => {
		// Use setInterval to get race info every 500ms
		const raceInterval = setInterval(async () => {
			try {
				const res = await getRace(raceID);

				// If the race is in progress, update the leaderboard
				if (res.status === "in-progress") {
					renderAt("#leaderBoard", raceProgress(res.positions));
				}

				// If the race is finished, stop the interval and render results
				if (res.status === "finished") {
					clearInterval(raceInterval); // Stop the interval
					renderAt("#race", resultsView(res.positions)); // Render results
					resolve(res); // Resolve the promise
				}
			} catch (error) {
				clearInterval(raceInterval); // Stop the interval on error
				reject(error); // Reject the promise
			}
		}, 500);
	});
}

async function runCountdown() {
	try {
		// Wait for the DOM to load
		await delay(1000);
		let timer = 3;

		return new Promise((resolve) => {
			// Use setInterval to count down once per second
			const countdownInterval = setInterval(() => {
				// Update the DOM with the current countdown value
				document.getElementById("big-numbers").innerHTML = --timer;

				// When the timer hits 0, clear the interval and resolve the promise
				if (timer === 0) {
					clearInterval(countdownInterval);
					resolve();
				}
			}, 1000);
		});
	} catch (error) {
		console.error("Error in runCountdown:", error);
		throw error;
	}
}

function handleSelectRacer(target) {
	console.log("selected a racer", target.id);

	// Remove class selected from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// Add class selected to current target
	target.classList.add("selected");
}

function handleSelectTrack(target) {
	console.log("selected track", target.id);

	// Remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// Add class selected to current target
	target.classList.add("selected");
}

function handleAccelerate() {
	console.log("accelerate button clicked");

	if (!store.race_id) {
		console.error("No active race");
		return;
	}

	// Invoke the API call to accelerate
	accelerate(store.race_id)
		.then(() => console.log("Accelerated!"))
		.catch((err) => console.error("Error accelerating:", err));
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join("");

	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name } = racer;
	return `<h4 class="card racer" id="${id}">${driver_name}</h4>`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;
	return `<h4 id="${id}" class="card track">${name}</h4>`;
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView() {
	return `
		<header>
			<h1>Race: ${store.track_name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	let count = 1;

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<h3>Race Results</h3>
			<p>The race is done! Here are the final results:</p>
			${results.join("")}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	const userPlayer = positions.find((e) => e.id === parseInt(store.player_id));
	userPlayer.driver_name += " (you)";

	positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
	let count = 1;

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<table>
			${results.join("")}
		</table>
	`;
}

function renderAt(element, html) {
	const node = document.querySelector(element);
	node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:3001";

function defaultFetchOpts() {
	return {
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
}

// Fetch tracks
function getTracks() {
	return fetch(`${SERVER}/api/tracks`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with getTracks request:", err);
			throw err;
		});
}

// Fetch racers
function getRacers() {
	return fetch(`${SERVER}/api/cars`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with getRacers request:", err);
			throw err;
		});
}

// Create a race
function createRace(player_id, track_id) {
	const body = { player_id: parseInt(player_id), track_id: parseInt(track_id) };

	return fetch(`${SERVER}/api/races`, {
		method: "POST",
		...defaultFetchOpts(),
		body: JSON.stringify(body),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with createRace request:", err);
			throw err;
		});
}

// Get race status
function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`, {
		method: "GET",
		...defaultFetchOpts(),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with getRace request:", err);
			throw err;
		});
}

// Start a race
function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: "POST",
		...defaultFetchOpts(),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with startRace request:", err);
			throw err;
		});
}

// Accelerate a car
function accelerate(id) {
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: "POST",
		...defaultFetchOpts(),
	})
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}
			return res.json();
		})
		.catch((err) => {
			console.error("Problem with accelerate request:", err);
			throw err;
		});
}