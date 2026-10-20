#!/usr/bin/env python3
"""
Servidor HTTP Local Multi-Dispositivo para el Simulador Philips Efficia DFM100
Propiedad de Alberto Á. Garra
"""
import http.server
import socket
import socketserver
import webbrowser
import os
import sys
import subprocess

PORT = 8080

def get_lan_ip():
    """Detecta la IP local de la interfaz Wi-Fi / Ethernet real"""
    try:
        # Consultar PowerShell para obtener la IP del adaptador Wi-Fi de Windows
        cmd = "powershell -NoProfile -Command \"(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { ($_.InterfaceAlias -match 'Wi-Fi|Ethernet|WLAN' -or $_.IPAddress -match '^(192\\.168\\.|10\\.|172\\.)') -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|Virtual|Host-Only|HotspotShield|Tap|Tun' -and $_.IPAddress -notmatch '^(169\\.|100\\.)' } | Select-Object -First 1).IPAddress\""
        out = subprocess.check_output(cmd, shell=True, text=True).strip()
        if out and "." in out:
            return out
    except Exception:
        pass
    
    # Fallback tradicional por socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.1.201"

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    lan_ip = get_lan_ip()

    print("\n" + "=" * 68)
    print("   SIMULADOR CLINICO PHILIPS EFFICIA DFM100")
    print("   Propiedad de Alberto A. Garra")
    print("=" * 68 + "\n")
    print(f"  [PC - INSTRUCTOR]:")
    print(f"      http://localhost:{PORT}/instructor.html\n")
    print(f"  [TABLET - ALUMNO] (en la misma red Wi-Fi):")
    print(f"      http://{lan_ip}:{PORT}/student.html\n")
    print(f"  [VISTA DUAL EN PC]:")
    print(f"      http://localhost:{PORT}/split-demo.html\n")
    print("-" * 68)
    print("  COMO VINCULAR PC Y TABLET:")
    print("  1. En la tablet, abre: http://" + lan_ip + f":{PORT}/student.html")
    print("  2. Arriba a la derecha en la tablet veras un PIN de 4 letras.")
    print("  3. En este PC, haz clic en 'PIN: ----' en el panel e introducelo.")
    print("=" * 68)
    print("  Presiona Ctrl + C para detener el servidor.\n")

    # Abrir automáticamente el panel del instructor en este PC
    try:
        webbrowser.open(f"http://localhost:{PORT}/instructor.html")
    except Exception:
        pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), CORSHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")

if __name__ == '__main__':
    main()
