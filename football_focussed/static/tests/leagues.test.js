describe("fetchCountries", function() {
    beforeEach(function() {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(JSON.stringify({
        USA: [{ id: 1, name: 'MLS' }],
        England: [{ id: 2, name: 'Premier League' }]
      }))));
    });
  
    it("should populate the countryDropdown with countries from the API", function(done) {
      fetchCountries();
      setTimeout(function() {
        expect(document.getElementById('countryDropdown').length).toBeGreaterThan(0);
        done();
      }, 0);
    });
  });

describe("populateLeagues", function() {
// Assuming that countriesLeagueData is already populated
countriesLeagueData = {
    USA: [{ id: 1, name: 'MLS' }],
    England: [{ id: 2, name: 'Premier League' }]
};

it("should populate the leagueDropdown with leagues of the selected country", function() {
    // Mock the countryDropdown's value
    document.getElementById('countryDropdown').value = 'USA';

    populateLeagues();

    expect(document.getElementById('leagueDropdown').length).toBe(10); // includes the default option
});
});
  
describe("createStandingsTable", function() {
  it("should create a standings table with the correct number of rows", function() {
    const mockStandings = [
      { rank: 1, description: "Champions", team: { name: "Team A" }, all: { played: 38, win: 24, draw: 10, lose: 4, goals: { for: 70, against: 30 } }, points: 82, form: "WWLWD" },
      // ... add more mock data as needed
    ];

    createStandingsTable(mockStandings);

    const tableRows = document.getElementById('standingsTable').querySelectorAll('tbody tr');
    expect(tableRows.length).toBe(mockStandings.length);
  });
});
