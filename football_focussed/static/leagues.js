let countriesLeagueData = {};

document.addEventListener('DOMContentLoaded', function() {
    //Fetch countries and populate the dropdown on page load
    fetchCountries();
});

function fetchCountries() {
    fetch('/api/countries')
    .then(response => response.json())
    .then(data => {
        countriesLeagueData = data;
        const countryDropdown = document.getElementById('countryDropdown');
        for (const country in data) {
            const option = document.createElement('option');
            option.value = country;
            option.text = country;
            countryDropdown.add(option);
        }
    })
} 

function populateLeagues() {
    const countryDropdown = document.getElementById('countryDropdown');
    const selectedCountry = countryDropdown.value;
    const leagueDropdown = document.getElementById('leagueDropdown');
    
    // Clear existing options in the league dropdown
    leagueDropdown.innerHTML = '';
    
    // Add a default option to the league dropdown
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.text = 'Select League';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    leagueDropdown.add(defaultOption);

    const leagues = countriesLeagueData[selectedCountry] || [];

    // Populate league dropdowns
    for(const league of leagues) {
        const option = document.createElement('option');
        option.value = league.id;
        option.text = league.name;
        leagueDropdown.add(option);
    }
}

// Attach the populateLeagues function to the change of the country dropdown
document.getElementById('countryDropdown').addEventListener('change', populateLeagues);

document.getElementById('leagueDropdown').addEventListener('change', function() {
    const leagueId = this.value; 
    
    // clear any existing table
    const existingTable = document.getElementById('standingsTable');
    if(existingTable) existingTable.remove();
    
    fetch(`/api/standings/${leagueId}`)
    .then(response => response.json())
    .then(data => {
        const standings = data.response[0].league.standings[0];
        createStandingsTable(standings);
    });
});

function createStandingsTable(standings) {
    const table = document.createElement('table');
    table.id = 'standingsTable';
    
    // Create table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    ['Rank', 'Position', 'Team', 'Played', 'Won', 'Drawn', 'Lost', 'GF', 'GA', 'Points', 'Form'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    standings.forEach(standing => {
        const row = document.createElement('tr');
        
        const cellsText = [
            standing.rank,
            standing.description,
            standing.team.name,
            standing.all.played,
            standing.all.win,
            standing.all.draw,
            standing.all.lose,
            standing.all.goals.for,
            standing.all.goals.against,
            standing.points,
            standing.form
        ];
        
        cellsText.forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    
    // Append table to container
    document.getElementById('tableContainer').appendChild(table);
}