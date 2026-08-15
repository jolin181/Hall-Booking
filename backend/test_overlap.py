import requests
import json
from datetime import date, timedelta

base_url = "http://localhost:8080/api"

# Login
login_data = {"email": "super@hallbooker.com", "password": "admin123"}
response = requests.post(f"{base_url}/auth/login", json=login_data)
if response.status_code != 200:
    print("Login failed!", response.text)
    exit(1)
token = response.json().get("token")
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 1. Book Hall X tomorrow from 3:00 PM to 5:00 PM
tomorrow = (date.today() + timedelta(days=1)).isoformat()
booking_1 = {
    "title": "Test 1",
    "hallId": 1,
    "eventDate": tomorrow,
    "startTime": "15:00:00",
    "endTime": "17:00:00"
}
r1 = requests.post(f"{base_url}/bookings", json=booking_1, headers=headers)
print("Test 1 (3-5 PM):", r1.status_code, r1.text)

# 2. Book Hall X tomorrow from 9:00 AM to 11:00 AM
booking_2 = {
    "title": "Test 2",
    "hallId": 1,
    "eventDate": tomorrow,
    "startTime": "09:00:00",
    "endTime": "11:00:00"
}
r2 = requests.post(f"{base_url}/bookings", json=booking_2, headers=headers)
print("Test 2 (9-11 AM):", r2.status_code, r2.text)

# 3. Try booking Hall X tomorrow from 4:00 PM to 6:00 PM
booking_3 = {
    "title": "Test 3",
    "hallId": 1,
    "eventDate": tomorrow,
    "startTime": "16:00:00",
    "endTime": "18:00:00"
}
r3 = requests.post(f"{base_url}/bookings", json=booking_3, headers=headers)
print("Test 3 (4-6 PM):", r3.status_code, r3.text)

# 4. Try booking Hall X tomorrow from 2:00 PM to 3:00 PM
booking_4 = {
    "title": "Test 4",
    "hallId": 1,
    "eventDate": tomorrow,
    "startTime": "14:00:00",
    "endTime": "15:00:00"
}
r4 = requests.post(f"{base_url}/bookings", json=booking_4, headers=headers)
print("Test 4 (2-3 PM):", r4.status_code, r4.text)

# 5. Try booking Hall X tomorrow from 5:00 PM to 6:00 PM
booking_5 = {
    "title": "Test 5",
    "hallId": 1,
    "eventDate": tomorrow,
    "startTime": "17:00:00",
    "endTime": "18:00:00"
}
r5 = requests.post(f"{base_url}/bookings", json=booking_5, headers=headers)
print("Test 5 (5-6 PM):", r5.status_code, r5.text)
