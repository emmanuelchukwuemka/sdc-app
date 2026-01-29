#!/usr/bin/env python3
"""
Deployment script for SDC Mobile Backend
This script deploys the backend to a remote server with available port detection
"""
import os
import sys
import subprocess
import socket
import paramiko
import threading
import time
from getpass import getpass
import tempfile
import shutil
import zipfile
import io

class BackendDeployer:
    def __init__(self, hostname, username, password, local_backend_path):
        self.hostname = hostname
        self.username = username
        self.password = password
        self.local_backend_path = local_backend_path
        self.ssh_client = None
        self.sftp_client = None
        
    def check_port_availability(self, port):
        """Check if a port is available on the remote server"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex((self.hostname, port))
            sock.close()
            return result != 0  # Port is available if connect_ex returns non-zero
        except Exception:
            return False
    
    def find_available_port(self, start_port=5000, max_port=6000):
        """Find an available port in the given range"""
        print(f"Searching for available port between {start_port} and {max_port}...")
        
        # Create a separate SSH client to check port availability
        temp_ssh = paramiko.SSHClient()
        temp_ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        temp_ssh.connect(
            hostname=self.hostname,
            username=self.username,
            password=self.password
        )
        
        for port in range(start_port, max_port + 1):
            try:
                # Try to check if port is in use by attempting to run netstat
                stdin, stdout, stderr = temp_ssh.exec_command(f"netstat -tuln | grep :{port}")
                output = stdout.read().decode()
                
                if not output.strip():  # Port is not in use
                    print(f"Port {port} is available")
                    temp_ssh.close()
                    return port
            except Exception as e:
                print(f"Error checking port {port}: {e}")
                continue
        
        temp_ssh.close()
        raise Exception(f"No available ports found between {start_port} and {max_port}")
    
    def zip_directory(self, directory_path):
        """Create a zip of the backend directory"""
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for root, dirs, files in os.walk(directory_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, directory_path)
                    zip_file.write(file_path, arcname)
        zip_buffer.seek(0)
        return zip_buffer
    
    def connect_to_server(self):
        """Establish SSH connection to the server"""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.ssh_client.connect(
                hostname=self.hostname,
                username=self.username,
                password=self.password
            )
            self.sftp_client = self.ssh_client.open_sftp()
            print(f"Connected to {self.hostname}")
        except Exception as e:
            raise Exception(f"Failed to connect to server: {e}")
    
    def check_dependencies(self):
        """Check if required dependencies are installed on the server"""
        print("Checking server dependencies...")
        
        # Check Python
        stdin, stdout, stderr = self.ssh_client.exec_command("python3 --version")
        python_version = stdout.read().decode().strip()
        print(f"Python version: {python_version}")
        
        # Check pip
        stdin, stdout, stderr = self.ssh_client.exec_command("pip3 --version")
        pip_version = stdout.read().decode().strip()
        print(f"Pip version: {pip_version}")
        
        # Install pip if not available
        if not pip_version:
            print("Installing pip...")
            stdin, stdout, stderr = self.ssh_client.exec_command("sudo apt update && sudo apt install -y python3-pip")
            stdout.channel.recv_exit_status()
        
        # Check if virtualenv is installed
        stdin, stdout, stderr = self.ssh_client.exec_command("pip3 show virtualenv")
        if not stdout.read().decode():
            print("Installing virtualenv...")
            stdin, stdout, stderr = self.ssh_client.exec_command("pip3 install virtualenv")
            stdout.channel.recv_exit_status()
    
    def upload_backend(self, remote_path="/home/deploy/sdc-backend"):
        """Upload backend files to the server"""
        print(f"Uploading backend files to {remote_path}...")
        
        # Create remote directory
        stdin, stdout, stderr = self.ssh_client.exec_command(f"mkdir -p {remote_path}")
        stdout.channel.recv_exit_status()
        
        # Zip local backend directory
        zip_buffer = self.zip_directory(self.local_backend_path)
        
        # Upload zip file
        remote_zip_path = f"{remote_path}/backend.zip"
        with self.sftp_client.open(remote_zip_path, 'wb') as remote_file:
            remote_file.write(zip_buffer.read())
        
        # Extract the zip file
        stdin, stdout, stderr = self.ssh_client.exec_command(f"cd {remote_path} && unzip -o backend.zip && rm backend.zip")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            raise Exception(f"Failed to extract backend files: {stderr.read().decode()}")
        
        print("Backend files uploaded and extracted successfully")
    
    def setup_virtual_env(self, remote_path="/home/deploy/sdc-backend"):
        """Setup Python virtual environment and install dependencies"""
        print("Setting up virtual environment and installing dependencies...")
        
        # Create virtual environment
        stdin, stdout, stderr = self.ssh_client.exec_command(f"cd {remote_path} && python3 -m venv venv")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            raise Exception(f"Failed to create virtual environment: {stderr.read().decode()}")
        
        # Install dependencies
        stdin, stdout, stderr = self.ssh_client.exec_command(f"cd {remote_path} && source venv/bin/activate && pip install -r requirements.txt")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            print(f"Warning: Some packages failed to install: {stderr.read().decode()}")
            # Continue anyway, some packages might be OS-specific
        
        # Install common packages that might be missing
        install_commands = [
            "source venv/bin/activate && pip install flask flask-cors flask-jwt-extended flask-socketio flask-sqlalchemy bcrypt python-dotenv",
            "source venv/bin/activate && pip install gunicorn"
        ]
        
        for cmd in install_commands:
            stdin, stdout, stderr = self.ssh_client.exec_command(f"cd {remote_path} && {cmd}")
            exit_status = stdout.channel.recv_exit_status()
    
    def create_service_file(self, port, remote_path="/home/deploy/sdc-backend"):
        """Create a systemd service file for the backend"""
        service_content = f"""[Unit]
Description=SDC Mobile Backend
After=network.target

[Service]
Type=simple
User={self.username}
WorkingDirectory={remote_path}
Environment=PATH={remote_path}/venv/bin
ExecStart={remote_path}/venv/bin/gunicorn --bind 0.0.0.0:{port} --workers 2 --timeout 120 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target"""

        # Create service file directly on the server
        service_filename = "sdc-backend.service"
        remote_service_path = f"/tmp/{service_filename}"
        
        # Write the service content to a temporary file on the server
        # First create the file with the content
        stdin, stdout, stderr = self.ssh_client.exec_command(f'cat > {remote_service_path}')
        stdin.write(service_content)
        stdin.flush()
        stdin.channel.shutdown_write()
        
        # Wait for the command to complete
        exit_status = stdout.channel.recv_exit_status()
        
        # Move to systemd directory
        stdin, stdout, stderr = self.ssh_client.exec_command(f"sudo mv {remote_service_path} /etc/systemd/system/")
        stdout.channel.recv_exit_status()
        
        # Reload systemd
        stdin, stdout, stderr = self.ssh_client.exec_command("sudo systemctl daemon-reload")
        stdout.channel.recv_exit_status()
        
        # Enable the service
        stdin, stdout, stderr = self.ssh_client.exec_command("sudo systemctl enable sdc-backend.service")
        stdout.channel.recv_exit_status()
        
        print(f"Service file created and enabled for port {port}")
    
    def start_backend_service(self):
        """Start the backend service"""
        print("Starting backend service...")
        stdin, stdout, stderr = self.ssh_client.exec_command("sudo systemctl start sdc-backend.service")
        exit_status = stdout.channel.recv_exit_status()
        if exit_status != 0:
            raise Exception(f"Failed to start service: {stderr.read().decode()}")
        
        # Wait a bit for the service to start
        time.sleep(5)
        
        # Check service status
        stdin, stdout, stderr = self.ssh_client.exec_command("sudo systemctl status sdc-backend.service")
        status_output = stdout.read().decode()
        print("Service status:")
        print(status_output)
    
    def deploy(self):
        """Main deployment method"""
        try:
            print("Starting backend deployment...")
            
            # Connect to server
            self.connect_to_server()
            
            # Find available port
            available_port = self.find_available_port()
            print(f"Using available port: {available_port}")
            
            # Check dependencies
            self.check_dependencies()
            
            # Upload backend files
            self.upload_backend()
            
            # Setup virtual environment and install dependencies
            self.setup_virtual_env()
            
            # Create service file
            self.create_service_file(available_port)
            
            # Start the service
            self.start_backend_service()
            
            print(f"\nDeployment completed successfully!")
            print(f"Backend is running on port {available_port}")
            print(f"Access it at: http://{self.hostname}:{available_port}")
            
            return available_port
            
        except Exception as e:
            print(f"Deployment failed: {e}")
            raise
        finally:
            if self.ssh_client:
                self.ssh_client.close()
            if self.sftp_client:
                self.sftp_client.close()


def main():
    # Server details
    hostname = "72.62.4.119"
    username = "root"
    
    # Local backend path
    local_backend_path = os.path.abspath("./backend")  # Adjust this path as needed
    
    if not os.path.exists(local_backend_path):
        print(f"Backend directory does not exist: {local_backend_path}")
        return
    
    # Get password securely
    password = getpass("Enter server password: ")
    
    # Create deployer instance
    deployer = BackendDeployer(hostname, username, password, local_backend_path)
    
    # Deploy the backend
    try:
        port = deployer.deploy()
        print(f"\nDeployment successful! Backend running on {hostname}:{port}")
    except Exception as e:
        print(f"Deployment failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()