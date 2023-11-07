import unittest
from unittest import TestCase
from app import app, db
from models import User


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG_TB_ENABLED = False
    WTF_CSRF_ENABLED = False  # Disable CSRF for testing purposes.
    SECRET_KEY = 'testsecretkey'


class AppTestCase(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.app.config.from_object(TestConfig)
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    def test_home(self):
        """Test Home route"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Foot-e", response.data)

    def test_register(self):
        """Test User Registration"""
        response = self.client.post('/register', data=dict(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            password2='testpassword'
        ), follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Account created for testuser!', response.data)

    # Verify the user was inserted into the database
        with self.app.app_context():
            user = User.query.filter_by(username='testuser').first()
            self.assertIsNotNone(user)


if __name__ == '__main__':
    unittest.main()
