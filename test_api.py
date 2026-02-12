#!/usr/bin/env python3
"""Test API script"""
import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://72.62.4.119:5000"

def make_request(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}

    if data:
        json_data = json.dumps(data).encode('utf-8')
        req = urllib.request.Request(url, data=json_data, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

def test_admin_login():
    print("Testing admin login...")
    status, response = make_request("/api/auth/login", "POST", {
        "email": "admin@sdc.com",
        "password": "admin123"
    })
    print(f"Status: {status}")
    print(f"Response: {response}")

    if status == 200:
        try:
            data = json.loads(response)
            token = data.get("access_token")
            print(f"✅ Admin login successful! Token: {token[:20]}...")
            return token
        except:
            pass
    else:
        print(f"❌ Admin login failed")
    return None

def test_health():
    print("\nTesting health check...")
    status, response = make_request("/")
    print(f"Status: {status}")
    print(f"Response: {response}")

def test_register_donor():
    print("\nTesting donor registration...")
    status, response = make_request("/api/auth/register", "POST", {
        "email": "donor@test.com",
        "password": "test123",
        "role": "donor",
        "first_name": "Test",
        "last_name": "Donor"
    })
    print(f"Status: {status}")
    print(f"Response: {response[:500]}...")
    return status == 201

def test_protected_endpoint(token):
    print("\nTesting protected endpoint (get current user)...")
    if not token:
        print("❌ No token, skipping")
        return

    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")

def test_admin_users(token):
    print("\nTesting admin get all users...")
    if not token:
        print("❌ No token, skipping")
        return

    req = urllib.request.Request(
        f"{BASE_URL}/api/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            data = json.loads(response.read().decode('utf-8'))
            print(f"Users count: {len(data.get('users', []))}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")

def test_admin_agencies(token):
    print("\nTesting admin get all agencies...")
    if not token:
        print("❌ No token, skipping")
        return

    req = urllib.request.Request(
        f"{BASE_URL}/api/admin/agencies",
        headers={"Authorization": f"Bearer {token}"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')[:300]}...")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")

def test_marketplace():
    print("\nTesting marketplace surrogates...")
    status, response = make_request("/api/marketplace/surrogates")
    print(f"Status: {status}")
    print(f"Response: {response[:300]}...")

def test_kyc_status():
    print("\nTesting KYC status...")
    status, response = make_request("/api/kyc/status")
    print(f"Status: {status}")
    print(f"Response: {response[:300]}...")

if __name__ == "__main__":
    print("=" * 50)
    print("API Tests for SDC Backend")
    print("=" * 50)

    test_health()
    token = test_admin_login()

    if token:
        test_protected_endpoint(token)
        test_admin_users(token)
        test_admin_agencies(token)

    test_register_donor()
    test_marketplace()
    test_kyc_status()

    print("\n" + "=" * 50)
    print("Tests completed!")
    print("=" * 50)
