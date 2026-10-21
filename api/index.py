"""
API Backend - Versements Bancaires SNDE
FastAPI déployé comme fonction serverless Vercel
"""

import os
import json
import base64
from datetime import datetime, timedelta, date
from typing import Optional

import psycopg
from psycopg.rows import dict_row
import bcrypt as _bcrypt
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

# ─── Configuration ───────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
ALGORITHM = "HS256"

app = FastAPI(title="Versements SNDE", docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ─── Database ────────────────────────────────────────────────

def db_conn():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


# ─── Auth helpers ────────────────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return _bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")

    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, username, nom_complet, role, actif FROM utilisateurs WHERE id = %s", (user_id,))
        user = cur.fetchone()
    finally:
        conn.close()

    if not user or not user["actif"]:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable ou désactivé")
    return user


def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé à l'administrateur")
    return user


# ─── Modèles Pydantic ───────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    nom_complet: str
    role: str = "dfc"


class UserUpdate(BaseModel):
    nom_complet: Optional[str] = None
    actif: Optional[bool] = None
    password: Optional[str] = None


# ─── Routes Auth ─────────────────────────────────────────────

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, username, password_hash, nom_complet, role, actif FROM utilisateurs WHERE username = %s", (req.username,))
        user = cur.fetchone()
    finally:
        conn.close()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiant ou mot de passe incorrect")

    if not user["actif"]:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    token = create_token({"sub": str(user["id"]), "role": user["role"]})
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "nom_complet": user["nom_complet"],
            "role": user["role"],
        }
    }


@app.get("/api/auth/me")
def me(user=Depends(get_current_user)):
    return user


# ─── Routes Centres ──────────────────────────────────────────

@app.get("/api/centres")
def list_centres(user=Depends(get_current_user)):
    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, nom FROM centres ORDER BY nom")
        return cur.fetchall()
    finally:
        conn.close()


# ─── Routes Versements ───────────────────────────────────────

@app.post("/api/versements")
async def create_versement(
    centre_id: int = Form(...),
    date_versement: str = Form(...),
    montant: float = Form(...),
    banque: str = Form(""),
    observations: str = Form(""),
    image: Optional[UploadFile] = File(None),
    user=Depends(get_current_user),
):
    # Encoder l'image en base64 si fournie
    image_base64 = None
    if image and image.filename:
        content = await image.read()
        # Limiter à 3 Mo
        if len(content) > 3 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image trop volumineuse (max 3 Mo)")
        ext = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else "jpg"
        mime = f"image/{ext}" if ext in ("png", "jpg", "jpeg", "gif", "webp") else "image/jpeg"
        image_base64 = f"data:{mime};base64," + base64.b64encode(content).decode()

    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO versements (centre_id, date_versement, montant, banque, numero_bordereau, observations, image_bordereau, saisi_par)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (centre_id, date_versement, montant, banque, "", observations, image_base64, user["id"]))
        versement_id = cur.fetchone()["id"]

        # Historique
        cur.execute("""
            INSERT INTO historique (versement_id, action, utilisateur_id, details)
            VALUES (%s, 'creation', %s, %s)
        """, (versement_id, user["id"], f"Montant: {montant}"))

        conn.commit()
        return {"id": versement_id, "message": "Versement enregistré"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/api/versements")
def list_versements(
    centre_id: Optional[int] = Query(None),
    date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    user=Depends(get_current_user),
):
    conn = db_conn()
    try:
        cur = conn.cursor()
        conditions = []
        params = []

        if centre_id:
            conditions.append("v.centre_id = %s")
            params.append(centre_id)
        if date_debut:
            conditions.append("v.date_versement >= %s")
            params.append(date_debut)
        if date_fin:
            conditions.append("v.date_versement <= %s")
            params.append(date_fin)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        offset = (page - 1) * limit

        # Total
        cur.execute(f"SELECT COUNT(*) as total FROM versements v {where}", params)
        total = cur.fetchone()["total"]

        # Données (sans l'image pour la liste)
        cur.execute(f"""
            SELECT v.id, v.centre_id, c.nom as centre_nom, v.date_versement,
                   v.montant, v.banque, v.observations,
                   CASE WHEN v.image_bordereau IS NOT NULL THEN true ELSE false END as a_image,
                   u.nom_complet as saisi_par_nom, v.date_saisie
            FROM versements v
            JOIN centres c ON c.id = v.centre_id
            LEFT JOIN utilisateurs u ON u.id = v.saisi_par
            {where}
            ORDER BY v.date_saisie DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])

        rows = cur.fetchall()
        # Convertir les dates
        for r in rows:
            if r.get("date_versement"):
                r["date_versement"] = str(r["date_versement"])
            if r.get("date_saisie"):
                r["date_saisie"] = str(r["date_saisie"])

        return {"data": rows, "total": total, "page": page, "pages": (total + limit - 1) // limit}
    finally:
        conn.close()


@app.get("/api/versements/{versement_id}")
def get_versement(versement_id: int, user=Depends(get_current_user)):
    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT v.*, c.nom as centre_nom, u.nom_complet as saisi_par_nom
            FROM versements v
            JOIN centres c ON c.id = v.centre_id
            LEFT JOIN utilisateurs u ON u.id = v.saisi_par
            WHERE v.id = %s
        """, (versement_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Versement introuvable")
        if row.get("date_versement"):
            row["date_versement"] = str(row["date_versement"])
        if row.get("date_saisie"):
            row["date_saisie"] = str(row["date_saisie"])
        if row.get("modifie_le"):
            row["modifie_le"] = str(row["modifie_le"])
        return row
    finally:
        conn.close()


@app.get("/api/stats")
def get_stats(
    date_debut: Optional[str] = Query(None),
    date_fin: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    conn = db_conn()
    try:
        cur = conn.cursor()
        conditions = []
        params = []
        if date_debut:
            conditions.append("v.date_versement >= %s")
            params.append(date_debut)
        if date_fin:
            conditions.append("v.date_versement <= %s")
            params.append(date_fin)
        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Total global
        cur.execute(f"SELECT COUNT(*) as nb, COALESCE(SUM(montant), 0) as total FROM versements v {where}", params)
        global_stats = cur.fetchone()

        # Par centre
        cur.execute(f"""
            SELECT c.nom, COUNT(*) as nb_versements, SUM(v.montant) as total_montant
            FROM versements v JOIN centres c ON c.id = v.centre_id
            {where}
            GROUP BY c.nom ORDER BY total_montant DESC
        """, params)
        par_centre = cur.fetchall()

        return {
            "total_versements": global_stats["nb"],
            "montant_total": float(global_stats["total"]),
            "par_centre": par_centre,
        }
    finally:
        conn.close()


# ─── Routes Utilisateurs (admin) ─────────────────────────────

@app.get("/api/users")
def list_users(user=Depends(require_admin)):
    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, username, nom_complet, role, actif, date_creation FROM utilisateurs ORDER BY nom_complet")
        rows = cur.fetchall()
        for r in rows:
            if r.get("date_creation"):
                r["date_creation"] = str(r["date_creation"])
        return rows
    finally:
        conn.close()


@app.post("/api/users")
def create_user(req: UserCreate, user=Depends(require_admin)):
    conn = db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM utilisateurs WHERE username = %s", (req.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")

        hashed = hash_password(req.password)
        cur.execute("""
            INSERT INTO utilisateurs (username, password_hash, nom_complet, role)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (req.username, hashed, req.nom_complet, req.role))
        new_id = cur.fetchone()["id"]
        conn.commit()
        return {"id": new_id, "message": "Utilisateur créé"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.put("/api/users/{user_id}")
def update_user(user_id: int, req: UserUpdate, user=Depends(require_admin)):
    conn = db_conn()
    try:
        cur = conn.cursor()
        updates = []
        params = []
        if req.nom_complet is not None:
            updates.append("nom_complet = %s")
            params.append(req.nom_complet)
        if req.actif is not None:
            updates.append("actif = %s")
            params.append(req.actif)
        if req.password is not None:
            updates.append("password_hash = %s")
            params.append(hash_password(req.password))

        if not updates:
            raise HTTPException(status_code=400, detail="Rien à modifier")

        params.append(user_id)
        cur.execute(f"UPDATE utilisateurs SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"message": "Utilisateur modifié"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ─── Health check ────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "time": str(datetime.utcnow())}
