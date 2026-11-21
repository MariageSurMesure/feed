"""Construit feed.json + img/ à partir de la base Notion « Contenus ».
Lancé automatiquement par GitHub toutes les 15 minutes (voir .github/workflows/feed.yml)."""
import io, json, os, sys, urllib.request, datetime
from PIL import Image

TOKEN = os.environ["NOTION_TOKEN"]
CFG = json.load(open("config.json", encoding="utf-8"))
NETS = {"Instagram": "instagram", "TikTok": "tiktok"}
H = {"Authorization": f"Bearer {TOKEN}", "Notion-Version": "2022-06-28", "Content-Type": "application/json"}

def api(path, body=None):
    req = urllib.request.Request("https://api.notion.com/v1/" + path, data=json.dumps(body).encode() if body is not None else None, headers=H, method="POST" if body is not None else "GET")
    return json.load(urllib.request.urlopen(req))

def prop(p, name):
    v = p["properties"].get(name) or {}
    t = v.get("type")
    if t == "title": return "".join(x["plain_text"] for x in v["title"])
    if t == "rich_text": return "".join(x["plain_text"] for x in v["rich_text"])
    if t == "select": return (v["select"] or {}).get("name")
    if t == "date": return (v["date"] or {}).get("start")
    if t == "url": return v["url"]
    if t == "number": return v["number"]
    if t == "files":
        f = v["files"]
        if not f: return None
        f = f[0]; return (f.get("file") or f.get("external") or {}).get("url")
    return None

rows, cursor = [], None
while True:
    body = {"page_size": 100, "filter": {"or": [{"property": "Plateforme", "select": {"equals": n}} for n in NETS]},
            "sorts": [{"property": "Date de publication", "direction": "descending"}]}
    if cursor: body["start_cursor"] = cursor
    r = api(f"databases/{CFG['database_id']}/query", body)
    rows += r["results"]
    if not r.get("has_more"): break
    cursor = r["next_cursor"]

os.makedirs("img", exist_ok=True)
keep, posts = set(), {k: [] for k in NETS.values()}
for p in rows:
    net = NETS[prop(p, "Plateforme")]
    statut = prop(p, "Statut") or ""
    if "Idée" in statut or "Abandonné" in statut: continue
    url = prop(p, "Visuel")
    if not url: continue
    pub = "Publi" in statut
    if pub and sum(1 for x in posts[net] if "Publi" in (x["statut"] or "")) >= 9: continue
    name = p["id"].replace("-", "") + ".jpg"; keep.add(name); path = "img/" + name
    edited = p["last_edited_time"]
    if not (os.path.exists(path) and open(path + ".v").read() == edited if os.path.exists(path + ".v") else False):
        try:
            im = Image.open(io.BytesIO(urllib.request.urlopen(url).read())).convert("RGB")
            s = min(im.size); l, t = (im.width - s) // 2, (im.height - s) // 2
            im.crop((l, t, l + s, t + s)).resize((480, 480)).save(path, quality=82)
            open(path + ".v", "w").write(edited)
        except Exception as e:
            print("image KO", p["id"], e, file=sys.stderr); continue
    vues = prop(p, "Vues")
    posts[net].append({"titre": prop(p, "Titre"), "format": prop(p, "Format") or "", "statut": statut,
        "date": prop(p, "Date de publication"), "lien": prop(p, "Lien publication") or p["url"],
        "img": path + "?v=" + edited[:16], "vues": (f"{vues/1000:.1f} K".replace(".", ",") if vues and vues >= 1000 else (str(int(vues)) if vues else None))})

# --- Instagram en direct (API officielle Meta, optionnel) ---------------------------------
# Si les secrets IG_TOKEN et IG_USER_ID existent : les 9 posts publiés et les chiffres du
# profil viennent directement d'Instagram ; les « À venir » restent ceux du calendrier Notion.
IG_TOKEN, IG_USER = os.environ.get("IG_TOKEN"), os.environ.get("IG_USER_ID")
if IG_TOKEN and IG_USER:
    try:
        g = lambda path: json.load(urllib.request.urlopen(f"https://graph.facebook.com/v21.0/{path}&access_token={IG_TOKEN}"))
        me = g(f"{IG_USER}?fields=username,biography,followers_count,follows_count,media_count,profile_picture_url")
        if me.get("profile_picture_url"):
            im = Image.open(io.BytesIO(urllib.request.urlopen(me["profile_picture_url"]).read())).convert("RGB")
            s = min(im.size); l, t = (im.width - s) // 2, (im.height - s) // 2
            im.crop((l, t, l + s, t + s)).resize((240, 240)).save("avatar.jpg", quality=88)
        prof = CFG["profiles"]["instagram"]
        fr = lambda n: f"{n:,}".replace(",", " ")
        prof["stats"] = [[fr(me["media_count"]), "publications"], [fr(me["followers_count"]), "followers"], [fr(me["follows_count"]), "suivi(e)s"]] if isinstance(prof.get("stats"), list) else prof.get("stats")
        if me.get("biography"): prof["bio"] = me["biography"]
        media = g(f"{IG_USER}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=9")["data"]
        pubs = []
        for m in media:
            src = m.get("thumbnail_url") or m.get("media_url")
            name = "ig" + m["id"] + ".jpg"; path = "img/" + name; keep.add(name)
            if not os.path.exists(path):
                im = Image.open(io.BytesIO(urllib.request.urlopen(src).read())).convert("RGB")
                s = min(im.size); l, t = (im.width - s) // 2, (im.height - s) // 2
                im.crop((l, t, l + s, t + s)).resize((480, 480)).save(path, quality=82)
            fmt = {"VIDEO": "Réel", "CAROUSEL_ALBUM": "Carrousel"}.get(m["media_type"], "Photo")
            pubs.append({"titre": (m.get("caption") or "").split("\n")[0][:80], "format": fmt, "statut": "Publié",
                         "date": m["timestamp"][:10], "lien": m["permalink"], "img": path, "vues": None})
        posts["instagram"] = [x for x in posts["instagram"] if "Publi" not in (x["statut"] or "")] + pubs
    except Exception as e:
        print("Instagram KO, on garde Notion :", e, file=sys.stderr)

for f in os.listdir("img"):
    base = f[:-2] if f.endswith(".v") else f
    if base not in keep: os.remove("img/" + f)

now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=1))).strftime("le %d/%m à %H:%M")
first = next((x["img"] for k in posts for x in posts[k]), "")
avatar = "avatar.jpg?" + now[3:8].replace("/", "") if os.path.exists("avatar.jpg") else first
json.dump({"avatar": avatar, "updated": now, "profiles": CFG["profiles"], "posts": posts},
          open("feed.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in posts.items()})
