
const userId = document.getElementById('userData').getAttribute('data-user-id');

function searchPlayers() {
    const playerSearchInput = document.getElementById('playerSearchInput');
    const searchQuery = playerSearchInput.value.trim();

    console.log(searchQuery);
    
    if (!searchQuery) return; // Won't proceed if the search query is empty

    //Clears the input field
    playerSearchInput.value = '';

    const basicDetailsTbody = document.querySelector('.basic-details tbody');
    const statsTbody = document.querySelector('.player-stats tbody');
    const playerDetailsDiv = document.querySelector('.player-details');
    const playerStatsContainer = document.querySelector('.player-stats-container');

    basicDetailsTbody.innerHTML = '';
    statsTbody.innerHTML = '';
    playerDetailsDiv.style.visibility = 'hidden';
    playerStatsContainer.style.visibility = 'hidden';
    
    fetch(`/api/players?name=${searchQuery}`)
    .then(response => response.json())
    .then(players => {
        const playersListContainer = document.getElementById('playersListContainer');
        players.sort((a, b) => (a.nationality || "").localeCompare(b.nationality || ""));
        playersListContainer.innerHTML = ''; 
        
        for(const player of players) {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.setAttribute('data-player-id', player.id);

            const playerName = document.createElement('span');
            playerName.textContent = player.name;
            playerDiv.appendChild(playerName);

            const playerPosition = document.createElement('span');
            playerPosition.textContent = player.position;
            playerDiv.appendChild(playerPosition);

            const playerNationality = document.createElement('span');
            playerNationality.textContent = player.nationality;
            playerDiv.appendChild(playerNationality)

            playerDiv.addEventListener('click', function() {
                const playerId = this.getAttribute('data-player-id');
                fetchPlayerStatistics(playerId);
                playersListContainer.style.display = 'none';
            })
            
            playersListContainer.appendChild(playerDiv);
        }
        console.log(playersListContainer.innerHTML);
        playersListContainer.style.display = 'block';
    })
    .catch(err => {
        console.error('Error fetching players:', err);
    });
}

function fetchPlayerStatistics(playerId) {
    // Fetch player statistics based on the provided playerId
    fetch(`/api/player/${playerId}`)
    .then(response => response.json())
    .then(data => {
        // Check if the data.api and data.api.players exist and if player is an array containing data
        if(data && data.api && Array.isArray(data.api.players) && data.api.players.length > 0) {
            populatePlayerData(data.api.players);
            
            // "Add to MyTeam" button changes based on whether the player is in the user's team"
            const addToMyTeamBtn = document.getElementById('addToMyTeamBtn');
            if (data.in_user_team) {
                addToMyTeamBtn.innerText = 'Already Added';
                addToMyTeamBtn.disabled = true;
                addToMyTeamBtn.style.backgroundColor = '#aaa'; //For styling - Color change
            } else {
                addToMyTeamBtn.innerText = 'Add to MyTeam';
                addToMyTeamBtn.disabled = false;
                addToMyTeamBtn.style.backgroundColor = ''; //Button reset
            }
            
        } else {
            console.error('invalid player data', data);
        }
    })
    .catch(err => console.error('Error fetching player statistics', err));
}


function populatePlayerData(players) {
    document.querySelector('.basic-details tbody').innerHTML = '';
    document.querySelector('.player-stats tbody').innerHTML = '';

    const currentSeasonData = players[0]

    // Populate Basic Details
    const basicDetailsTbody = document.querySelector('.basic-details tbody');
    const basicDetailsRow = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = currentSeasonData.player_name || "-";
    basicDetailsRow.appendChild(nameCell);
    
    const ageCell = document.createElement('td');
    ageCell.textContent = currentSeasonData.age || "-";
    basicDetailsRow.appendChild(ageCell);

    const positionCell = document.createElement('td');
    positionCell.textContent = currentSeasonData.position || "-";
    basicDetailsRow.appendChild(positionCell);

    const teamCell = document.createElement('td');
    teamCell.textContent = currentSeasonData.team_name || "-";
    basicDetailsRow.appendChild(teamCell);

    const birthPlaceCell = document.createElement('td');
    birthPlaceCell.textContent = currentSeasonData.birth_place || "-";
    basicDetailsRow.appendChild(birthPlaceCell);

    const heightCell = document.createElement('td');
    heightCell.textContent = currentSeasonData.height || "-";
    basicDetailsRow.appendChild(heightCell);

    const weightCell = document.createElement('td');
    weightCell.textContent = currentSeasonData.weight || "-";
    basicDetailsRow.appendChild(weightCell);
    
    basicDetailsTbody.appendChild(basicDetailsRow);

    // Populating Player Stats for each season
    const statsTbody = document.querySelector('.player-stats tbody');

    for(const season of players) {
        const statsRow = document.createElement('tr');
        
        const seasonCell = document.createElement('td');
        seasonCell.textContent = season.season || "-"; 
        statsRow.appendChild(seasonCell);
        
        const clubCell = document.createElement('td');
        clubCell.textContent = season.team_name || "-";
        statsRow.appendChild(clubCell);

        const competitionCell = document.createElement('td');
        competitionCell.textContent = season.league || "-";
        statsRow.appendChild(competitionCell);

        const appearencesCell = document.createElement('td');
        appearencesCell.textContent = season.games.appearences || "-";
        statsRow.appendChild(appearencesCell);

        const goalsCell = document.createElement('td');
        goalsCell.textContent = season.goals.total || "-";
        statsRow.appendChild(goalsCell);

        const assistsCell = document.createElement('td');
        assistsCell.textContent = season.goals.assists || "-";
        statsRow.appendChild(assistsCell);

        const ogCell = document.createElement('td');
        ogCell.textContent = season.goals.conceded || "-";
        statsRow.appendChild(ogCell);

        const shotsCell = document.createElement('td');
        shotsCell.textContent = season.shots.total || "-";
        statsRow.appendChild(shotsCell);

        const passesCell = document.createElement('td');
        passesCell.textContent = season.passes.total || "-";
        statsRow.appendChild(passesCell);

        const keypassesCell = document.createElement('td');
        keypassesCell.textContent = season.passes.key || "-";
        statsRow.appendChild(keypassesCell);

        const yellowCell = document.createElement('td');
        yellowCell.textContent = season.cards.yellow || "-";
        statsRow.appendChild(yellowCell);

        const yellowredCell = document.createElement('td');
        yellowredCell.textContent = season.cards.yellowred || "-";
        statsRow.appendChild(yellowredCell);

        const redCell = document.createElement('td');
        redCell.textContent = season.cards.red || "-";
        statsRow.appendChild(redCell);

        const ratingCell = document.createElement('td');
        const ratingValue = parseFloat(season.rating);
        if (!isNaN(ratingValue)) {
        ratingCell.textContent = ratingValue.toFixed(1);
        } else {
        ratingCell.textContent = "-";
        } 
        statsRow.appendChild(ratingCell);

        statsTbody.appendChild(statsRow);
    }
    const playerDetailsDiv = document.querySelector('.player-details');
    const playerStatsContainer = document.querySelector('.player-stats-container');
    
    playerDetailsDiv.style.visibility = 'visible';
    playerStatsContainer.style.visibility = 'visible';

    const addToMyTeamBtn = document.getElementById('addToMyTeamBtn');
    addToMyTeamBtn.style.display = 'block';
    addToMyTeamBtn.setAttribute('data-player-id', players[0].player_id);
}

document.getElementById('addToMyTeamBtn').addEventListener('click', function() {
    // Extract player data from the table
    const playerName = document.querySelector('.basic-details tbody td:nth-child(1)').textContent;
    const playerPosition = document.querySelector('.basic-details tbody td:nth-child(3)').textContent;
    const playerTeam = document.querySelector('.basic-details tbody td:nth-child(4)').textContent;

    // Construct the player data object
    const playerData = {
        user_id: userId,
        player_name: playerName,
        player_position: playerPosition,
        player_team: playerTeam
    };

    // Make a fetch request to add the player to the user's team
    fetch('/add_player_to_team', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(playerData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Player added successfully') {
            // Change button to "Added"
            this.innerText = 'Added';
            this.disabled = true;
            this.style.backgroundColor = '#aaa'; //Reminder for me - Styling
        } else if (data.error && data.error.includes("Max allowed players is 16")) {
            alert('Your team is full. You cannot add more than 16 players.');
        } else if (data.error && data.error.includes("Player already exists in the team.")) {
            alert('Player already exists in your team.');
        } else {
            alert('Error adding player to your team.');
        }
    })
    .catch(err => {
        console.error('Error adding player to team:', err);
    });
});



function addToMyTeam(playerData) {
    // Check if the user is logged in
    if (!userId) {
        alert('You must be logged in to add a player to your team.');
        return;
    }

    // Data to be sent to the server
    const dataToSend = {
        user_id: userId,
        ...playerData
    };

    // Send the data to the server
    fetch('/add_player_to_team', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Error adding player to team:', error);
    });
}




