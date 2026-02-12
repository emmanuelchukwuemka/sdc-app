#!/usr/bin/env python3
import paramiko

def check_status():
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, username=username, password=password)
        print(f"Connected to {hostname}")
        
        commands = [
            "systemctl status sdc-backend.service",
            "journalctl -u sdc-backend.service -n 20",
            "netstat -tuln | grep 5000"
        ]
        
        for cmd in commands:
            print(f"\n--- {cmd} ---")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            print(stdout.read().decode())
            print(stderr.read().decode())
            
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_status()
