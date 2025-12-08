"""
Filename: auth_routes.py
Author: Aubin Mugisha

Authentication routes handling user registration, login, email verification,
and JWT token management.
"""

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from utils.jwt_utils import generate_access_token, token_required
from utils.validators import validate_email, validate_password
from utils.email_sender import send_verification_email, send_welcome_email
import random
import string

auth_bp = Blueprint("auth", __name__)


def generate_verification_code() -> str:
    """Generate a random 6-digit verification code."""
    return "".join(random.choices(string.digits, k=6))


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """Register new user account with email and password, send verification code."""
    from app import mysql
    from utils.logger import log_info, log_error

    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        log_error("Register attempt missing email or password")
        return (
            jsonify({"status": "error", "message": "Email and password required"}),
            400,
        )

    if not validate_email(email):
        log_error(f"Register attempt with invalid email format: {email}")
        return jsonify({"status": "error", "message": "Invalid email format"}), 400

    is_valid, msg = validate_password(password)
    if not is_valid:
        return jsonify({"status": "error", "message": msg}), 400

    try:
        log_info(f"Registration attempt for email: {email}")
        password_hash = generate_password_hash(password)
        verification_code = generate_verification_code()

        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("InsertUser", [email, password_hash, verification_code])
        result = cursor.fetchone()
        user_id = result["user_id"] if result else None

        while cursor.nextset():
            pass

        mysql.connection.commit()
        cursor.close()

        # Send verification email
        send_verification_email(email, verification_code)
        log_info(f"User registered successfully - user_id: {user_id}, email: {email}")
        
        # Always print code to terminal for development
        print(f"\n{'='*60}")
        print(f"VERIFICATION CODE for {email}: {verification_code}")
        print(f"{'='*60}\n")

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Registration successful. Please check your email for verification code.",
                    "data": {"user_id": user_id, "email": email},
                }
            ),
            201,
        )
    except Exception as e:
        mysql.connection.rollback()
        if "Duplicate entry" in str(e):
            log_error(f"Registration failed - email already registered: {email}")
            return (
                jsonify({"status": "error", "message": "Email already registered"}),
                409,
            )
        log_error(f"Registration error for {email}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token (requires verified email)."""
    from app import mysql
    from utils.logger import log_info, log_error

    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        log_error("Login attempt missing email or password")
        return (
            jsonify({"status": "error", "message": "Email and password required"}),
            400,
        )

    log_info(f"Login attempt for email: {email}")
    cursor = mysql.connection.cursor()
    cursor.execute("START TRANSACTION")
    cursor.callproc("SelectUserByEmail", [email])
    user = cursor.fetchone()

    while cursor.nextset():
        pass

    if not user or not check_password_hash(user["password_hash"], password):
        mysql.connection.rollback()
        cursor.close()
        log_error(f"Login failed - invalid credentials for email: {email}")
        return jsonify({"status": "error", "message": "Invalid credentials"}), 401

    # Check if email is verified
    if not user.get("is_verified"):
        mysql.connection.rollback()
        cursor.close()
        log_error(f"Login failed - unverified email: {email}")
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Please verify your email before logging in",
                    "code": "EMAIL_NOT_VERIFIED",
                    "email": email,
                }
            ),
            403,
        )

    cursor.callproc("UpdateUserLastLogin", [user["user_id"]])
    while cursor.nextset():
        pass
    mysql.connection.commit()
    cursor.close()

    access_token = generate_access_token(
        user["user_id"], user["email"], user.get("person_id")
    )
    log_info(f"User logged in successfully - user_id: {user['user_id']}, email: {email}")

    return (
        jsonify(
            {
                "status": "success",
                "data": {
                    "user_id": user["user_id"],
                    "person_id": user.get("person_id"),
                    "email": user["email"],
                    "access_token": access_token,
                },
            }
        ),
        200,
    )


@auth_bp.route("/auth/me", methods=["GET"])
@token_required
def get_current_user():
    """Return the currently authenticated user."""
    from app import mysql

    user_id = request.current_user["user_id"]
    cursor = mysql.connection.cursor()
    cursor.callproc("SelectUserById", [user_id])
    user = cursor.fetchone()

    while cursor.nextset():
        pass
    cursor.close()

    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    return (
        jsonify(
            {
                "status": "success",
                "data": {
                    "user_id": user["user_id"],
                    "person_id": user.get("person_id"),
                    "email": user["email"],
                    "created_at": str(user["created_at"]),
                    "last_login": str(user["last_login"])
                    if user["last_login"]
                    else None,
                    "person_name": user.get("person_name"),
                    "person_email": user.get("person_email"),
                    "person_phone": user.get("person_phone"),
                    "bio": user.get("bio"),
                },
            }
        ),
        200,
    )


@auth_bp.route("/auth/verify", methods=["POST"])
def verify_email():
    """Verify user email with verification code."""
    from app import mysql
    from utils.logger import log_info, log_error

    data = request.get_json() or {}
    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        log_error("Email verification attempt missing email or code")
        return (
            jsonify(
                {"status": "error", "message": "Email and verification code required"}
            ),
            400,
        )

    try:
        log_info(f"Email verification attempt for: {email}")
        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("VerifyUserEmail", [email, code])

        while cursor.nextset():
            pass

        mysql.connection.commit()
        cursor.close()

        send_welcome_email(email)
        log_info(f"Email verified successfully for: {email}")
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Email verified successfully! You can now log in.",
                }
            ),
            200,
        )
    except Exception as e:
        mysql.connection.rollback()
        error_msg = str(e)
        if "Invalid or expired" in error_msg:
            log_error(f"Email verification failed - invalid/expired code for: {email}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Invalid or expired verification code",
                    }
                ),
                400,
            )
        log_error(f"Email verification error for {email}: {error_msg}")
        return jsonify({"status": "error", "message": error_msg}), 500


@auth_bp.route("/auth/resend-code", methods=["POST"])
def resend_verification_code():
    """Resend verification code to user email."""
    from app import mysql
    from utils.logger import log_info, log_error

    data = request.get_json() or {}
    email = data.get("email")

    if not email:
        log_error("Resend verification code attempt missing email")
        return jsonify({"status": "error", "message": "Email required"}), 400

    if not validate_email(email):
        log_error(f"Resend verification code attempt with invalid email: {email}")
        return jsonify({"status": "error", "message": "Invalid email format"}), 400

    try:
        log_info(f"Resending verification code for: {email}")
        verification_code = generate_verification_code()

        cursor = mysql.connection.cursor()
        cursor.execute("START TRANSACTION")
        cursor.callproc("UpdateVerificationCode", [email, verification_code])

        while cursor.nextset():
            pass

        mysql.connection.commit()
        cursor.close()

        send_verification_email(email, verification_code)
        log_info(f"Verification code resent successfully for: {email}")
        
        # Always print code to terminal for development
        print(f"\n{'='*60}")
        print(f"NEW VERIFICATION CODE for {email}: {verification_code}")
        print(f"{'='*60}\n")

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Verification code sent to your email",
                }
            ),
            200,
        )
    except Exception as e:
        mysql.connection.rollback()
        error_msg = str(e)
        if "not found or already verified" in error_msg:
            log_error(f"Resend verification code failed - user not found or already verified: {email}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "User not found or already verified",
                    }
                ),
                400,
            )
        log_error(f"Resend verification code error for {email}: {error_msg}")
        return jsonify({"status": "error", "message": error_msg}), 500


@auth_bp.route("/auth/refresh", methods=["POST"])
@token_required
def refresh_token():
    """Refresh JWT access token."""
    user_id = request.current_user["user_id"]
    email = request.current_user["email"]
    person_id = request.current_user.get("person_id")

    new_token = generate_access_token(user_id, email, person_id)

    return (
        jsonify({"status": "success", "data": {"access_token": new_token}}),
        200,
    )
