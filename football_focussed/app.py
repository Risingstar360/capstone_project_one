from flask import Flask, render_template, request, jsonify, url_for, flash, redirect
from flask_debugtoolbar import DebugToolbarExtension
from flask_login import UserMixin, LoginManager, login_user, current_user, logout_user, login_required
from werkzeug.urls import url_parse
from forms import RegistrationForm, LoginForm
from collections import defaultdict
import requests
from models import db, User, PlayersInTeams, UserTeams
from flask_migrate import Migrate
import os
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "defaultsecret")
app.config['DEBUG_TB_ENABLED'] = False
debug = DebugToolbarExtension(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///football_focussed-app'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True

db.init_app(app)
migrate = Migrate(app, db)

api_key = os.environ.get("API_FOOTBALL_KEY")

API_HEADERS = {
    'x-rapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    'X-RapidAPI-Key': api_key
}


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.route('/')
def home():
    """Homepage"""
    return render_template("base.html")


@app.route('/register', methods=['GET', 'POST'])
def register():
    """Registration as user"""
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash(f'Account created for {form.username.data}!', 'Success')
        return redirect(url_for('home'))
    return render_template('register.html', title="Register", form=form)


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login as already registered user"""
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('home')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))


@app.route('/api/countries', methods=['GET'])
def get_countries():
    """Fetch list of countries for population"""
    response = requests.get(
        'https://api-football-v1.p.rapidapi.com/v3/leagues', headers=API_HEADERS)
    if response.status_code == 200:
        api_response = response.json()

        nested_list = api_response.get('response', [])

        countries = defaultdict(list)
        for pair in nested_list:
            country_info = pair.get('country', {})
            league_info = pair.get('league', {})
            country_name = country_info.get('name')
            countries[country_name].append({
                'id': league_info.get('id'),
                'name': league_info.get('name'),
                'logo': league_info.get('logo')
            })
        return jsonify(dict(countries))
    else:
        return jsonify(error="unable to fetch countries"), response.status_code


@app.route('/api/standings/<int:league_id>', methods=['GET'])
def get_standings(league_id):
    """Fetch selected countries leagues using API league_id"""
    url = f'https://api-football-v1.p.rapidapi.com/v3/standings'
    params = {'season': '2023', 'league': league_id}
    response = requests.get(url, headers=API_HEADERS, params=params)

    if response.status_code == 200:
        standings = response.json()
        return jsonify(standings)
    else:
        return jsonify(error="unable to fetch standings"), response.status_code


@app.route('/leagues')
def leagues():
    """Route to League selection page"""
    return render_template("leagues.html")


@app.route('/player_search')
def players():
    """Route to player selection page"""
    return render_template("player_search.html", user=current_user)


@app.route('/api/players', methods=['GET'])
def search_players():
    """Fetch players available in API based on player name"""
    player_name = request.args.get('name')
    if not player_name:
        return jsonify(error="Player name is required"), 400

    url = f"https://api-football-v1.p.rapidapi.com/v2/players/search/{player_name}"
    response = requests.get(url, headers=API_HEADERS)

    if response.status_code != 200:
        return jsonify(error="Unable to fetch players"), response.status_code

    players_data = response.json().get('api', {}).get('players', [])
    players = []
    for player in players_data:
        # Check if the player is already in the user's team
        existing_player = PlayersInTeams.query.filter_by(
            player_name=player.get('player_name')).first()
        in_user_team = existing_player is not None

        players.append({
            "id": player.get('player_id'),
            "name": player.get('player_name'),
            "position": player.get('position'),
            "age": player.get('age'),
            "nationality": player.get('nationality'),
            "in_user_team": in_user_team
        })

    return jsonify(players)


@app.route('/api/player/<int:player_id>', methods=['GET'])
def get_player_statistics(player_id):
    """Using selected player ID, fetch player stats"""
    current_user_id = current_user.id

    user_team = UserTeams.query.filter_by(user_id=current_user_id).first()

    url = f"https://api-football-v1.p.rapidapi.com/v2/players/player/{player_id}"
    response = requests.get(url, headers=API_HEADERS)

    if response.status_code == 200:
        player_data = response.json()

        # Check if the player is already in the user's team
        existing_player = PlayersInTeams.query.filter_by(
            player_name=player_data['api']['players'][0]['player_name'],
            team_id=user_team.id if user_team else None).first()
        player_data['in_user_team'] = existing_player is not None

        return jsonify(player_data)
    else:
        return jsonify(error="unable to fetch player statistics"), response.status_code


@app.route('/myteam')
@login_required
def my_team():
    """Route to my_team page"""
    user_team = UserTeams.query.filter_by(user_id=current_user.id).first()
    if user_team:
        team_id = user_team.id
    else:
        team_id = None  # Handle the scenario where the user might not have set up a team yet
    return render_template('my_team.html', team_id=team_id, user_team=user_team)


@app.route('/add_player_to_team', methods=['POST'])
# @login_required
def add_player_to_team():
    """Add player to team and DB with a limit of 16 players per user"""
    data = request.get_json()
    user_id = data['user_id']
    player_name = data['player_name']
    player_position = data['player_position']
    player_team = data['player_team']

    # Get the user's team
    user_team = UserTeams.query.filter_by(user_id=user_id).first()
    if not user_team:
        return jsonify({'error': 'User does not have a team.'}), 400

    # Check the number of players in the team
    current_player_count = PlayersInTeams.query.filter_by(
        team_id=user_team.id).count()

    # If the team already has 16 players, return an error
    if current_player_count >= 16:
        return jsonify(error="Your team is full. Max allowed players is 16."), 400

    # Check if player already exists in the team
    existing_player = PlayersInTeams.query.filter_by(
        team_id=user_team.id, player_name=player_name).first()
    if existing_player:
        return jsonify({'error': 'Player already exists in the team.'}), 400

    new_player = PlayersInTeams(team_id=user_team.id, player_name=player_name,
                                player_position=player_position, player_team=player_team)
    db.session.add(new_player)
    db.session.commit()

    return jsonify({'message': 'Player added successfully'}), 200


@app.route('/remove_player_from_team', methods=['POST'])
# @login_required
def remove_player_from_team():
    """Remove player from team and DB"""
    data = request.get_json()
    print("Received Data:", data)
    team_id = data['team_id']
    player_name = data['player_name']

    player_record = PlayersInTeams.query.filter_by(
        team_id=team_id, player_name=player_name).first()

    if not player_record:
        return jsonify(error="Player not found in team"), 404

    db.session.delete(player_record)
    db.session.commit()

    return jsonify(message="Player removed successfully"), 200


@app.route('/get_user_team/<int:team_id>', methods=['GET'])
def get_user_team(team_id):
    team = UserTeams.query.get_or_404(team_id)
    players = PlayersInTeams.query.filter_by(team_id=team_id).all()

    players_data = [{
        'player_name': player.player_name,
        'player_position': player.player_position,
        'player_team': player.player_team
    } for player in players]

    response = {
        'team_name': team.team_name,
        'formation': team.formation,
        'players': players_data
    }

    return jsonify(response)


@app.route('/update_team_info', methods=['POST'])
# @login_required
def update_team_info():
    """Update team name and formation with redirect"""
    team_name = request.form.get('team_name')
    formation = request.form.get('formation')

    user_team = UserTeams.query.filter_by(user_id=current_user.id).first()

    if not user_team:
        new_team = UserTeams(user_id=current_user.id,
                             team_name=team_name, formation=formation)
        db.session.add(new_team)
    else:
        user_team.team_name = team_name
        user_team.formation = formation

    db.session.commit()

    return redirect(url_for('my_team'))


@app.route('/update_player_positions', methods=['POST'])
# @login_required
def update_player_positions():
    """Order of player population, check for duplications and ensure same player not avaailable in multiple positions"""
    data = request.get_json()
    team_id = data.get('team_id')
    players = data.get('players', [])

    if len(players) != len(set(players)):
        return jsonify(error="Cannot add the same player to multiple positions."), 400

    for idx, player_name in enumerate(players):
        player_record = PlayersInTeams.query.filter_by(
            team_id=team_id, player_name=player_name).first()
        if player_record:
            pass

    db.session.commit()
    return jsonify(message="Player positions updated successfully"), 200


if __name__ == '__main__':
    app.run(debug=True)
