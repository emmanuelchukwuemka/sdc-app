#!/usr/bin/env python3
import paramiko

def capture_logs():
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, username=username, password=password)
        print(f"Connected to {hostname}")
        
        cmd = "sudo journalctl -u sdc-backend.service -n 100 --no-pager"
        stdin, stdout, stderr = ssh.exec_command(cmd)
        logs = stdout.read().decode()
        errors = stderr.read().decode()
        
        with open("backend_logs.txt", "w") as f:
            f.write("--- STDOUT ---\n")
            f.write(logs)
            f.write("\n--- STDERR ---\n")
            f.write(errors)
            
        print("Logs captured to backend_logs.txt")
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    capture_logs()
