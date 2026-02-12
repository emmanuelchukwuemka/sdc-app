#!/usr/bin/env python3
import paramiko

def audit_server():
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, username=username, password=password)
        print(f"Connected to {hostname}\n")
        
        commands = [
            "ufw status",
            "sudo systemctl list-units --type=service | grep sdc",
            "sudo systemctl status sdc-backend.service",
            "sudo journalctl -u sdc-backend.service -n 50 --no-pager",
            "ss -tuln | grep 5000",
            "ls -R /home/deploy/sdc-backend"
        ]
        
        for cmd in commands:
            print(f"--- COMMAND: {cmd} ---")
            stdin, stdout, stderr = ssh.exec_command(cmd)
            out = stdout.read().decode()
            err = stderr.read().decode()
            if out: print(out)
            if err: print(f"ERROR: {err}")
            print("-" * 30 + "\n")
            
        ssh.close()
    except Exception as e:
        print(f"Critical Error: {e}")

if __name__ == "__main__":
    audit_server()
