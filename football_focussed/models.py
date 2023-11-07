from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    teams = db.relationship('UserTeams', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class UserTeams(db.Model):
    __tablename__ = 'user_teams'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_name = db.Column(db.String(120), nullable=False)
    formation = db.Column(db.String(120), nullable=False)
    players = db.relationship('PlayersInTeams', backref='team', lazy='select')


class PlayersInTeams(db.Model):
    __tablename__ = 'players_in_teams'

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey(
        'user_teams.id'), nullable=False)
    player_name = db.Column(db.String(120), nullable=False)
    player_position = db.Column(db.String(60), nullable=False)
    player_team = db.Column(db.String(120), nullable=False)
