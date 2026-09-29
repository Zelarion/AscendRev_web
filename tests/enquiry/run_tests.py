"""Delivery tests for public/api/enquiry.php. Not deployed.

Each case builds a throwaway "account" that mirrors the cPanel layout:

    <tmp>/public_html/api/enquiry.php      copy of the handler under test
    <tmp>/public_html/email-header.jpg
    <tmp>/ascendrev-enquiry.config.php     ABOVE the docroot, like production
    <tmp>/ascendrev-enquiries/             storage, created by the handler

and a fake SMTP server (fake_smtp.py) speaking real STARTTLS. Assertions are made
against what the fake server received, not against what the handler reports.

Which code path each case covers:
    php -S (cases 1-8, 11-13)  no finish-request function -> SYNC fallback
    php-cgi in parallel (3)    real process concurrency on the per-key flock, SYNC
    php CLI + bootstrap (10)   a stand-in litespeed_finish_request() -> BACKGROUND
    php CLI `retry` (5-8, 12)  the cron RETRY path

Run:  python run_tests.py
"""

import http.client
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.abspath(os.path.join(HERE, "..", ".."))
HANDLER = os.path.join(WEB, "public", "api", "enquiry.php")
HEADER_IMAGE = os.path.join(WEB, "public", "email-header.jpg")
PHP = os.environ.get("PHP_BIN", r"C:\xampp\php\php.exe")
PHP_CGI = os.environ.get("PHP_CGI_BIN", r"C:\xampp\php\php-cgi.exe")
PY = sys.executable

RCPT_A = "a@ascend-test.example"
RCPT_B = "b@ascend-test.example"
SMTP_USER = "smtp-user-9f3k@example.test"
SMTP_PASS = "S3cretPassw0rd-xyz"
SUBJECT = "[AscendRev] Enquiry from Jane Doe at Acme Corp"


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_port(port, timeout=15):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.5):
                return
        except OSError:
            time.sleep(0.1)
    raise RuntimeError("port %d never opened" % port)


def form(key, **overrides):
    data = {
        "individualName": "Jane Doe",
        "businessEmail": "jane@acme-corp.example",
        "entityName": "Acme Corp",
        "bestNumberToCall": "4165550123",
        "comments": "Test comment",
        "idempotencyKey": key,
    }
    data.update(overrides)
    return data


class Account:
    """One isolated hosting account plus its fake SMTP server."""

    def __init__(self, cafile=True, php_server=True):
        self.base = tempfile.mkdtemp(prefix="enquiry-test-", dir=os.environ.get("ENQUIRY_TEST_TMP"))
        self.docroot = os.path.join(self.base, "public_html")
        self.storage = os.path.join(self.base, "ascendrev-enquiries")
        os.makedirs(os.path.join(self.docroot, "api"))
        self.handler = os.path.join(self.docroot, "api", "enquiry.php")
        shutil.copy(HANDLER, self.handler)
        shutil.copy(HEADER_IMAGE, os.path.join(self.docroot, "email-header.jpg"))

        self.smtp_port = free_port()
        self.smtp_state = os.path.join(self.base, "smtp-state.json")
        self.control = os.path.join(self.base, "smtp-control.json")
        self.set_faults()
        self.smtp = subprocess.Popen(
            [PY, os.path.join(HERE, "fake_smtp.py"), "--port", str(self.smtp_port),
             "--state", self.smtp_state, "--control", self.control],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        self.smtp.stdout.readline()  # READY

        settings = {
            "ASCENDREV_ENQUIRY_TO": "%s,%s" % (RCPT_A, RCPT_B),
            "ASCENDREV_SMTP_HOST": "127.0.0.1",
            "ASCENDREV_SMTP_PORT": str(self.smtp_port),
            "ASCENDREV_SMTP_USER": SMTP_USER,
            "ASCENDREV_SMTP_PASS": SMTP_PASS,
            "ASCENDREV_ENQUIRY_FROM": "sender@example.test",
            "ASCENDREV_ALLOWED_HOSTS": "localhost,127.0.0.1",
            "ASCENDREV_RATE_LIMIT_MAX": "1000",
        }
        if cafile:
            settings["ASCENDREV_SMTP_CAFILE"] = os.path.join(HERE, "test-cert.pem").replace("\\", "/")
        lines = ["<?php return ["] + ["    %s => %s," % (json.dumps(k), json.dumps(v)) for k, v in settings.items()] + ["];"]
        with open(os.path.join(self.base, "ascendrev-enquiry.config.php"), "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")

        self.web = None
        if php_server:
            self.web_port = free_port()
            self.web = subprocess.Popen(
                [PHP, "-S", "127.0.0.1:%d" % self.web_port, "-t", self.docroot],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            wait_port(self.web_port)

    # -- fake SMTP -----------------------------------------------------------
    def set_faults(self, **faults):
        with open(self.control, "w", encoding="utf-8") as handle:
            json.dump(faults, handle)

    def smtp_seen(self):
        with open(self.smtp_state, encoding="utf-8") as handle:
            return json.load(handle)

    def delivered_to(self, address):
        return [m for m in self.smtp_seen()["messages"] if m["rcpt"] == address]

    # -- handler -------------------------------------------------------------
    def post(self, fields):
        conn = http.client.HTTPConnection("127.0.0.1", self.web_port, timeout=60)
        payload = urllib.parse.urlencode(fields)
        started = time.time()
        conn.request("POST", "/api/enquiry.php", payload, {
            "Content-Type": "application/x-www-form-urlencoded",
            "Origin": "http://localhost",
            "Accept": "application/json",
        })
        response = conn.getresponse()
        text = response.read().decode()
        elapsed = time.time() - started
        conn.close()
        try:
            return response.status, json.loads(text), elapsed
        except ValueError:
            return response.status, {"raw": text}, elapsed

    def cgi_post(self, fields):
        """One handler run as its own process, for genuine concurrency."""
        payload = urllib.parse.urlencode(fields).encode()
        env = dict(os.environ)
        env.update({
            "REDIRECT_STATUS": "1", "GATEWAY_INTERFACE": "CGI/1.1", "REQUEST_METHOD": "POST",
            "SCRIPT_FILENAME": self.handler, "SCRIPT_NAME": "/api/enquiry.php",
            "DOCUMENT_ROOT": self.docroot, "CONTENT_TYPE": "application/x-www-form-urlencoded",
            "CONTENT_LENGTH": str(len(payload)), "HTTP_ORIGIN": "http://localhost",
            "REMOTE_ADDR": "127.0.0.1", "SERVER_PROTOCOL": "HTTP/1.1",
        })
        done = subprocess.run([PHP_CGI, "-q"], input=payload, env=env, capture_output=True, timeout=120)
        # php-cgi prints the response headers, a blank line, then the body.
        text = done.stdout.decode()
        try:
            return json.loads(text.split("\r\n\r\n", 1)[-1])
        except ValueError:
            return {"raw": text, "err": done.stderr.decode()}

    def retry(self, min_age=None):
        env = dict(os.environ)
        if min_age is not None:
            env["ASCENDREV_RETRY_MIN_AGE_SECONDS"] = str(min_age)
        done = subprocess.run([PHP, self.handler, "retry"], env=env, capture_output=True, timeout=120, cwd=self.base)
        return done.stdout.decode().strip(), done.returncode

    # -- storage -------------------------------------------------------------
    def log(self):
        try:
            with open(os.path.join(self.storage, "enquiry.log"), encoding="utf-8") as handle:
                return handle.read()
        except OSError:
            return ""

    def state_path(self):
        names = [n for n in os.listdir(self.storage) if n.startswith("delivery-") and n.endswith(".json")]
        assert len(names) == 1, names
        return os.path.join(self.storage, names[0])

    def state(self):
        with open(self.state_path(), encoding="utf-8") as handle:
            return json.load(handle)

    def write_state(self, state):
        with open(self.state_path(), "w", encoding="utf-8") as handle:
            json.dump(state, handle)

    def lock_path(self):
        return self.state_path().replace("delivery-", "submission-").replace(".json", ".lock")

    def close(self):
        for proc in (self.web, self.smtp):
            if proc is not None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
        shutil.rmtree(self.base, ignore_errors=True)


# -- cases -------------------------------------------------------------------
# Each case returns a list of (description, passed, detail).

def check(description, passed, detail=""):
    return (description, bool(passed), detail)


def happy_path(expected_messages):
    acct = Account()
    try:
        status, body, elapsed = acct.post(form("case1-key"))
        seen = acct.smtp_seen()
        return [
            check("HTTP 200 and mailed", status == 200 and body.get("mailed") is True, "%s %s" % (status, body)),
            check("exactly %d messages accepted" % expected_messages,
                  len(seen["messages"]) == expected_messages, "got %d" % len(seen["messages"])),
            check("one AUTH in total", seen["auth"] == 1, "auth=%d" % seen["auth"]),
            check("one connection in total", seen["connections"] == 1, "connections=%d" % seen["connections"]),
            check("each recipient got a message",
                  len(acct.delivered_to(RCPT_A)) == 1 and len(acct.delivered_to(RCPT_B)) == 1),
            check("log has delivery_attempt accepted=2 required=2 mode=sync",
                  "delivery_attempt accepted=2 required=2 mode=sync ms=" in acct.log(), acct.log()),
            check("state records attempts=1", acct.state().get("attempts") == 1, str(acct.state())),
        ]
    finally:
        acct.close()


def case1():
    return happy_path(2)


def case2():
    acct = Account()
    try:
        first = acct.post(form("case2-key"))
        second = acct.post(form("case2-key"))
        seen = acct.smtp_seen()
        return [
            check("first response 200 mailed", first[0] == 200 and first[1].get("mailed") is True, str(first[:2])),
            check("second response 200 mailed (replay)", second[0] == 200 and second[1].get("mailed") is True, str(second[:2])),
            check("exactly 2 messages in total", len(seen["messages"]) == 2, "got %d" % len(seen["messages"])),
            check("replay opened no second SMTP session", seen["connections"] == 1, "connections=%d" % seen["connections"]),
        ]
    finally:
        acct.close()


def case3():
    acct = Account(php_server=False)
    try:
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda _: acct.cgi_post(form("case3-key")), range(5)))
        seen = acct.smtp_seen()
        return [
            check("all 5 processes answered ok", all(r.get("ok") is True for r in results), str(results)),
            check("exactly 2 messages in total", len(seen["messages"]) == 2, "got %d" % len(seen["messages"])),
            check("one SMTP session in total", seen["connections"] == 1, "connections=%d" % seen["connections"]),
            check("one CSV row", open(os.path.join(acct.storage, "enquiries.csv"), encoding="utf-8").read().count("Jane Doe") == 1),
        ]
    finally:
        acct.close()


def case4():
    acct = Account()
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        status, body, _ = acct.post(form("case4-key"))
        return [
            check("sync mode answers 503 delivery_incomplete", status == 503 and body.get("error") == "delivery_incomplete", "%s %s" % (status, body)),
            check("A delivered", len(acct.delivered_to(RCPT_A)) == 1),
            check("B not delivered", len(acct.delivered_to(RCPT_B)) == 0),
            check("log has smtp_failed stage=rcpt code=550 enhanced=5.1.1",
                  "smtp_failed stage=rcpt code=550 enhanced=5.1.1" in acct.log(), acct.log()),
            check("state accepted=1", len(acct.state()["accepted"]) == 1, str(acct.state())),
            check("session survived the reject (one connection)", acct.smtp_seen()["connections"] == 1),
        ]
    finally:
        acct.close()


def case5():
    acct = Account()
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        acct.post(form("case5-key"))
        acct.set_faults()  # fix the server
        out_early, _ = acct.retry()
        early_ok = len(acct.delivered_to(RCPT_B)) == 0

        state = acct.state()
        state["last_attempt_at"] -= 500  # past the 120s backoff
        acct.write_state(state)
        out, code = acct.retry()
        return [
            check("retry before backoff elapsed sends nothing", "attempted=0" in out_early and early_ok, out_early),
            check("retry after backoff exits 0 and attempts 1", code == 0 and "attempted=1" in out, out),
            check("B delivered", len(acct.delivered_to(RCPT_B)) == 1),
            check("A not re-sent (A=1, B=1)", len(acct.delivered_to(RCPT_A)) == 1 and len(acct.delivered_to(RCPT_B)) == 1,
                  str(acct.smtp_seen()["messages"])),
            check("state complete, attempts=2", len(acct.state()["accepted"]) == 2 and acct.state()["attempts"] == 2, str(acct.state())),
            check("log has mode=retry attempt", "mode=retry" in acct.log(), acct.log()),
            check("retry rebuilt the same subject", all(m["subject"] == SUBJECT for m in acct.smtp_seen()["messages"]),
                  str(acct.smtp_seen()["messages"])),
        ]
    finally:
        acct.close()


def case6():
    acct = Account()
    try:
        acct.set_faults(auth_reject=True)
        status, body, _ = acct.post(form("case6-key"))
        log = acct.log()
        state_text = open(acct.state_path(), encoding="utf-8").read()
        leaks = [s for s in (SMTP_USER, SMTP_PASS, RCPT_A, RCPT_B, "Jane Doe", "acme-corp", "Acme Corp",
                             "Username and Password not accepted") if s in log or s in state_text]
        return [
            check("503 and nothing delivered", status == 503 and acct.smtp_seen()["messages"] == [], "%s %s" % (status, body)),
            check("log has stage=auth code=535 enhanced=5.7.8", "smtp_failed stage=auth code=535 enhanced=5.7.8" in log, log),
            check("log and state contain no user, password, recipient, field or reply text", leaks == [], str(leaks)),
        ]
    finally:
        acct.close()


def case7():
    acct = Account()
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        acct.post(form("case7-key"))
        for _ in range(7):  # attempts 2..8
            acct.retry(min_age=0)
        state = acct.state()
        connections_at_abandon = acct.smtp_seen()["connections"]
        outs = [acct.retry(min_age=0)[0] for _ in range(3)]
        log = acct.log()
        return [
            check("state terminal=abandoned with attempts=8", state.get("terminal") == "abandoned" and state.get("attempts") == 8, str(state)),
            check("log has delivery_abandoned attempts=8", "delivery_abandoned attempts=8" in log, log),
            check("A delivered exactly once, B never", len(acct.delivered_to(RCPT_A)) == 1 and len(acct.delivered_to(RCPT_B)) == 0),
            check("further retry runs attempt nothing", all("attempted=0" in o for o in outs), str(outs)),
            check("further retry runs opened no SMTP session", acct.smtp_seen()["connections"] == connections_at_abandon),
            check("attempt count did not grow", acct.state()["attempts"] == 8),
        ]
    finally:
        acct.close()


def case8():
    acct = Account()
    holder = None
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        acct.post(form("case8-key"))
        acct.set_faults()
        connections_before = acct.smtp_seen()["connections"]

        holder = subprocess.Popen(
            [PHP, "-r", "$h = fopen($argv[1], 'c'); flock($h, LOCK_EX); echo \"HELD\\n\"; flush(); sleep(20);", acct.lock_path()],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        holder.stdout.readline()
        busy_out, _ = acct.retry(min_age=0)
        busy_ok = acct.smtp_seen()["connections"] == connections_before and len(acct.delivered_to(RCPT_B)) == 0
        holder.terminate()
        holder.wait(timeout=10)
        holder = None
        free_out, _ = acct.retry(min_age=0)
        return [
            check("retry skips a submission whose lock is held", "busy=1" in busy_out and "attempted=0" in busy_out, busy_out),
            check("skipped retry opened no SMTP session and sent nothing", busy_ok),
            check("log records the busy skip", "delivery_retry_skipped reason=busy" in acct.log(), acct.log()),
            check("once the lock is free the retry delivers B", "attempted=1" in free_out and len(acct.delivered_to(RCPT_B)) == 1, free_out),
        ]
    finally:
        if holder is not None:
            holder.kill()
        acct.close()


def case9():
    """Must-fail: case 1's assertions against a wrong expectation must report FAIL."""
    results = happy_path(3)  # deliberately wrong: only 2 recipients exist
    reported_fail = any(not passed for _, passed, _ in results)
    print("      (deliberate) case 1 re-run expecting 3 messages reported:")
    for description, passed, detail in results:
        if not passed:
            print("        FAIL  %s  [%s]" % (description, detail))
    return [check("harness reports FAIL when the expectation is wrong", reported_fail)]


def case10():
    """BACKGROUND path: a stand-in litespeed_finish_request() under the CLI."""
    acct = Account(php_server=False)
    try:
        acct.set_faults(greeting_delay=2)
        marker = os.path.join(acct.base, "finish-marker.json")
        env = dict(os.environ)
        env.update({
            "TEST_DOCROOT": acct.docroot, "TEST_MARKER": marker,
            "TEST_POST": json.dumps(form("case10-key")),
        })
        started = time.time()
        subprocess.run([PHP, "-d", "auto_prepend_file=" + os.path.join(HERE, "bootstrap_background.php"), acct.handler],
                       env=env, capture_output=True, timeout=120, cwd=acct.base)
        finished = time.time()
        with open(marker, encoding="utf-8") as handle:
            finish = json.load(handle)
        seen = acct.smtp_seen()
        first_mail_at = min(m["t"] for m in seen["messages"]) if seen["messages"] else None

        # Replay of a fully delivered submission must not detach at all.
        os.remove(marker)
        replay = subprocess.run([PHP, "-d", "auto_prepend_file=" + os.path.join(HERE, "bootstrap_background.php"), acct.handler],
                                env=env, capture_output=True, timeout=120, cwd=acct.base)
        replay_body = replay.stdout.decode()
        return [
            check("response was 200 queued before delivery began",
                  finish["status"] == 200 and json.loads(finish["body"]) == {"ok": True, "recorded": True, "mailed": False, "queued": True},
                  str(finish)),
            check("response was sent >1.5s before the first message reached the server (greeting delayed 2s)",
                  first_mail_at is not None and first_mail_at - finish["t"] > 1.5,
                  "finish=%.2f first_mail=%s" % (finish["t"], first_mail_at)),
            check("delivery still completed after the response: 2 messages, 1 AUTH",
                  len(seen["messages"]) == 2 and seen["auth"] == 1, str(seen)),
            check("log has mode=background attempt", "delivery_attempt accepted=2 required=2 mode=background" in acct.log(), acct.log()),
            check("replay of a delivered submission answers mailed=true without detaching",
                  not os.path.exists(marker) and '"mailed":true' in replay_body, replay_body),
            check("replay sent nothing more", len(acct.smtp_seen()["messages"]) == 2),
            check("whole run took >= 2s (delivery ran to completion in-process)", finished - started >= 2, "%.2fs" % (finished - started)),
        ]
    finally:
        acct.close()


def case11():
    """TLS verification is on: without the test CA the self-signed cert is refused."""
    acct = Account(cafile=False)
    try:
        status, body, _ = acct.post(form("case11-key"))
        return [
            check("503 and nothing delivered", status == 503 and acct.smtp_seen()["messages"] == [], "%s %s" % (status, body)),
            check("log has smtp_failed stage=tls code=none enhanced=none", "smtp_failed stage=tls code=none enhanced=none" in acct.log(), acct.log()),
            check("no AUTH was ever sent over the unverified channel", acct.smtp_seen()["auth"] == 0),
        ]
    finally:
        acct.close()


def case12():
    """An old-format state file (no attempts/last_attempt_at) still loads and retries."""
    acct = Account()
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        acct.post(form("case12-key"))
        acct.set_faults()
        state = acct.state()
        for key in ("attempts", "last_attempt_at", "terminal"):
            state.pop(key, None)
        acct.write_state(state)
        out, _ = acct.retry()
        return [
            check("retry picks up the legacy file", "attempted=1" in out, out),
            check("B delivered, A not re-sent", len(acct.delivered_to(RCPT_B)) == 1 and len(acct.delivered_to(RCPT_A)) == 1),
            check("attempts now recorded as 1", acct.state().get("attempts") == 1, str(acct.state())),
        ]
    finally:
        acct.close()


def case13():
    """Fail closed: an unrecognised terminal value is rejected, not passed."""
    acct = Account()
    try:
        acct.set_faults(rcpt_reject=[RCPT_B])
        acct.post(form("case13-key"))
        acct.set_faults()
        state = acct.state()
        state["terminal"] = "bogus"
        acct.write_state(state)
        status, body, _ = acct.post(form("case13-key"))
        out, _ = acct.retry(min_age=0)
        return [
            check("web replay answers 500 delivery_state_unavailable", status == 500 and body.get("error") == "delivery_state_unavailable", "%s %s" % (status, body)),
            check("retry skipped it", "attempted=0" in out, out),
            check("nothing further sent", len(acct.delivered_to(RCPT_B)) == 0),
        ]
    finally:
        acct.close()


CASES = [
    ("1  happy path: 2 recipients, one AUTH, 2 messages, 200", case1),
    ("2  double-fire sequential: same key twice -> 2 messages", case2),
    ("3  double-fire concurrent: 5 parallel php-cgi, same key -> 2 messages", case3),
    ("4  RCPT reject for B: A delivered, B not, 503 (sync), stage=rcpt logged", case4),
    ("5  retry CLI delivers B, does not re-send A", case5),
    ("6  AUTH reject logged as stage=auth 535 5.7.8, no secrets in log", case6),
    ("7  abandon after 8 attempts, no further sends", case7),
    ("8  lease: retry skips a submission whose lock is held", case8),
    ("9  MUST-FAIL sanity: wrong expectation reports FAIL", case9),
    ("10 background path (stand-in litespeed_finish_request)", case10),
    ("11 TLS verification on: untrusted cert refused", case11),
    ("12 legacy state file (no retry keys) still loads and retries", case12),
    ("13 fail closed: unknown terminal value rejected", case13),
]


def main():
    only = set(sys.argv[1:])
    failures = 0
    for title, fn in CASES:
        if only and title.split()[0] not in only:
            continue
        try:
            results = fn()
        except Exception as exc:  # a crashed case is a failed case, never a silent pass
            results = [check("case ran without raising", False, repr(exc))]
        passed = all(ok for _, ok, _ in results)
        print("%s  case %s" % ("PASS" if passed else "FAIL", title))
        for description, ok, detail in results:
            print("      %s  %s%s" % ("ok  " if ok else "FAIL", description, "" if ok else "  [%s]" % detail))
        failures += 0 if passed else 1
    print("\n%d case(s) failed" % failures if failures else "\nall cases passed")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
