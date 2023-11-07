describe("searchPlayers", function() {
    let playerSearchInput, playersListContainer;

    beforeEach(function() {
        // Set up the document body to include necessary elements
        document.body.innerHTML = `
            <input id="playerSearchInput" />
            <div id="playersListContainer"></div>
        `;

        playerSearchInput = document.getElementById('playerSearchInput');
        playersListContainer = document.getElementById('playersListContainer');

        // Mock the fetch call
        spyOn(window, 'fetch').and.callFake((url) => {
            if (url.includes('/api/players?name=')) {
                return Promise.resolve({
                    json: () => Promise.resolve([
                        { id: 1, name: 'C Cresswell', position: 'Defender', nationality: 'England' }
                        // ... add more mocked player data as needed
                    ])
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    it("should not call fetch if the search query is empty", function() {
        playerSearchInput.value = '';
        searchPlayers();
        expect(window.fetch).not.toHaveBeenCalled();
    });

    it("should call fetch with the correct URL when a search query is provided", function() {
        playerSearchInput.value = 'C. Cresswell';
        searchPlayers();
        expect(window.fetch).toHaveBeenCalledWith('/api/players?name=Ronaldo');
    });

    it("should populate playersListContainer with search results after fetching", function(done) {
        playerSearchInput.value = 'C. Cresswell';
        searchPlayers();

        // Wait for the mocked fetch to "complete"
        setTimeout(() => {
            expect(playersListContainer.children.length).toBeGreaterThan(0);
            expect(playersListContainer.textContent).toContain('Cristiano Ronaldo');
            done();
        }, 0);
    });

    // ... more tests for error handling, etc.
});

describe("fetchPlayerStatistics", function() {
    let playerDetailsDiv, playerStatsContainer;

    beforeEach(function() {
        // Set up the document body to include necessary elements
        document.body.innerHTML = `
            <div class="player-details" style="visibility: hidden;"></div>
            <div class="player-stats-container" style="visibility: hidden;"></div>
        `;

        playerDetailsDiv = document.querySelector('.player-details');
        playerStatsContainer = document.querySelector('.player-stats-container');

        spyOn(window, 'fetch').and.callFake((url) => {
            if (url === '/api/player/1') {
                return Promise.resolve({
                    json: () => Promise.resolve({
                        api: {
                            players: [
                                { 
                                    player_name: 'Charlie Cresswell', 
                                    team_name: 'Leeds United'
                                    // ... You can add more player properties here as needed
                                }
                                // ... You can add more mocked player objects here
                            ]
                        }
                    })
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    it("should fetch player statistics and update the DOM", function(done) {
        fetchPlayerStatistics(1);

        // Wait for the mocked fetch to "complete"
        setTimeout(() => {
            expect(playerDetailsDiv.style.visibility).toBe('visible');
            expect(playerStatsContainer.style.visibility).toBe('visible');
            // ... additional checks on the contents of these elements
            done();
        }, 0);
    });

    // ... more tests for error handling, different player data scenarios, etc.
});