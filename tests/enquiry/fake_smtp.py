"""Fake ESMTP server for the enquiry handler tests. Not deployed.

Speaks just enough of RFC 5321 for enquiry.php: EHLO, STARTTLS (real TLS with the
self-signed cert in this directory), AUTH LOGIN, MAIL/RCPT/DATA, RSET, QUIT.

Every accepted message and every AUTH attempt is written to --state (JSON), so a
test can assert on what the server actually received rather than on what the
handler claims it sent.

Fault modes live in a control file (--control, JSON) that is re-read on every
connection, so a test can "fix the server" between attempts without a restart:

    {
      "auth_reject": false,            # answer AUTH with 535 5.7.8
      "rcpt_reject": ["b@x.test"],     # answer RCPT for these with 550 5.1.1
      "drop_after": null,              # close the connection after N accepted messages
      "greeting_delay": 0,             # seconds to sleep before the 220 greeting
      "keep_data": false               # also store each message's full text under "data"
    }
"""

import argparse
import base64
import json
import os
import socket
import ssl
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
STATE_LOCK = threading.Lock()


class Conn:
    """Line reader over a socket that survives the STARTTLS socket swap."""

    def __init__(self, sock):
        self.sock = sock
        self.buf = b""

    def upgrade(self, ctx):
        self.sock = ctx.wrap_socket(self.sock, server_side=True)
        self.buf = b""

    def send(self, text):
        self.sock.sendall(text.encode() + b"\r\n")

    def _fill(self):
        chunk = self.sock.recv(65536)
        if not chunk:
            raise ConnectionError("client closed")
        self.buf += chunk

    def readline(self):
        while b"\r\n" not in self.buf:
            self._fill()
        line, self.buf = self.buf.split(b"\r\n", 1)
        return line.decode(errors="replace")

    def read_data(self):
        while b"\r\n.\r\n" not in self.buf:
            self._fill()
        data, self.buf = self.buf.split(b"\r\n.\r\n", 1)
        return data.decode(errors="replace")


def load_control(path):
    try:
        with open(path, encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return {}


def update_state(path, mutate):
    with STATE_LOCK:
        try:
            with open(path, encoding="utf-8") as handle:
                state = json.load(handle)
        except (OSError, ValueError):
            state = {"connections": 0, "auth": 0, "messages": []}
        mutate(state)
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(state, handle)


def header_value(message, name):
    for line in message.split("\r\n"):
        if line == "":
            break
        if line.lower().startswith(name.lower() + ":"):
            return line.split(":", 1)[1].strip()
    return ""


def serve(sock, args, ctx):
    control = load_control(args.control)
    conn = Conn(sock)
    update_state(args.state, lambda s: s.__setitem__("connections", s["connections"] + 1))
    delivered_here = 0
    try:
        delay = float(control.get("greeting_delay", 0) or 0)
        if delay:
            time.sleep(delay)
        conn.send("220 fake.smtp.test ESMTP ready")
        rcpt = None
        while True:
            line = conn.readline()
            verb = line.split(" ", 1)[0].upper()
            drop_after = control.get("drop_after")
            if drop_after is not None and delivered_here >= drop_after:
                return  # simulates the server hanging up mid-session
            if verb == "EHLO":
                if isinstance(conn.sock, ssl.SSLSocket):
                    conn.send("250-fake.smtp.test\r\n250-AUTH LOGIN\r\n250 8BITMIME")
                else:
                    conn.send("250-fake.smtp.test\r\n250-STARTTLS\r\n250 8BITMIME")
            elif verb == "STARTTLS":
                conn.send("220 2.0.0 Ready to start TLS")
                conn.upgrade(ctx)
            elif verb == "AUTH":
                conn.send("334 VXNlcm5hbWU6")
                conn.readline()
                conn.send("334 UGFzc3dvcmQ6")
                conn.readline()
                update_state(args.state, lambda s: s.__setitem__("auth", s["auth"] + 1))
                if control.get("auth_reject"):
                    conn.send("535 5.7.8 Username and Password not accepted")
                else:
                    conn.send("235 2.7.0 Accepted")
            elif verb == "MAIL":
                conn.send("250 2.1.0 OK")
            elif verb == "RCPT":
                rcpt = line[line.index("<") + 1 : line.index(">")]
                if rcpt.lower() in [r.lower() for r in control.get("rcpt_reject", [])]:
                    conn.send("550 5.1.1 The email account that you tried to reach does not exist")
                else:
                    conn.send("250 2.1.5 OK")
            elif verb == "DATA":
                conn.send("354 Go ahead")
                message = conn.read_data()
                record = {"rcpt": rcpt, "subject": header_value(message, "Subject"), "to": header_value(message, "To"), "t": time.time()}
                if control.get("keep_data"):
                    record["data"] = message
                update_state(args.state, lambda s: s["messages"].append(record))
                delivered_here += 1
                conn.send("250 2.0.0 OK queued")
            elif verb == "RSET":
                conn.send("250 2.0.0 OK")
            elif verb == "QUIT":
                conn.send("221 2.0.0 Bye")
                return
            else:
                conn.send("502 5.5.1 Unrecognized command")
    except (ConnectionError, OSError, ssl.SSLError):
        pass
    finally:
        try:
            conn.sock.close()
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--state", required=True)
    parser.add_argument("--control", required=True)
    args = parser.parse_args()

    with open(args.state, "w", encoding="utf-8") as handle:
        json.dump({"connections": 0, "auth": 0, "messages": []}, handle)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(os.path.join(HERE, "test-cert.pem"), os.path.join(HERE, "test-key.pem"))

    listener = socket.socket()
    listener.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    listener.bind(("127.0.0.1", args.port))
    listener.listen(16)
    print("READY", flush=True)
    while True:
        client, _ = listener.accept()
        threading.Thread(target=serve, args=(client, args, ctx), daemon=True).start()


if __name__ == "__main__":
    main()
