import paramiko
import sys

def get_logs():
    hostname = "72.62.4.119"
    username = "root"
    password = "Mathscrusader123."
    
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname, username=username, password=password, timeout=10)
        
        stdin, stdout, stderr = client.exec_command("journalctl -u sdc-backend.service -n 100 --no-pager")
        print("--- FULL LOGS ---")
        for line in stdout:
            print(line.strip())
        print("--- END FULL LOGS ---")
        
        err = stderr.read().decode()
        if err:
            print("--- SERVER ERRORS ---")
            print(err)
        if error:
            print("--- ERRORS ---")
            print(error)
        
        client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_logs()
