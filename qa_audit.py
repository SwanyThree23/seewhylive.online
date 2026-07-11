import subprocess, re, os, time

SRC = "/opt/seewhy/frontend/src/App.jsx"

def chk(label, ok, detail=""):
    sym = "[OK]" if ok else "[!!]"
    print("  " + sym + "  " + label + (" -- " + detail if detail else ""))

print("\n=== SeeWhy LIVE v46 QA Audit ===\n")

with open(SRC,"r") as f:
    src = f.read()
lines = src.split("\n")

print("[ Invariants ]")
checks = [
    ("90/10 Math.floor",      r"Math\.floor\(.*90.*100\)",  False),
    ("No optional chaining",  r"\?\.",                      True),
    ("No nullish coalescing", r"\?\?",                      True),
    ("No localStorage",       r"localStorage",              True),
    ("LiveRoom present",      r"function LiveRoom\(",       False),
    ("ConnectionBar present", r"function ConnectionBar\(",  False),
    ("GreenRoomModal",        r"function GreenRoomModal\(", False),
    ("AppV46Router",          r"function AppV46Router\(",   False),
    ("AnalyticsDashboard",    r"function AnalyticsDashboard\(", False),
    ("ShareModal",            r"function ShareModal\(",     False),
    ("WashingtonClassicBracket", r"function WashingtonClassicBracket\(", False),
    ("Bebas Neue font",       r"Bebas Neue",                False),
]
for label, pat, must_not in checks:
    m = re.findall(pat, src)
    ok = (len(m) == 0) if must_not else (len(m) > 0)
    detail = (str(len(m)) + " violations" if not ok else "clean") if must_not else (str(len(m)) + " matches" if ok else "MISSING")
    chk(label, ok, detail)

print("\n[ All Functions ]")
fns = re.findall(r"^function (\w+)\(", src, re.MULTILINE)
print("  Total: " + str(len(fns)) + "  |  Lines: " + str(len(lines)))
for fn in sorted(fns):
    print("    " + fn)

print("\n[ Build ]")
dist = "/opt/seewhy/frontend/dist"
idx = os.path.join(dist, "index.html")
chk("dist/index.html", os.path.exists(idx))
if os.path.exists(idx):
    age = (time.time() - os.path.getmtime(idx)) / 60
    chk("Build freshness", age < 120, "built " + str(round(age,1)) + " min ago")
    total = sum(os.path.getsize(os.path.join(r,f)) for r,d,files in os.walk(dist) for f in files)
    print("  [OK]  dist size: " + str(round(total/1024)) + " KB")

print("\n[ Route Coverage ]")
for route in ["liveroom","live","home","discover","wallet","profile","analytics"]:
    chk("route: " + route, route in src)

print("\n=== QA Audit Complete ===\n")
