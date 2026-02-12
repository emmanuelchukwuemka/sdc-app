#!/usr/bin/env python3
import paramiko
import sys

def run_cmd(ssh, cmd):
    print(f"\n>>>> EXECUTING: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: 
        print("STDOUT:")
        print(out)
    if err: 
        print("STDERR:")
        print(err)
    sys.stdout.flush()

def diag():
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(hostname, username=username, password=password)
        print(f"Connected to {hostname}")
        
        run_cmd(ssh, "ufw status")
        run_cmd(ssh, "systemctl is-active sdc-backend.service")
        run_cmd(ssh, "systemctl status sdc-backend.service --no-pager")
        run_cmd(ssh, "ss -tuln | grep 5000")
        run_cmd(ssh, "journalctl -u sdc-backend.service -n 20 --no-pager")
        
        ssh.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diag()
