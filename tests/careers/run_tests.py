"""Tests for public/api/careers.php. Not deployed.

Each case builds a throwaway "account" that mirrors the cPanel layout:

    <tmp>/public_html/api/careers.php      copy of the handler under test
    <tmp>/public_html/api/lib/             the shared core it requires
    <tmp>/public_html/email-header.jpg
    <tmp>/ascendrev-enquiry.config.php     ABOVE the docroot, like production
    <tmp>/ascendrev-applications/          storage, created by the handler

and the fake STARTTLS SMTP server from tests/enquiry/. Assertions are made against
what the fake server received and what is on disk, not against what the handler
reports.

    php -S                    SYNC path (no finish-request function)
    php-cgi in parallel       real process concurrency on the per-key flock
    php-cgi + bootstrap       BACKGROUND path (stand-in litespeed_finish_request)
    php CLI `retry`/`purge`   the cron paths

Run from the web root:  py -3.12 tests/careers/run_tests.py [case numbers...]
"""

import csv
import email
import email.policy
import hashlib
import html as html_lib
import http.client
import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.abspath(os.path.join(HERE, "..", ".."))
ENQUIRY_TESTS = os.path.join(WEB, "tests", "enquiry")
API = os.path.join(WEB, "public", "api")
HEADER_IMAGE = os.path.join(WEB, "public", "email-header.jpg")
PHP = os.environ.get("PHP_BIN", r"C:\xampp\php\php.exe")
PHP_CGI = os.environ.get("PHP_CGI_BIN", r"C:\xampp\php\php-cgi.exe")
PY = sys.executable

# Reuse the enquiry suite's port helpers. Loaded by path under its own name because
# both suites call their entry file run_tests.py.
_spec = importlib.util.spec_from_file_location("enquiry_run_tests", os.path.join(ENQUIRY_TESTS, "run_tests.py"))
_enquiry = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_enquiry)
free_port, wait_port = _enquiry.free_port, _enquiry.wait_port

RCPT_A = "recruit-a@ascend-test.example"
RCPT_B = "recruit-b@ascend-test.example"
SMTP_USER = "smtp-user-9f3k@example.test"
SMTP_PASS = "S3cretPassw0rd-xyz"
MB = 1024 * 1024
# Production-like: a PHP startup warning must not be printed into the JSON body.
PHP_FLAGS = ["-d", "upload_max_filesize=8M", "-d", "post_max_size=10M", "-d", "display_errors=0"]


# -- sample files --------------------------------------------------------------

def pdf_bytes(size=4096):
    body = bytes((i * 31 + 7) % 256 for i in range(size))  # binary, includes CR LF and dots
    return b"%PDF-1.4\n" + body + b"\n%%EOF\n"


def zip_bytes(entries):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in entries.items():
            archive.writestr(name, content)
    return buffer.getvalue()


def docx_bytes():
    return zip_bytes({
        "[Content_Types].xml": "<Types/>",
        "_rels/.rels": "<Relationships/>",
        "word/document.xml": "<w:document>resume text</w:document>",
    })


def xlsx_bytes():
    return zip_bytes({"[Content_Types].xml": "<Types/>", "xl/workbook.xml": "<workbook/>"})


def plain_zip_bytes():
    return zip_bytes({"notes.txt": "not a word document"})


def doc_bytes():
    """Real OLE2 header bytes: the legacy .doc format, which is not accepted."""
    return bytes.fromhex("D0CF11E0A1B11AE1") + b"\x00" * 512 + "W\0o\0r\0d\0D\0o\0c\0u\0m\0e\0n\0t\0".encode()


def sized_pdf(total):
    head = b"%PDF-1.4\n"
    return head + b"\x00" * (total - len(head))


def answers(key, **overrides):
    data = {
        "fullName": "Jane Doe",
        "email": "jane.doe@gmail.com",
        "phone": "09171234567",
        "role": "outbound-sales-representative",
        "outboundYears": "3to5",
        "csYears": "1to2",
        "expectedSalary": "25000",
        "siteShiftConfirmed": "yes",
        "source": "facebook",
        "consent": "yes",
        "idempotencyKey": key,
    }
    data.update(overrides)
    return data


QUESTION_LABELS = [
    "How many years of international outbound sales experience do you have?",
    "How many years of international customer service experience do you have?",
    "What's your expected monthly salary?",
    "Alabang-site location (not work from home) and night-shift",
]
NEW_CSV_HEADER = [
    "submitted_at_utc", "full_name", "email", "phone", "role", "outbound_years", "cs_years",
    "expected_salary", "site_shift_confirmed", "source", "resume_file", "ip_hash", "submission_key",
]
OLD_CSV_HEADER = [
    "submitted_at_utc", "full_name", "email", "phone", "role", "outbound_years", "cs_years",
    "onsite_night_shift", "supervisory_experience", "supervisory_details", "pay_min", "pay_max",
    "linkedin", "source", "resume_file", "ip_hash", "submission_key",
]
# Words from the retired fields; none may appear in a new email.
REMOVED_WORDS = ["LinkedIn", "Supervisory", "base pay", "Alabang Town Centre"]


def reference_for(key):
    return "AR-" + hashlib.sha256(("client:" + key).encode()).hexdigest()[:6].upper()


def multipart(fields, files):
    """files: list of (field name, file name, bytes). Returns (content type, body)."""
    boundary = "----careerstest" + os.urandom(8).hex()
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n" % (boundary, name)).encode())
        out.write(str(value).encode("utf-8") + b"\r\n")
    for name, filename, content in files:
        out.write(("--%s\r\nContent-Disposition: form-data; name=\"%s\"; filename=\"%s\"\r\n"
                   "Content-Type: application/octet-stream\r\n\r\n" % (boundary, name, filename)).encode())
        out.write(content + b"\r\n")
    out.write(("--%s--\r\n" % boundary).encode())
    return "multipart/form-data; boundary=" + boundary, out.getvalue()


class Account:
    """One isolated hosting account plus its fake SMTP server."""

    def __init__(self, recipients=(RCPT_A, RCPT_B), php_flags=None, php_server=True, extra_config=None, cafile=True):
        self.base = tempfile.mkdtemp(prefix="careers-test-", dir=os.environ.get("CAREERS_TEST_TMP"))
        self.docroot = os.path.join(self.base, "public_html")
        self.storage = os.path.join(self.base, "ascendrev-applications")
        os.makedirs(os.path.join(self.docroot, "api"))
        self.handler = os.path.join(self.docroot, "api", "careers.php")
        shutil.copy(os.path.join(API, "careers.php"), self.handler)
        shutil.copytree(os.path.join(API, "lib"), os.path.join(self.docroot, "api", "lib"))
        shutil.copy(HEADER_IMAGE, os.path.join(self.docroot, "email-header.jpg"))

        self.smtp_port = free_port()
        self.smtp_state = os.path.join(self.base, "smtp-state.json")
        self.control = os.path.join(self.base, "smtp-control.json")
        self.set_faults()
        self.smtp = subprocess.Popen(
            [PY, os.path.join(ENQUIRY_TESTS, "fake_smtp.py"), "--port", str(self.smtp_port),
             "--state", self.smtp_state, "--control", self.control],
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        )
        self.smtp.stdout.readline()  # READY

        self.settings = {
            "ASCENDREV_CAREERS_TO": ",".join(recipients),
            "ASCENDREV_SMTP_HOST": "127.0.0.1",
            "ASCENDREV_SMTP_PORT": str(self.smtp_port),
            "ASCENDREV_SMTP_USER": SMTP_USER,
            "ASCENDREV_SMTP_PASS": SMTP_PASS,
            "ASCENDREV_ENQUIRY_FROM": "sender@example.test",
            "ASCENDREV_ALLOWED_HOSTS": "localhost,127.0.0.1",
            "ASCENDREV_CAREERS_RATE_LIMIT_MAX": "1000",
        }
        if cafile:
            self.settings["ASCENDREV_SMTP_CAFILE"] = os.path.join(ENQUIRY_TESTS, "test-cert.pem").replace("\\", "/")
        self.settings.update(extra_config or {})
        self.write_config()

        self.web = None
        if php_server:
            self.web_port = free_port()
            self.web = subprocess.Popen(
                [PHP, "-S", "127.0.0.1:%d" % self.web_port, "-t", self.docroot] + (php_flags or PHP_FLAGS),
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            wait_port(self.web_port)

    def write_config(self):
        lines = ["<?php return ["] + ["    %s => %s," % (json.dumps(k), json.dumps(v)) for k, v in self.settings.items()] + ["];"]
        with open(os.path.join(self.base, "ascendrev-enquiry.config.php"), "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")

    # -- fake SMTP -------------------------------------------------------------
    def set_faults(self, **faults):
        faults["keep_data"] = True
        with open(self.control, "w", encoding="utf-8") as handle:
            json.dump(faults, handle)

    def smtp_seen(self):
        with open(self.smtp_state, encoding="utf-8") as handle:
            return json.load(handle)

    def delivered_to(self, address):
        return [m for m in self.smtp_seen()["messages"] if m["rcpt"] == address]

    def parsed(self, message):
        return email.message_from_bytes(message["data"].encode("utf-8"), policy=email.policy.default)

    # -- handler ---------------------------------------------------------------
    def post(self, fields, resume=("cv.pdf", None), headers=None, method="POST", path="/api/careers.php"):
        """resume: (file name, bytes) or None for no file part. bytes default to a small PDF."""
        files = []
        if resume is not None:
            files.append(("resume", resume[0], resume[1] if resume[1] is not None else pdf_bytes()))
        content_type, body = multipart(fields, files)
        request_headers = {"Content-Type": content_type, "Origin": "http://localhost", "Accept": "application/json"}
        request_headers.update(headers or {})
        conn = http.client.HTTPConnection("127.0.0.1", self.web_port, timeout=120)
        conn.request(method, path, body if method == "POST" else None, request_headers)
        response = conn.getresponse()
        text = response.read().decode(errors="replace")
        conn.close()
        try:
            return response.status, json.loads(text), response
        except ValueError:
            return response.status, {"raw": text}, response

    def cgi_post(self, fields, resume, extra_args=(), env_extra=None):
        content_type, body = multipart(fields, [("resume", resume[0], resume[1])])
        env = dict(os.environ)
        env.update({
            "REDIRECT_STATUS": "1", "GATEWAY_INTERFACE": "CGI/1.1", "REQUEST_METHOD": "POST",
            "SCRIPT_FILENAME": self.handler, "SCRIPT_NAME": "/api/careers.php",
            "DOCUMENT_ROOT": self.docroot, "CONTENT_TYPE": content_type,
            "CONTENT_LENGTH": str(len(body)), "HTTP_ORIGIN": "http://localhost",
            "REMOTE_ADDR": "127.0.0.1", "SERVER_PROTOCOL": "HTTP/1.1",
        })
        env.update(env_extra or {})
        done = subprocess.run([PHP_CGI, "-q"] + PHP_FLAGS + list(extra_args), input=body, env=env, capture_output=True, timeout=180)
        text = done.stdout.decode(errors="replace")
        try:
            return json.loads(text.split("\r\n\r\n", 1)[-1])
        except ValueError:
            return {"raw": text, "err": done.stderr.decode(errors="replace")}

    def cli(self, command, env_extra=None):
        env = dict(os.environ)
        env.update(env_extra or {})
        done = subprocess.run([PHP, self.handler, command], env=env, capture_output=True, timeout=180, cwd=self.base)
        return done.stdout.decode().strip(), done.returncode

    # -- storage ---------------------------------------------------------------
    def log(self):
        try:
            with open(os.path.join(self.storage, "careers.log"), encoding="utf-8") as handle:
                return handle.read()
        except OSError:
            return ""

    def resumes(self):
        directory = os.path.join(self.storage, "resumes")
        return sorted(os.listdir(directory)) if os.path.isdir(directory) else []

    def csv_rows(self):
        path = os.path.join(self.storage, "applications.csv")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8", newline="") as handle:
            return list(csv.reader(handle))

    def state_paths(self):
        if not os.path.isdir(self.storage):
            return []
        return sorted(os.path.join(self.storage, n) for n in os.listdir(self.storage) if n.startswith("delivery-") and n.endswith(".json"))

    def state(self):
        paths = self.state_paths()
        assert len(paths) == 1, paths
        with open(paths[0], encoding="utf-8") as handle:
            return json.load(handle)

    def write_state(self, state):
        with open(self.state_paths()[0], "w", encoding="utf-8") as handle:
            json.dump(state, handle)

    def nothing_stored(self):
        return self.resumes() == [] and len(self.csv_rows()) == 0 and self.state_paths() == []

    def close(self):
        for proc in (self.web, self.smtp):
            if proc is not None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    proc.kill()
        shutil.rmtree(self.base, ignore_errors=True)


def check(description, passed, detail=""):
    return (description, bool(passed), detail)


def attachment_of(parsed):
    attachments = list(parsed.iter_attachments())
    return attachments[0] if len(attachments) == 1 else None


# -- cases ---------------------------------------------------------------------

def happy(extension, content, key, filename):
    acct = Account()
    try:
        status, body, _ = acct.post(answers(key), resume=(filename, content))
        seen = acct.smtp_seen()
        results = [
            check("HTTP 200 recorded with the stable reference",
                  status == 200 and body.get("ok") is True and body.get("recorded") is True and body.get("reference") == reference_for(key),
                  "%s %s" % (status, body)),
            check("exactly one message per recipient (2)", len(seen["messages"]) == 2 and len(acct.delivered_to(RCPT_A)) == 1 and len(acct.delivered_to(RCPT_B)) == 1,
                  "got %d" % len(seen["messages"])),
            check("one SMTP session and one AUTH", seen["connections"] == 1 and seen["auth"] == 1, str((seen["connections"], seen["auth"]))),
        ]
        for message in seen["messages"]:
            parsed = acct.parsed(message)
            attachment = attachment_of(parsed)
            expected_type = {"pdf": "application/pdf",
                             "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}[extension]
            results.append(check("%s: one attachment, bytes decode to the original" % message["rcpt"],
                                 attachment is not None and attachment.get_content() == content,
                                 "no attachment" if attachment is None else "bytes differ"))
            results.append(check("%s: attachment name and content type" % message["rcpt"],
                                 attachment is not None and attachment.get_filename() == "Resume - Jane Doe." + extension
                                 and attachment.get_content_type() == expected_type,
                                 str(None if attachment is None else (attachment.get_filename(), attachment.get_content_type()))))
            results.append(check("%s: subject, To, Reply-To, From" % message["rcpt"],
                                 parsed["Subject"] == "[AscendRev Careers] Outbound Sales Representative: Jane Doe"
                                 and parsed["To"] == message["rcpt"]
                                 and "jane.doe@gmail.com" in parsed["Reply-To"] and "Jane Doe" in parsed["Reply-To"]
                                 and "sender@example.test" in parsed["From"],
                                 str((parsed["Subject"], parsed["To"], parsed["Reply-To"], parsed["From"]))))
            text = parsed.get_body(preferencelist=("plain",)).get_content()
            html = parsed.get_body(preferencelist=("html",)).get_content()
            # The HTML escapes the apostrophe in "What's"; compare what a mail client shows.
            html_text = html_lib.unescape(html)
            wanted = QUESTION_LABELS + ["3 to 5 years", "1 to 2 years", "PHP 25,000", "Confirmed", "facebook", reference_for(key)]
            results.append(check("%s: plain text and HTML carry the four questions and every answer" % message["rcpt"],
                                 all(w in text for w in wanted) and all(w in html_text for w in wanted) and "Reply to Jane" in html,
                                 str([w for w in wanted if w not in text or w not in html_text])))
            results.append(check("%s: question order matches the form" % message["rcpt"],
                                 [text.index(q) for q in QUESTION_LABELS] == sorted(text.index(q) for q in QUESTION_LABELS)
                                 and [html_text.index(q) for q in QUESTION_LABELS] == sorted(html_text.index(q) for q in QUESTION_LABELS)))
            results.append(check("%s: no removed field leaks into the email" % message["rcpt"],
                                 not any(w.lower() in (text + html_text).lower() for w in REMOVED_WORDS),
                                 str([w for w in REMOVED_WORDS if w.lower() in (text + html_text).lower()])))
        rows = acct.csv_rows()
        stored = acct.resumes()
        stored_key = hashlib.sha256(("client:" + key).encode()).hexdigest()
        results += [
            check("CSV has the new header and one row of 13 columns",
                  len(rows) == 2 and rows[0] == NEW_CSV_HEADER and len(rows[1]) == 13, str(rows[:1])),
            check("CSV row holds the answers and the generated resume path",
                  rows[1][1] == "Jane Doe" and rows[1][2] == "jane.doe@gmail.com" and rows[1][4] == "outbound-sales-representative"
                  and rows[1][5] == "3to5" and rows[1][6] == "1to2" and rows[1][7] == "25000" and rows[1][8] == "yes"
                  and rows[1][9] == "facebook"
                  and rows[1][10] == "resumes/%s.%s" % (stored_key, extension) and rows[1][12] == stored_key, str(rows[1])),
            check("exactly one stored resume named from the key, identical bytes",
                  stored == ["%s.%s" % (stored_key, extension)]
                  and open(os.path.join(acct.storage, "resumes", stored[0]), "rb").read() == content, str(stored)),
            check("log has no name, email, phone, file name or secret",
                  not any(s in acct.log() for s in ("Jane", "jane.doe", "09171234567", filename, SMTP_PASS, SMTP_USER, RCPT_A)), acct.log()),
            check("log has delivery_attempt accepted=2 required=2 mode=sync", "delivery_attempt accepted=2 required=2 mode=sync ms=" in acct.log(), acct.log()),
        ]
        if os.name == "posix":
            results.append(check("resume is owner-only (0600)", oct(os.stat(os.path.join(acct.storage, "resumes", stored[0])).st_mode & 0o777) == "0o600"))
        return results
    finally:
        acct.close()


def case1():
    return happy("pdf", pdf_bytes(), "careers-key-1", "My CV (final).pdf")


def case2():
    return happy("docx", docx_bytes(), "careers-key-2", "resume.DOCX")


def rejected(acct, filename, content, description):
    status, body, _ = acct.post(answers("rej-" + description), resume=(filename, content))
    return [
        check("%s -> 415 unsupported_file_type with resume in fields" % description,
              status == 415 and body.get("error") == "unsupported_file_type" and "resume" in body.get("fields", []), "%s %s" % (status, body)),
        check("%s -> nothing stored, nothing mailed" % description,
              acct.nothing_stored() and acct.smtp_seen()["messages"] == [], str((acct.resumes(), len(acct.csv_rows())))),
    ]


def case3():
    """Legacy .doc is not accepted, however it is named."""
    acct = Account()
    try:
        return (rejected(acct, "resume.doc", doc_bytes(), "OLE .doc named .doc")
                + rejected(acct, "resume.docx", doc_bytes(), "OLE .doc renamed .docx")
                + rejected(acct, "resume.pdf", doc_bytes(), "OLE .doc renamed .pdf"))
    finally:
        acct.close()


def case4():
    """A ZIP is not a Word document unless it has the Word parts."""
    acct = Account()
    try:
        return (rejected(acct, "resume.docx", xlsx_bytes(), ".xlsx renamed .docx")
                + rejected(acct, "resume.docx", plain_zip_bytes(), "plain .zip renamed .docx")
                + rejected(acct, "resume.zip", docx_bytes(), "a real docx named .zip")
                + rejected(acct, "resume.docx", b"PK\x03\x04" + b"\x00" * 200, "truncated zip named .docx"))
    finally:
        acct.close()


def case5():
    """Content is checked, not the name: text, executables and mismatches are refused."""
    acct = Account()
    try:
        return (rejected(acct, "resume.pdf", b"hello, this is just text\n" * 20, "text bytes named .pdf")
                + rejected(acct, "resume.pdf", b"MZ\x90\x00" + b"\x00" * 300, "exe bytes named .pdf")
                + rejected(acct, "resume.docx", pdf_bytes(), "pdf bytes named .docx")
                + rejected(acct, "resume.pdf", docx_bytes(), "docx bytes named .pdf")
                + rejected(acct, "resume", pdf_bytes(), "pdf bytes with no extension")
                + rejected(acct, "resume.pdf.exe", pdf_bytes(), "pdf bytes named .pdf.exe")
                + rejected(acct, "resume.pdf", b"", "an empty file"))
    finally:
        acct.close()


def case6():
    """Size limit: 5 MB + 1 refused, exactly 5 MB accepted and delivered intact."""
    acct = Account()
    try:
        status, body, _ = acct.post(answers("big-1"), resume=("big.pdf", sized_pdf(5 * MB + 1)))
        refused = [
            check("5 MB + 1 byte -> 413 file_too_large", status == 413 and body.get("error") == "file_too_large", "%s %s" % (status, body)),
            check("nothing stored, nothing mailed", acct.nothing_stored() and acct.smtp_seen()["messages"] == []),
        ]
        exact = sized_pdf(5 * MB)
        status, body, _ = acct.post(answers("big-2"), resume=("exact.pdf", exact))
        seen = acct.smtp_seen()
        decoded_ok = all(attachment_of(acct.parsed(m)) is not None and attachment_of(acct.parsed(m)).get_content() == exact for m in seen["messages"])
        return refused + [
            check("exactly 5 MB -> 200", status == 200 and body.get("recorded") is True, "%s %s" % (status, body)),
            check("both recipients got the full 5 MB attachment byte for byte", len(seen["messages"]) == 2 and decoded_ok, str(len(seen["messages"]))),
        ]
    finally:
        acct.close()


def case7():
    """PHP's own limits map to 413: upload_max_filesize (UPLOAD_ERR_INI_SIZE) and post_max_size."""
    results = []
    for label, flags in (("upload_max_filesize", ["-d", "upload_max_filesize=1M", "-d", "post_max_size=10M", "-d", "display_errors=0"]),
                         ("post_max_size", ["-d", "upload_max_filesize=8M", "-d", "post_max_size=1M", "-d", "display_errors=0"])):
        acct = Account(php_flags=flags)
        try:
            status, body, _ = acct.post(answers("ini-" + label), resume=("two.pdf", sized_pdf(2 * MB)))
            results.append(check("2 MB over %s=1M -> 413 file_too_large" % label,
                                 status == 413 and body.get("error") == "file_too_large", "%s %s" % (status, body)))
            results.append(check("nothing stored or mailed (%s)" % label, acct.nothing_stored() and acct.smtp_seen()["messages"] == []))
        finally:
            acct.close()
    return results


def case8():
    """Validation: every bad field is named, nothing is stored, nothing is mailed."""
    acct = Account()
    try:
        results = []
        bad = [
            ("missing consent", {"consent": ""}, ["consent"]),
            ("consent not yes", {"consent": "true"}, ["consent"]),
            ("role team-leader (retired)", {"role": "team-leader"}, ["role"]),
            ("role customer-service (near miss of a live slug)", {"role": "customer-service"}, ["role"]),
            ("role general-application (retired)", {"role": "general-application"}, ["role"]),
            ("empty role", {"role": ""}, ["role"]),
            ("unknown experience value", {"outboundYears": "10plus"}, ["outboundYears"]),
            ("unknown cs experience", {"csYears": ""}, ["csYears"]),
            ("site/shift missing", {"siteShiftConfirmed": ""}, ["siteShiftConfirmed"]),
            ("site/shift 'no'", {"siteShiftConfirmed": "no"}, ["siteShiftConfirmed"]),
            ("site/shift 'true'", {"siteShiftConfirmed": "true"}, ["siteShiftConfirmed"]),
            ("site/shift 'YES' (exact match only)", {"siteShiftConfirmed": "YES"}, ["siteShiftConfirmed"]),
            ("salary 4999", {"expectedSalary": "4999"}, ["expectedSalary"]),
            ("salary 1000001", {"expectedSalary": "1000001"}, ["expectedSalary"]),
            ("salary '25,000'", {"expectedSalary": "25,000"}, ["expectedSalary"]),
            ("salary empty", {"expectedSalary": ""}, ["expectedSalary"]),
            ("salary with decimals", {"expectedSalary": "25000.50"}, ["expectedSalary"]),
            ("salary negative", {"expectedSalary": "-25000"}, ["expectedSalary"]),
            ("salary with a currency prefix", {"expectedSalary": "PHP25000"}, ["expectedSalary"]),
            ("salary of 8 digits", {"expectedSalary": "00025000"}, ["expectedSalary"]),
            ("two bad fields are both named", {"siteShiftConfirmed": "no", "expectedSalary": "1"}, ["expectedSalary", "siteShiftConfirmed"]),
            ("name with a digit", {"fullName": "Jane 2"}, ["fullName"]),
            ("name with a newline", {"fullName": "Jane\nBcc: x@y.test"}, ["fullName"]),
            ("one-character name", {"fullName": "J"}, ["fullName"]),
            ("disposable email", {"email": "a@mailinator.com"}, ["email"]),
            ("malformed email", {"email": "not-an-email"}, ["email"]),
            ("phone with letters", {"phone": "0917abc4567"}, ["phone"]),
            ("phone with 9 digits", {"phone": "091712345"}, ["phone"]),
            ("phone with 14 digits", {"phone": "09171234567890"}, ["phone"]),
        ]
        for index, (label, overrides, fields) in enumerate(bad):
            status, body, _ = acct.post(answers("val-%d" % index, **overrides))
            results.append(check("%s -> 422 naming %s" % (label, fields),
                                 status == 422 and body.get("error") == "validation_failed" and body.get("fields") == fields, "%s %s" % (status, body)))
        status, body, _ = acct.post(answers("val-noresume"), resume=None)
        results.append(check("no resume part -> 422 fields [resume]", status == 422 and body.get("fields") == ["resume"], "%s %s" % (status, body)))
        status, body, _ = acct.post(answers("val-everything", consent="", role="x"), resume=("a.pdf", b"text"))
        results.append(check("bad type with other bad fields -> 415 listing all of them",
                             status == 415 and set(body.get("fields", [])) == {"consent", "role", "resume"}, "%s %s" % (status, body)))
        results.append(check("none of it stored or mailed", acct.nothing_stored() and acct.smtp_seen()["messages"] == []))
        results.append(check("the response never echoes a submitted value", "Jane" not in json.dumps(body) and "mailinator" not in json.dumps(body)))

        # Things that must be accepted.
        status, body, _ = acct.post(answers("val-ok-1", expectedSalary="5000"))
        results.append(check("salary at the 5000 floor -> 200", status == 200, "%s %s" % (status, body)))
        status, body, _ = acct.post(answers("val-ok-2", expectedSalary="1000000"))
        results.append(check("salary at the 1,000,000 ceiling -> 200", status == 200, "%s %s" % (status, body)))
        status, body, _ = acct.post(answers("val-ok-3", expectedSalary="05000"))
        results.append(check("salary with a leading zero is stored in canonical form",
                             status == 200 and acct.csv_rows()[-1][7] == "5000", "%s %s" % (status, acct.csv_rows()[-1])))
        status, body, _ = acct.post(answers("val-ok-4", source="not valid!!", phone="+639171234567"))
        row = acct.csv_rows()[-1]
        results.append(check("+639 phone accepted -> 200", status == 200, "%s %s" % (status, body)))
        results.append(check("a source with illegal characters is dropped, not rejected", row[9] == "", str(row)))
        status, body, _ = acct.post(answers("val-ok-5", source="x" * 41))
        results.append(check("a source over 40 characters is dropped", status == 200 and acct.csv_rows()[-1][9] == "", "%s %s" % (status, body)))
        for index, value in enumerate(("none", "lt1", "1to2", "3to5", "5plus")):
            status, body, _ = acct.post(answers("val-yrs-%d" % index, outboundYears=value, csYears=value))
            results.append(check("experience '%s' accepted" % value, status == 200, "%s %s" % (status, body)))
        return results
    finally:
        acct.close()


def case9():
    acct = Account()
    try:
        status, body, _ = acct.post(dict(answers("unk-1"), extra="1"))
        retired = {}
        for name in ("linkedin", "onsiteNightShift", "supervisoryExperience", "supervisoryDetails", "payMin", "payMax"):
            retired[name] = acct.post(dict(answers("unk-" + name), **{name: "x"}))
        content_type, payload = multipart(answers("unk-2"), [("resume", "cv.pdf", pdf_bytes()), ("attachment", "x.pdf", pdf_bytes())])
        conn = http.client.HTTPConnection("127.0.0.1", acct.web_port, timeout=30)
        conn.request("POST", "/api/careers.php", payload, {"Content-Type": content_type, "Origin": "http://localhost"})
        second = conn.getresponse()
        second_body = json.loads(second.read().decode())
        conn.close()
        return [
            check("unknown field -> 422 unknown_field", status == 422 and body.get("error") == "unknown_field", "%s %s" % (status, body)),
            check("unknown file field -> 422 unknown_field", second.status == 422 and second_body.get("error") == "unknown_field", "%s %s" % (second.status, second_body)),
            check("each retired field (linkedin, onsiteNightShift, supervisoryExperience, supervisoryDetails, payMin, payMax) -> 422 unknown_field",
                  all(r[0] == 422 and r[1].get("error") == "unknown_field" for r in retired.values()),
                  str({k: (r[0], r[1]) for k, r in retired.items()})),
            check("the old payMin/payMax pair in place of expectedSalary is rejected too, nothing stored",
                  acct.post({k: v for k, v in dict(answers("unk-old"), payMin="25000", payMax="30000").items() if k != "expectedSalary"})[0] == 422),
            check("nothing stored or mailed", acct.nothing_stored() and acct.smtp_seen()["messages"] == []),
        ]
    finally:
        acct.close()


def case10():
    acct = Account()
    try:
        status, body, _ = acct.post(answers("hp-1", website="http://spam.example"))
        return [
            check("honeypot -> 200 {ok:true} and nothing else", status == 200 and body == {"ok": True}, "%s %s" % (status, body)),
            check("no mail, no file, no row, no state", acct.smtp_seen()["messages"] == [] and acct.nothing_stored()),
            check("log records honeypot_tripped", "honeypot_tripped" in acct.log(), acct.log()),
        ]
    finally:
        acct.close()


def case11():
    acct = Account()
    try:
        bad_origin = acct.post(answers("o-1"), headers={"Origin": "http://evil.example"})
        no_origin = acct.post(answers("o-2"), headers={"Origin": ""})
        referer_ok = acct.post(answers("o-3"), headers={"Origin": "", "Referer": "http://localhost/careers/"})
        get = acct.post(answers("o-4"), method="GET")
        preflight = acct.post(answers("o-5"), method="OPTIONS")
        bad_preflight = acct.post(answers("o-6"), method="OPTIONS", headers={"Origin": "http://evil.example"})
        return [
            check("foreign Origin -> 403 forbidden_origin", bad_origin[0] == 403 and bad_origin[1].get("error") == "forbidden_origin", str(bad_origin[:2])),
            check("no Origin and no Referer -> 403", no_origin[0] == 403, str(no_origin[:2])),
            check("allowed Referer without Origin -> 200", referer_ok[0] == 200, str(referer_ok[:2])),
            check("GET -> 405 method_not_allowed with Allow header",
                  get[0] == 405 and get[1].get("error") == "method_not_allowed" and get[2].getheader("Allow") == "POST, OPTIONS", str(get[:2])),
            check("preflight from an allowed origin -> 204 with CORS headers",
                  preflight[0] == 204 and preflight[2].getheader("Access-Control-Allow-Origin") == "http://localhost"
                  and preflight[2].getheader("Vary") == "Origin", str(preflight[0])),
            check("preflight from a foreign origin -> 403 with no CORS echo",
                  bad_preflight[0] == 403 and bad_preflight[2].getheader("Access-Control-Allow-Origin") is None, str(bad_preflight[0])),
            check("the refused requests sent no mail and stored nothing but the one allowed application",
                  len(acct.smtp_seen()["messages"]) == 2 and len(acct.resumes()) == 1),
        ]
    finally:
        acct.close()


def case12():
    acct = Account(extra_config={"ASCENDREV_CAREERS_RATE_LIMIT_MAX": "2"})
    try:
        first = acct.post(answers("rl-1"))
        second = acct.post(answers("rl-2"))
        third = acct.post(answers("rl-3"))
        return [
            check("two applications allowed", first[0] == 200 and second[0] == 200),
            check("third from the same IP -> 429 with Retry-After", third[0] == 429 and third[2].getheader("Retry-After") == "3600", str(third[:2])),
            check("the refused one stored nothing", len(acct.resumes()) == 2),
            check("rate state lives in the careers storage, not the enquiry one",
                  any(n.startswith("rate-") for n in os.listdir(acct.storage))),
        ]
    finally:
        acct.close()


def case13():
    """Replay with the same key and the same file: no second file, no second email."""
    acct = Account()
    try:
        content = pdf_bytes()
        first = acct.post(answers("replay-1"), resume=("cv.pdf", content))
        second = acct.post(answers("replay-1"), resume=("renamed.pdf", content))
        seen = acct.smtp_seen()
        return [
            check("first 200", first[0] == 200, str(first[:2])),
            check("replay 200 with the same reference", second[0] == 200 and second[1].get("reference") == first[1].get("reference") == reference_for("replay-1"), str(second[:2])),
            check("one stored file and one row", len(acct.resumes()) == 1 and len(acct.csv_rows()) == 2, str(acct.resumes())),
            check("one email per recipient in total (2)", len(seen["messages"]) == 2, "got %d" % len(seen["messages"])),
            check("replay opened no second SMTP session", seen["connections"] == 1),
        ]
    finally:
        acct.close()


def case14():
    """Same key, different file or different answers: a conflict, never an overwrite."""
    acct = Account()
    try:
        content = pdf_bytes()
        acct.post(answers("conflict-1"), resume=("cv.pdf", content))
        stored_before = open(os.path.join(acct.storage, "resumes", acct.resumes()[0]), "rb").read()
        other_file = acct.post(answers("conflict-1"), resume=("cv.pdf", pdf_bytes(5000)))
        other_answers = acct.post(answers("conflict-1", expectedSalary="99999"), resume=("cv.pdf", content))
        other_type = acct.post(answers("conflict-1"), resume=("cv.docx", docx_bytes()))
        stored_after = open(os.path.join(acct.storage, "resumes", acct.resumes()[0]), "rb").read()
        return [
            check("same key, different file -> 409 recorded with reference",
                  other_file[0] == 409 and other_file[1].get("error") == "idempotency_key_conflict"
                  and other_file[1].get("recorded") is True and other_file[1].get("reference") == reference_for("conflict-1"), str(other_file[:2])),
            check("same key, different answers -> 409", other_answers[0] == 409, str(other_answers[:2])),
            check("same key, different file type -> 409", other_type[0] == 409, str(other_type[:2])),
            check("the original resume is untouched and no second file exists",
                  stored_before == stored_after == content and len(acct.resumes()) == 1, str(acct.resumes())),
            check("no extra email was sent", len(acct.smtp_seen()["messages"]) == 2),
        ]
    finally:
        acct.close()


def case15():
    """Five php-cgi processes, one key: one row, one file, one email per recipient."""
    acct = Account(php_server=False)
    try:
        content = pdf_bytes(60000)
        with ThreadPoolExecutor(max_workers=5) as pool:
            results = list(pool.map(lambda _: acct.cgi_post(answers("concurrent-1"), ("cv.pdf", content)), range(5)))
        seen = acct.smtp_seen()
        return [
            check("all 5 processes answered ok with the same reference",
                  all(r.get("ok") is True and r.get("reference") == reference_for("concurrent-1") for r in results), str(results)),
            check("exactly 2 messages in total (one per recipient)", len(seen["messages"]) == 2, "got %d" % len(seen["messages"])),
            check("one SMTP session in total", seen["connections"] == 1, "connections=%d" % seen["connections"]),
            check("one CSV row and one stored resume", len(acct.csv_rows()) == 2 and len(acct.resumes()) == 1, str((len(acct.csv_rows()), acct.resumes()))),
            check("no stray temporary files left behind",
                  not any(n.endswith(".tmp") for n in os.listdir(acct.storage) + acct.resumes()), str(os.listdir(acct.storage))),
        ]
    finally:
        acct.close()


def case16():
    """SMTP refusing: 503 recorded, then cron retry delivers each recipient exactly once."""
    acct = Account()
    try:
        content = pdf_bytes()
        acct.set_faults(auth_reject=True)
        status, body, _ = acct.post(answers("retry-1"), resume=("cv.pdf", content))
        recorded = [
            check("503 delivery_incomplete with recorded:true and the reference",
                  status == 503 and body.get("error") == "delivery_incomplete" and body.get("recorded") is True
                  and body.get("reference") == reference_for("retry-1"), "%s %s" % (status, body)),
            check("row and resume are on disk, nothing was mailed",
                  len(acct.csv_rows()) == 2 and len(acct.resumes()) == 1 and acct.smtp_seen()["messages"] == []),
            check("log has stage=auth code=535 and no secrets or personal data",
                  "smtp_failed stage=auth code=535 enhanced=5.7.8" in acct.log()
                  and not any(s in acct.log() for s in (SMTP_PASS, SMTP_USER, "Jane", "jane.doe")), acct.log()),
        ]
        acct.set_faults()
        early, _ = acct.cli("retry")
        nothing_sent_early = acct.smtp_seen()["messages"] == []
        state = acct.state()
        state["last_attempt_at"] -= 5000
        acct.write_state(state)
        out, code = acct.cli("retry")
        again, _ = acct.cli("retry", env_extra={"ASCENDREV_RETRY_MIN_AGE_SECONDS": "0"})
        seen = acct.smtp_seen()
        sample = acct.parsed(seen["messages"][0]) if seen["messages"] else None
        attachment = attachment_of(sample) if sample is not None else None
        return recorded + [
            check("retry before the backoff elapsed sends nothing", "attempted=0" in early and nothing_sent_early, early),
            check("retry after the backoff exits 0 and attempts 1", code == 0 and "attempted=1" in out, out),
            check("each recipient got exactly one message", len(acct.delivered_to(RCPT_A)) == 1 and len(acct.delivered_to(RCPT_B)) == 1, str(len(seen["messages"]))),
            check("the retried email carries the resume, rebuilt from disk", attachment is not None and attachment.get_content() == content),
            check("a further sweep sends nothing", "attempted=0" in again and len(acct.smtp_seen()["messages"]) == 2, again),
            check("log has a mode=retry attempt", "mode=retry" in acct.log(), acct.log()),
            check("heartbeat file written in the careers storage", os.path.exists(os.path.join(acct.storage, "retry-heartbeat"))),
        ]
    finally:
        acct.close()


def case17():
    """Recipient config empty: fail closed, but the application is recorded and recoverable."""
    acct = Account(recipients=("",))
    try:
        content = pdf_bytes()
        status, body, _ = acct.post(answers("norcpt-1"), resume=("cv.pdf", content))
        results = [
            check("500 recipient_configuration_invalid with recorded:true and reference",
                  status == 500 and body.get("error") == "recipient_configuration_invalid" and body.get("recorded") is True
                  and body.get("reference") == reference_for("norcpt-1"), "%s %s" % (status, body)),
            check("the CSV row and resume exist", len(acct.csv_rows()) == 2 and len(acct.resumes()) == 1),
            check("nothing mailed", acct.smtp_seen()["messages"] == []),
        ]
        acct.settings["ASCENDREV_CAREERS_TO"] = RCPT_A  # one recipient is enough
        acct.write_config()
        status, body, _ = acct.post(answers("norcpt-1"), resume=("cv.pdf", content))
        results += [
            check("after the fix the replay delivers to the single recipient", status == 200 and len(acct.delivered_to(RCPT_A)) == 1
                  and len(acct.smtp_seen()["messages"]) == 1, "%s %s" % (status, body)),
            check("still one row and one resume", len(acct.csv_rows()) == 2 and len(acct.resumes()) == 1),
        ]
        return results
    finally:
        acct.close()


def case18():
    """Retention: purge removes aged resumes, rows and bookkeeping, keeps the rest, prints counts only."""
    acct = Account(extra_config={"ASCENDREV_CAREERS_RETENTION_DAYS": "30"})
    try:
        acct.post(answers("purge-old", fullName="Zed Oldapplicant"), resume=("cv.pdf", pdf_bytes(2000)))
        acct.post(answers("purge-new", fullName="Newt Newapplicant"), resume=("cv.pdf", pdf_bytes(3000)))
        old_name = "%s.pdf" % hashlib.sha256(b"client:purge-old").hexdigest()
        new_name = "%s.pdf" % hashlib.sha256(b"client:purge-new").hexdigest()

        # Age the first application by rewriting its timestamp, as time passing would.
        path = os.path.join(acct.storage, "applications.csv")
        rows = acct.csv_rows()
        for row in rows[1:]:
            if row[1] == "Zed Oldapplicant":
                row[0] = "2020-01-01T00:00:00+00:00"
        with open(path, "w", encoding="utf-8", newline="") as handle:
            csv.writer(handle).writerows(rows)

        stray_old = os.path.join(acct.storage, "resumes", "f" * 64 + ".pdf")
        stray_new = os.path.join(acct.storage, "resumes", "e" * 64 + ".pdf")
        for stray in (stray_old, stray_new):
            with open(stray, "wb") as handle:
                handle.write(b"%PDF-orphan")
        os.utime(stray_old, (1577836800, 1577836800))  # 2020: an orphan from a long-dead crash

        out, code = acct.cli("purge")
        remaining = acct.csv_rows()
        return [
            check("purge exits 0 and prints counts", code == 0 and "removed_rows=1" in out and "removed_resumes=1" in out and "removed_orphans=1" in out, out),
            check("output and log contain no applicant name", "Oldapplicant" not in out + acct.log() and "Newapplicant" not in out + acct.log(), out),
            check("the aged resume is gone", old_name not in acct.resumes(), str(acct.resumes())),
            check("the recent resume is untouched", new_name in acct.resumes()),
            check("the old orphan is swept and the fresh stray kept", not os.path.exists(stray_old) and os.path.exists(stray_new)),
            check("CSV keeps the header and only the recent row", len(remaining) == 2 and remaining[1][1] == "Newt Newapplicant", str(remaining)),
            check("the aged application's delivery state is gone, the recent one's kept", len(acct.state_paths()) == 1),
            check("purge with an invalid retention exits 1 and deletes nothing",
                  acct.cli("purge", env_extra={"ASCENDREV_CAREERS_RETENTION_DAYS": "0"})[1] == 1 and new_name in acct.resumes()),
        ]
    finally:
        acct.close()


def case19():
    """BACKGROUND path: php-cgi (real multipart upload) with a stand-in litespeed_finish_request()."""
    acct = Account(php_server=False)
    try:
        acct.set_faults(greeting_delay=2)
        marker = os.path.join(acct.base, "finish-marker.json")
        content = pdf_bytes()
        started = time.time()
        acct.cgi_post(answers("bg-1"), ("cv.pdf", content),
                      extra_args=["-d", "auto_prepend_file=" + os.path.join(HERE, "bootstrap_background.php")],
                      env_extra={"TEST_MARKER": marker})
        finished = time.time()
        with open(marker, encoding="utf-8") as handle:
            finish = json.load(handle)
        seen = acct.smtp_seen()
        first_mail_at = min(m["t"] for m in seen["messages"]) if seen["messages"] else None
        queued = json.loads(finish["body"])
        return [
            check("response was 200 queued, with the reference, before delivery began",
                  finish["status"] == 200 and queued == {"ok": True, "recorded": True, "mailed": False, "queued": True, "reference": reference_for("bg-1")}, str(finish)),
            check("response was released >1.5s before the first message reached the server",
                  first_mail_at is not None and first_mail_at - finish["t"] > 1.5, "finish=%.2f first_mail=%s" % (finish["t"], first_mail_at)),
            check("delivery still completed after the response: 2 messages, 1 AUTH", len(seen["messages"]) == 2 and seen["auth"] == 1, str(seen["auth"])),
            check("attachment intact", all(attachment_of(acct.parsed(m)).get_content() == content for m in seen["messages"])),
            check("log has mode=background attempt", "delivery_attempt accepted=2 required=2 mode=background" in acct.log(), acct.log()),
            check("whole run took >= 2s (delivery ran to completion in-process)", finished - started >= 2, "%.2fs" % (finished - started)),
        ]
    finally:
        acct.close()


def case20():
    """Non-ASCII names, header safety, HTML escaping and CSV formula neutralising."""
    acct = Account()
    try:
        name = "José Núñez, Jr."
        status, body, _ = acct.post(answers("odd-1", fullName=name))
        seen = acct.smtp_seen()
        parsed = acct.parsed(seen["messages"][0]) if seen["messages"] else None
        raw = seen["messages"][0]["data"] if seen["messages"] else ""
        header_block = raw.split("\r\n\r\n")[0]
        attachment = attachment_of(parsed) if parsed else None
        results = [
            check("200 and mailed", status == 200 and len(seen["messages"]) == 2, "%s %s" % (status, body)),
            check("subject decodes to the real name", parsed is not None and parsed["Subject"] == "[AscendRev Careers] Outbound Sales Representative: " + name, str(parsed and parsed["Subject"])),
            check("subject is RFC 2047 encoded on the wire, not raw UTF-8",
                  "=?UTF-8?B?" in header_block and header_block.isascii()),
            check("Reply-To keeps the address intact and the name as one display name",
                  parsed is not None and parsed["Reply-To"].addresses[0].addr_spec == "jane.doe@gmail.com" and parsed["Reply-To"].addresses[0].display_name == name
                  and len(parsed["Reply-To"].addresses) == 1, str(parsed and parsed["Reply-To"])),
            check("attachment name is reduced to the safe set", attachment is not None and attachment.get_filename() == "Resume - Jos Nez Jr.pdf", str(attachment and attachment.get_filename())),
            check("name round-trips through the CSV as UTF-8", acct.csv_rows()[-1][1] == name, acct.csv_rows()[-1][1]),
        ]

        # The name is the only free text left, and it is shown in the HTML.
        before = len(acct.smtp_seen()["messages"])
        status, body, _ = acct.post(answers("odd-2", fullName="Pat O'Brien & Sons"))
        html = acct.parsed(acct.smtp_seen()["messages"][before]).get_body(preferencelist=("html",)).get_content()
        results.append(check("HTML escapes the applicant's text", status == 200 and "O&#039;Brien &amp; Sons" in html and "O'Brien & Sons" not in html, "%s" % status))

        status, body, _ = acct.post(answers("odd-3", fullName="-Cmd Doe"))
        results.append(check("CSV cell starting with - is stored as text (leading apostrophe)",
                             status == 200 and acct.csv_rows()[-1][1] == "'-Cmd Doe", str(acct.csv_rows()[-1])))
        return results
    finally:
        acct.close()


def case21():
    """The lib is never served and prints nothing; upload limits ship in .user.ini."""
    acct = Account()
    try:
        direct = subprocess.run([PHP, os.path.join(acct.docroot, "api", "lib", "handler-core.php")], capture_output=True, timeout=60)
        conn = http.client.HTTPConnection("127.0.0.1", acct.web_port, timeout=30)
        conn.request("GET", "/api/lib/handler-core.php")
        response = conn.getresponse()
        served = response.read()
        conn.close()
        htaccess = open(os.path.join(API, "lib", ".htaccess"), encoding="utf-8").read()
        user_ini = open(os.path.join(API, ".user.ini"), encoding="utf-8").read()
        return [
            check("running the lib directly prints nothing", direct.stdout == b"" and direct.stderr == b"", str((direct.stdout, direct.stderr))),
            check("requesting the lib over HTTP returns an empty body", served == b"", str(served[:80])),
            check("lib/.htaccess denies all", htaccess.strip() == "Require all denied", htaccess),
            check(".user.ini sets upload_max_filesize=8M and post_max_size=10M",
                  "upload_max_filesize = 8M" in user_ini and "post_max_size = 10M" in user_ini, user_ini),
            check(".user.ini does not use php_value", "php_value" not in user_ini),
        ]
    finally:
        acct.close()


def case23():
    """siteShiftConfirmed must be exactly 'yes': missing or 'no' is a 422 naming it, with no side effects."""
    acct = Account()
    try:
        results = []
        for label, overrides in (("'no'", {"siteShiftConfirmed": "no"}), ("empty", {"siteShiftConfirmed": ""})):
            status, body, _ = acct.post(answers("shift-" + label, **overrides))
            results.append(check("siteShiftConfirmed %s -> 422 with the field named" % label,
                                 status == 422 and body.get("error") == "validation_failed" and "siteShiftConfirmed" in body.get("fields", []), "%s %s" % (status, body)))
        # Field absent altogether, not just empty.
        fields = answers("shift-absent")
        del fields["siteShiftConfirmed"]
        status, body, _ = acct.post(fields)
        results.append(check("siteShiftConfirmed absent -> 422 with the field named",
                             status == 422 and "siteShiftConfirmed" in body.get("fields", []), "%s %s" % (status, body)))
        results.append(check("nothing stored, no delivery state, no mail", acct.nothing_stored() and acct.smtp_seen()["messages"] == []))
        return results
    finally:
        acct.close()


def case24():
    """The email to Rio: four questions in Rio's wording, the answers, the resume, and nothing from the old form."""
    acct = Account()
    try:
        content = pdf_bytes()
        status, body, _ = acct.post(answers("mail-1", expectedSalary="25000"), resume=("cv.pdf", content))
        seen = acct.smtp_seen()
        message = seen["messages"][0] if seen["messages"] else None
        parsed = acct.parsed(message) if message else None
        text = parsed.get_body(preferencelist=("plain",)).get_content() if parsed else ""
        html = html_lib.unescape(parsed.get_body(preferencelist=("html",)).get_content()) if parsed else ""
        attachment = attachment_of(parsed) if parsed else None
        detail_labels = ("Email", "Phone", "Source", "Reference")
        results = [
            check("200 and one message per recipient", status == 200 and len(seen["messages"]) == 2, "%s %s" % (status, body)),
            check("all four question labels in the HTML", all(q in html for q in QUESTION_LABELS), str([q for q in QUESTION_LABELS if q not in html])),
            check("all four question labels in the plain text", all(q in text for q in QUESTION_LABELS), str([q for q in QUESTION_LABELS if q not in text])),
            check("salary renders as 'PHP 25,000' and the site/shift answer as 'Confirmed' in both parts",
                  "PHP 25,000" in html and "PHP 25,000" in text and "Confirmed" in html and "Confirmed" in text),
            check("detail rows are Email, Phone, Source, Reference (no LinkedIn)",
                  all((">%s<" % label) in parsed.get_body(preferencelist=("html",)).get_content() for label in detail_labels)
                  and "LinkedIn" not in html and "LinkedIn" not in text),
            check("the resume attachment is present and byte-identical", attachment is not None and attachment.get_content() == content),
            check("subject uses the new role title", parsed is not None and parsed["Subject"] == "[AscendRev Careers] Outbound Sales Representative: Jane Doe", str(parsed and parsed["Subject"])),
            check("exactly one attachment and the header image stays inline",
                  len(list(parsed.iter_attachments())) == 1 and "cid:ascendrev-header" in html),
            check("no acknowledgment mail went to the applicant", acct.delivered_to("jane.doe@gmail.com") == []),
        ]
        return results
    finally:
        acct.close()


def case25():
    """An applications.csv in the old column layout is rotated aside, never appended to; cron retry and purge work on the new one."""
    acct = Account(extra_config={"ASCENDREV_CAREERS_RETENTION_DAYS": "30"})
    try:
        os.makedirs(acct.storage, exist_ok=True)
        old_path = os.path.join(acct.storage, "applications.csv")
        old_row = ["2025-01-01T00:00:00+00:00", "Old Applicant", "old@example.test", "09170000000", "team-leader", "none",
                   "none", "yes", "no", "", "20000", "25000", "", "", "resumes/" + "a" * 64 + ".pdf", "0" * 16, "b" * 64]
        with open(old_path, "w", encoding="utf-8", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(OLD_CSV_HEADER)
            writer.writerow(old_row)

        status, body, _ = acct.post(answers("rot-1", fullName="New Applicant"))
        rotated = [n for n in os.listdir(acct.storage) if n.startswith("applications-") and n.endswith(".csv")]
        rotated_rows = []
        if rotated:
            with open(os.path.join(acct.storage, rotated[0]), encoding="utf-8", newline="") as handle:
                rotated_rows = list(csv.reader(handle))
        current = acct.csv_rows()
        results = [
            check("application accepted", status == 200 and body.get("recorded") is True, "%s %s" % (status, body)),
            check("the old file was renamed aside, exactly once", len(rotated) == 1, str(rotated)),
            check("the rotated file is untouched: old header, the one old row, nothing appended",
                  rotated_rows == [OLD_CSV_HEADER, old_row], str(rotated_rows)),
            check("the live applications.csv has the new header and only the new row",
                  len(current) == 2 and current[0] == NEW_CSV_HEADER and current[1][1] == "New Applicant", str(current)),
            check("the email went out", len(acct.smtp_seen()["messages"]) == 2),
        ]

        # Cron retry and purge keep working against the new layout.
        acct.set_faults(auth_reject=True)
        status, body, _ = acct.post(answers("rot-2", fullName="Retry Applicant"))
        acct.set_faults()
        state_path = [p for p in acct.state_paths() if hashlib.sha256(b"client:rot-2").hexdigest() in p][0]
        with open(state_path, encoding="utf-8") as handle:
            state = json.load(handle)
        state["last_attempt_at"] -= 5000
        with open(state_path, "w", encoding="utf-8") as handle:
            json.dump(state, handle)
        before = len(acct.smtp_seen()["messages"])
        out, code = acct.cli("retry")
        retried = acct.smtp_seen()["messages"][before:]
        retried_parsed = acct.parsed(retried[0]) if retried else None
        results += [
            check("first send failed with 503, then cron retry exits 0 and sends the rebuilt email to each recipient",
                  code == 0 and len(retried) == 2 and "attempted=1" in out, "%s %s" % (code, out)),
            check("the retried email carries the new question labels and the resume",
                  retried_parsed is not None and QUESTION_LABELS[2] in retried_parsed.get_body(preferencelist=("plain",)).get_content()
                  and attachment_of(retried_parsed) is not None),
        ]

        rows = acct.csv_rows()
        for row in rows[1:]:
            if row[1] == "New Applicant":
                row[0] = "2020-01-01T00:00:00+00:00"
        with open(os.path.join(acct.storage, "applications.csv"), "w", encoding="utf-8", newline="") as handle:
            csv.writer(handle).writerows(rows)
        out, code = acct.cli("purge")
        remaining = acct.csv_rows()
        results += [
            check("purge on the new layout exits 0 and removes the aged row only",
                  code == 0 and "removed_rows=1" in out and "removed_resumes=1" in out and len(remaining) == 2 and remaining[1][1] == "Retry Applicant", "%s %s" % (out, remaining)),
            check("the rotated old-layout CSV is left alone by purge", rotated and os.path.exists(os.path.join(acct.storage, rotated[0]))),
        ]
        return results
    finally:
        acct.close()


def case22():
    """MUST-FAIL sanity: a wrong expectation has to report FAIL."""
    results = happy("pdf", pdf_bytes(), "careers-sanity", "cv.pdf")
    expected_wrong = [check("exactly 3 messages", False, "deliberately wrong")]
    print("      (deliberate) a wrong expectation reports:")
    for description, passed, detail in expected_wrong:
        if not passed:
            print("        FAIL  %s  [%s]" % (description, detail))
    return [check("harness reports FAIL when the expectation is wrong", any(not p for _, p, _ in expected_wrong)),
            check("and the real happy path under it still passes", all(p for _, p, _ in results))]


def case26():
    """The second role (13 Oct): accepted, labelled in the email and CSV; an unknown role still fails closed."""
    acct = Account()
    try:
        status, body, _ = acct.post(answers("csr-1", role="customer-service-representative"), resume=("cv.pdf", pdf_bytes()))
        seen = acct.smtp_seen()
        parsed = acct.parsed(seen["messages"][0]) if seen["messages"] else None
        rows = acct.csv_rows()
        bad_status, bad_body, _ = acct.post(answers("csr-2", role="chief-executive-officer"), resume=("cv.pdf", pdf_bytes()))
        return [
            check("customer-service-representative -> 200 recorded, one message per recipient",
                  status == 200 and body.get("recorded") is True and len(seen["messages"]) == 2, "%s %s" % (status, body)),
            check("subject names the Customer Service role",
                  parsed is not None and parsed["Subject"] == "[AscendRev Careers] Customer Service Representative: Jane Doe",
                  str(parsed and parsed["Subject"])),
            check("CSV row records the customer-service slug",
                  len(rows) == 2 and "customer-service-representative" in rows[1], str(rows[1:] if len(rows) > 1 else rows)),
            check("unknown role -> 422 naming role, nothing more stored or mailed",
                  bad_status == 422 and "role" in bad_body.get("fields", []) and len(acct.csv_rows()) == 2 and len(acct.smtp_seen()["messages"]) == 2,
                  "%s %s" % (bad_status, bad_body)),
        ]
    finally:
        acct.close()


CASES = [
    ("1  happy path PDF: attachment, filename, bytes, one message per recipient", case1),
    ("2  happy path DOCX", case2),
    ("3  legacy .doc rejected 415 however named, nothing stored", case3),
    ("4  .xlsx / plain .zip / truncated zip as .docx rejected 415", case4),
    ("5  text, exe, extension mismatch, no extension, empty file rejected 415", case5),
    ("6  size limit: 5MB+1 -> 413, exactly 5MB delivered intact", case6),
    ("7  PHP ini limits (upload_max_filesize, post_max_size) -> 413", case7),
    ("8  validation: every bad field named; edge values accepted", case8),
    ("9  unknown field and unknown file field -> 422", case9),
    ("10 honeypot -> 200, no mail, no file", case10),
    ("11 origin 403, GET 405, preflight 204", case11),
    ("12 rate limit 429 on its own bucket", case12),
    ("13 idempotent replay: same key + file -> one file, one email set", case13),
    ("14 same key, different file/answers/type -> 409, original untouched", case14),
    ("15 concurrent duplicates (5 php-cgi): exactly one email set", case15),
    ("16 SMTP down -> 503 recorded, cron retry delivers exactly once", case16),
    ("17 recipient config empty -> 500 recorded; fixed config delivers", case17),
    ("18 purge removes aged resume, row, state; keeps the rest", case18),
    ("19 background path (stand-in litespeed_finish_request) with real upload", case19),
    ("20 non-ASCII name, header encoding, HTML escaping, CSV formula guard", case20),
    ("21 lib not served and silent; .user.ini limits", case21),
    ("22 MUST-FAIL sanity: wrong expectation reports FAIL", case22),
    ("23 siteShiftConfirmed missing or not 'yes' -> 422, nothing stored or mailed", case23),
    ("24 email to Rio: four question labels, PHP 25,000, Confirmed, attachment", case24),
    ("25 old-header CSV rotated aside; retry and purge work on the new layout", case25),
    ("26 second role: customer service accepted and labelled; unknown role 422", case26),
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
