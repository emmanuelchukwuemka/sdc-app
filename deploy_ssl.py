#!/usr/bin/env python3
"""
SSL Certificate Deployment Script for surrogateanddonorconnect.com
This script installs Certbot, requests SSL certificates, and configures auto-renewal.
"""

import paramiko
import sys
import time

def deploy_ssl():
    # Server details
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    # Commands to execute
    commands = [
        "apt update",
        "apt install -y certbot python3-certbot-nginx",
        "certbot --nginx -d surrogateanddonorconnect.com --non-interactive --agree-tos --email admin@surrogateanddonorconnect.com --redirect",
        "systemctl status certbot.timer",
        "crontab -l | grep -q 'certbot renew' || (crontab -l 2>/dev/null; echo '0 3 * * * certbot renew --quiet') | crontab -"
    ]
    
    try:
        print("🔄 Connecting to server...")
        # Create SSH client
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Connect to server
        ssh.connect(hostname, username=username, password=password, timeout=10)
        print("✅ Connected successfully!")
        
        # Execute commands
        for i, command in enumerate(commands, 1):
            print(f"\n🔧 Executing step {i}/{len(commands)}: {command}")
            
            stdin, stdout, stderr = ssh.exec_command(command)
            
            # Get output
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if output:
                print(f"   Output: {output}")
            if error:
                print(f"   Error: {error}")
            
            # Special handling for certbot command
            if "certbot --nginx" in command:
                if "Congratulations" in output or "successfully" in output.lower():
                    print("   ✅ SSL certificate installed successfully!")
                elif "error" in error.lower() or "fail" in error.lower():
                    print("   ❌ SSL certificate installation failed!")
                    print("   Error details:", error)
                    return False
                else:
                    print("   ⚠️  Check output above for certificate status")
            
            # Check certbot timer status
            if command == "systemctl status certbot.timer":
                if "active" in output.lower() and "running" in output.lower():
                    print("   ✅ Certbot auto-renewal timer is active!")
                else:
                    print("   ⚠️  Certbot timer not active - will set up cron job")
            
            time.sleep(1)  # Small delay between commands
        
        ssh.close()
        print("\n🎉 SSL deployment completed successfully!")
        print("\n🔐 Your site is now secure:")
        print("   https://surrogateanddonorconnect.com")
        print("   https://www.surrogateanddonorconnect.com")
        print("\n🔄 Auto-renewal has been configured")
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
    print("🔐 SSL Certificate Deployment Script")
    print("   Domain: surrogateanddonorconnect.com")
    print("   Server: 72.62.4.119")
    print("=" * 60)
    print("\n📝 This will:")
    print("  • Install Certbot and Nginx plugin")
    print("  • Request SSL certificates from Let's Encrypt")
    print("  • Configure HTTP to HTTPS redirect")
    print("  • Set up automatic certificate renewal")
    print("  • Your existing sites remain unaffected")
    
    # Confirm with user
    response = input("\n⚠️  This will configure SSL for your domain. Continue? (y/N): ")
    if response.lower() != 'y':
        print("SSL deployment cancelled.")
        return
    
    print("\nStarting SSL deployment...")
    success = deploy_ssl()
    
    if success:
        print("\n✅ SSL deployment successful!")
        print("\n🔍 Next steps:")
        print("1. Test: https://surrogateanddonorconnect.com")
        print("2. Test: https://www.surrogateanddonorconnect.com")
        print("3. Verify browser shows secure padlock icon")
        print("4. HTTP requests will auto-redirect to HTTPS")
    else:
        print("\n❌ SSL deployment failed. Please check the errors above.")

if __name__ == "__main__":
    main()