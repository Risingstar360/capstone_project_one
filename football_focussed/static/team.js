let userTeamPlayers = []; 

document.addEventListener("DOMContentLoaded", function() {
    const teamNameElement = document.getElementById('teamName');
    const teamId = teamNameElement.getAttribute('data-team-id');  
    
    // Fetch the user's team players on page load
    fetch(`/get_user_team/${teamId}`)
    .then(response => response.json())
    .then(data => {
        // Map each player to object with name and position
        userTeamPlayers = data.players.map(player => ({
            name: player.player_name,
            position: player.player_position,
            team: player.player_team
        }));

        // Sort the userTeamPlayers array by position on initial load of page
        userTeamPlayers.sort((a, b) => {
            // Using a back to front order - Simple player position descriptions limited by API
            const positionsOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
            return positionsOrder.indexOf(a.position) - positionsOrder.indexOf(b.position);
        });

        // Call the displayFormation function to fill the formation with selected players
        displayFormation();
        document.getElementById('teamName').innerText = data.team_name;
        document.getElementById('teamFormation').innerText = data.formation;

    
        updatePlayerListTable();
    })
    .catch(error => {
        console.error('Error fetching team data:', error);
    });
});

// Define the updatePlayerListTable function to populate the player list table
function updatePlayerListTable() {
    const playerList = document.getElementById('playerList');
    const teamNameElement = document.getElementById('teamName');  
    const teamId = teamNameElement.getAttribute('data-team-id');  
    
    playerList.innerHTML = '';  

    let sortedDisplayList = getSortedPlayerListForDisplay();  

    for (const player of sortedDisplayList) {  
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.innerText = player.name;
        row.appendChild(nameCell);

        const positionCell = document.createElement('td');
        positionCell.innerText = player.position;
        row.appendChild(positionCell);

        const teamCell = document.createElement('td');
        teamCell.innerText = player.team;
        row.appendChild(teamCell);

        const removeButton = document.createElement('button');
        removeButton.innerText = 'Remove';
        removeButton.addEventListener('click', function() {
            removePlayerFromTeam(player.name, teamId);
        });
        row.appendChild(removeButton);

        playerList.appendChild(row);
    }
}


    function removePlayerFromTeam(playerName, teamId) {
        const playerData = {
            team_id: teamId,
            player_name: playerName
        };
    
        fetch('/remove_player_from_team', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Player removed successfully') {
                alert('Player removed from your team!');
                updateDropdownsAfterPlayerRemoval(playerName);
            } else {
                alert('Error removing player from your team.');
            }
        })
        .catch(err => {
            console.error('Error removing player from team:', err);
        });
    }   
    
    function updateDropdownsAfterPlayerRemoval(removedPlayerName) {
        // Get all player dropdowns
        const allDropdowns = document.querySelectorAll('.playerDropdown');
    
        // Update each dropdown
        allDropdowns.forEach(dropdown => {
            // Remove the option for the removed player
            const optionToRemove = dropdown.querySelector(`option[value="${removedPlayerName}"]`);
            if (optionToRemove) {
                optionToRemove.remove();
            }
    
            // Reset the dropdown if the removed player was selected
            if (dropdown.value === removedPlayerName) {
                dropdown.value = ''; 
            }
        });
    
        // Update local storage
        updateLocalStorageAfterPlayerRemoval(removedPlayerName);
    
       
        updateDropdownOptions();
    }
    
    function updateLocalStorageAfterPlayerRemoval(removedPlayerName) {
        let savedPositions = JSON.parse(localStorage.getItem('savedPositions')) || [];
        savedPositions = savedPositions.map(positionName => positionName === removedPlayerName ? '' : positionName);
        localStorage.setItem('savedPositions', JSON.stringify(savedPositions));
    }
    
    

// Event listener for when the formation dropdown changes
document.getElementById('formation').addEventListener('change', displayFormation);


function displayFormation() {
    const formation = document.getElementById('formation').value;
    const formationDisplay = document.getElementById('formationDisplay');
    formationDisplay.innerHTML = ''; 

    // Get saved positions from localStorage
    const savedPositions = JSON.parse(localStorage.getItem('savedPositions')) || [];

    // Create a dropdown for the goalkeeper
    const goalkeeperDiv = document.createElement('div');
    goalkeeperDiv.className = 'goalkeeper';
    const goalkeeperDropdown = document.createElement('select');
    goalkeeperDropdown.className = 'playerDropdown';

    // Add a default option for goalkeeper
    const goalieDefaultOption = document.createElement('option');
    goalieDefaultOption.value = '';
    goalieDefaultOption.textContent = 'Select GK';
    goalkeeperDropdown.appendChild(goalieDefaultOption);

    goalkeeperDropdown.addEventListener('change', updateDropdownOptions);

    // Fill the goalkeeper dropdown with the players
    userTeamPlayers.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        option.textContent = player.name;
        goalkeeperDropdown.appendChild(option);
    });

    // Set the value of the goalkeeper dropdown if there's a saved position
    if (savedPositions[0]) {
        goalkeeperDropdown.value = savedPositions[0];
    }

    goalkeeperDiv.appendChild(goalkeeperDropdown);
    formationDisplay.appendChild(goalkeeperDiv);

    // Split the formation to get the number of players per line
    const lines = formation.split('-');

    let positionIndex = 1; // Reminder - Position 0 is Goalkeeper

    lines.forEach(line => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'line';

        // Create a dropdown for each player in the line
        for (let i = 0; i < parseInt(line); i++) {
            const playerDropdown = document.createElement('select');
            playerDropdown.className = 'playerDropdown';

            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select Player';
            playerDropdown.appendChild(defaultOption);

            playerDropdown.addEventListener('change', updateDropdownOptions);
            lineDiv.appendChild(playerDropdown);

            // Fill the dropdown with player names from your player list
            const players = userTeamPlayers;
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.name;
                option.textContent = player.name;
                playerDropdown.appendChild(option);
            });

            // Set the value of the dropdown if there's a saved position
            if (savedPositions[positionIndex]) {
                playerDropdown.value = savedPositions[positionIndex];
            }

            positionIndex++;

            lineDiv.appendChild(playerDropdown);
        }

        formationDisplay.appendChild(lineDiv);
    });
}

function updateDropdownOptions() {
    // Disables player selection in all other dropdowns as the player is selected.
    document.querySelectorAll('.playerDropdown option').forEach(option => {
        option.disabled = false;
    });

    const allDropdowns = Array.from(document.querySelectorAll('.playerDropdown'));
    allDropdowns.forEach(dropdown => {
        const selectedValue = dropdown.value;
        if (selectedValue) {
            const otherDropdowns = allDropdowns.filter(dd => dd !== dropdown);  // All dropdowns excluding the current one
            otherDropdowns.forEach(dd => {
                const optionToDisable = dd.querySelector(`option[value="${selectedValue}"]`);
                if (optionToDisable) optionToDisable.disabled = true;
            });
        }
    });

    updatePlayerListTable();
}

// Attaching function to the change of each dropdown
document.querySelectorAll('.playerDropdown').forEach(dropdown => {
    dropdown.addEventListener('change', updateDropdownOptions);
});

document.getElementById('savePositionsBtn').addEventListener('click', function() {
    const playerDropdowns = document.querySelectorAll('.playerDropdown');
    const positions = [];
    playerDropdowns.forEach(dropdown => {
        positions.push(dropdown.value);
    });

    // Save positions to localStorage
    localStorage.setItem('savedPositions', JSON.stringify(positions));
    alert('Positions saved successfully!');
});

function updatePlayerPositions() {
    // Updates player positions - Re-visit after styling
    const data = {
        team_id: team_id,
        players: players
    };

    fetch('/update_player_positions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
        } else if (data.error) {
            alert(data.error);
        } else {
            alert("Error updating player positions.");
        }
    })
    .catch(err => {
        console.error('Error updating player positions:', err);
    });
}


function getSortedPlayerListForDisplay() {
    // Copies the userTeamPlayers array to stop changing the original array
    let displayList = Array.from(userTeamPlayers);

    // Order for the positions
    const positionOrder = ["Goalkeeper", "Defender", "Midfielder", "Attacker"];

    displayList.sort((a, b) => {
        // If one player is selected and the other isn't, prioritize the selected player
        let selectedPlayers = getSelectedPlayers();
        if (selectedPlayers.includes(a.name) && !selectedPlayers.includes(b.name)) {
            return -1;
        }
        if (!selectedPlayers.includes(a.name) && selectedPlayers.includes(b.name)) {
            return 1;
        }
        // If neither or both players are selected, sort by position order
        return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
    });

    return displayList;
}

function getSelectedPlayers() {
    return Array.from(document.querySelectorAll('.playerDropdown'))
                .map(dropdown => dropdown.value)
                .filter(value => value !== '');
}










