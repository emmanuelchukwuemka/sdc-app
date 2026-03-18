#!/usr/bin/env python3
"""
Nginx Deployment Script for surrogateanddonorconnect.com
This script deploys Nginx configuration to serve the Flask app on a specific domain
without affecting existing sites on port 80.
"""

import paramiko
import sys
import time
from getpass import getpass

def deploy_nginx():
    # Server details
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    # Nginx configuration templates
    nginx_config_basic = """server {
    listen 80;
    listen [::]:80;
    server_name surrogateanddonorconnect.com www.surrogateanddonorconnect.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""

    nginx_config_ssl = """server {
    listen 80;
    listen [::]:80;
    server_name surrogateanddonorconnect.com www.surrogateanddonorconnect.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name surrogateanddonorconnect.com www.surrogateanddonorconnect.com;

    ssl_certificate /etc/letsencrypt/live/surrogateanddonorconnect.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/surrogateanddonorconnect.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""
    
    try:
        print("🔄 Connecting to server...")
        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to server
        ssh.connect(hostname, username=username, password=password, timeout=10)
        print("✅ Connected successfully!")

        # Check for SSL certificate
        print("🔍 Checking for existing SSL certificates...")
        stdin, stdout, stderr = ssh.exec_command("ls /etc/letsencrypt/live/surrogateanddonorconnect.com/fullchain.pem")
        has_ssl = stdout.channel.recv_exit_status() == 0
        
        if has_ssl:
            print("   ✅ SSL certificates found. Using HTTPS configuration.")
            final_config = nginx_config_ssl
        else:
            print("   ⚠️  No SSL certificates found. Using basic HTTP configuration.")
            final_config = nginx_config_basic

        # Commands to execute
        commands = [
            "apt update",
            "apt install -y nginx",
            f"echo '{final_config}' > /etc/nginx/sites-available/surrogateanddonorconnect.conf",
            "ln -sf /etc/nginx/sites-available/surrogateanddonorconnect.conf /etc/nginx/sites-enabled/",
            "nginx -t",
            "systemctl reload nginx"
        ]
        
        # Execute commands
        for i, command in enumerate(commands, 1):
            print(f"\n🔧 Executing step {i}/{len(commands)}: {command}")
            
            if command.startswith("echo"):
                # Handle multi-line echo command
                stdin, stdout, stderr = ssh.exec_command(command, get_pty=True)
            else:
                stdin, stdout, stderr = ssh.exec_command(command)
            
            # Get output
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if output:
                print(f"   Output: {output}")
            if error:
                print(f"   Error: {error}")
            
            # Check for specific command results
            if command == "nginx -t":
                # nginx test outputs to stderr, not stdout
                test_output = output + error
                if "syntax is ok" in test_output.lower() and ("test is successful" in test_output.lower() or "successful" in test_output.lower()):
                    print("   ✅ Nginx configuration test passed!")
                else:
                    print("   ❌ Nginx configuration test failed!")
                    print("   Full output:", output)
                    print("   Error output:", error)
                    return False
            
            time.sleep(1)  # Small delay between commands
        
        ssh.close()
        print("\n🎉 Deployment completed successfully!")
        print("\n📝 Next steps:")
        print("1. Visit http://surrogateanddonorconnect.com to test")
        print("2. Visit http://www.surrogateanddonorconnect.com to test")
        print("3. Your existing sites on port 80 remain unchanged")
        return True
        
    except paramiko.AuthenticationException:
        print("❌ Authentication failed. Please check username/password.")
        return False
    except paramiko.SSHException as e:
        print(f"❌ SSH connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def main():
    print("=" * 60)
    print("🚀 Nginx Deployment Script")
    print("   Domain: surrogateanddonorconnect.com")
    print("   Server: 72.62.4.119")
    print("=" * 60)
    
    # Confirm with user
    response = input("\n⚠️  This will deploy Nginx configuration to your server. Continue? (y/N): ")
    if response.lower() != 'y':
        print("Deployment cancelled.")
        return
    
    print("\nStarting deployment...")
    success = deploy_nginx()
    
    if success:
        print("\n✅ Deployment successful!")
    else:
        print("\n❌ Deployment failed. Please check the errors above.")

if __name__ == "__main__":
    main()